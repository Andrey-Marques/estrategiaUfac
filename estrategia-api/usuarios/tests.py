from types import SimpleNamespace
from unittest.mock import patch

from django.test import SimpleTestCase, override_settings
from rest_framework.test import APITestCase

from .login import ip_cliente
from .models import Usuario
from unidades.models import Unidade


class PermissoesUsuariosTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.unidade = Unidade.objects.create(nome='Unidade A', sigla='UA')
        cls.outra = Unidade.objects.create(nome='Unidade B', sigla='UB')
        cls.admin = Usuario.objects.create_user(username='admin', papel='ADMIN', unidade=cls.unidade)
        cls.gestor = Usuario.objects.create_user(username='gestor', papel='GESTOR', unidade=cls.unidade)
        cls.servidor = Usuario.objects.create_user(username='servidor', papel='SERVIDOR', unidade=cls.unidade)
        cls.externo = Usuario.objects.create_user(username='externo', papel='SERVIDOR', unidade=cls.outra)

    def test_gestor_nao_altera_perfil_ou_unidade_por_patch_ou_put(self):
        self.client.force_authenticate(self.gestor)
        for metodo in ('patch', 'put'):
            for alvo in (self.gestor, self.servidor):
                for campo, valor in (('papel', 'ADMIN'), ('unidade', self.outra.pk)):
                    with self.subTest(metodo=metodo, alvo=alvo.pk, campo=campo):
                        dados = {'username': alvo.username, 'nome_completo': 'Nome', campo: valor}
                        resposta = getattr(self.client, metodo)(f'/api/usuarios/{alvo.pk}/', dados, format='json')
                        self.assertEqual(resposta.status_code, 400, resposta.data)
                        alvo.refresh_from_db()
                        self.assertNotEqual(alvo.papel, 'ADMIN')
                        self.assertEqual(alvo.unidade_id, self.unidade.pk)

    def test_gestor_edita_dados_comuns_com_perfil_e_unidade_inalterados(self):
        self.client.force_authenticate(self.gestor)
        resposta = self.client.patch(f'/api/usuarios/{self.servidor.pk}/', {
            'nome_social': 'Novo nome', 'papel': 'SERVIDOR', 'unidade': self.unidade.pk,
        }, format='json')
        self.assertEqual(resposta.status_code, 200, resposta.data)

    def test_gestor_nao_edita_nem_exclui_admin_ou_usuario_externo(self):
        self.client.force_authenticate(self.gestor)
        for alvo in (self.admin, self.externo):
            self.assertEqual(self.client.patch(f'/api/usuarios/{alvo.pk}/', {'email': 'novo@example.com'}).status_code, 404)
            self.assertEqual(self.client.delete(f'/api/usuarios/{alvo.pk}/').status_code, 404)

    def test_admin_pode_alterar_perfil_e_unidade(self):
        self.client.force_authenticate(self.admin)
        resposta = self.client.patch(f'/api/usuarios/{self.servidor.pk}/', {
            'papel': 'GESTOR', 'unidade': self.outra.pk,
        }, format='json')
        self.assertEqual(resposta.status_code, 200, resposta.data)

    def test_nao_permite_auto_inativacao_nem_em_formato_string(self):
        self.client.force_authenticate(self.gestor)
        resposta = self.client.patch(f'/api/usuarios/{self.gestor.pk}/', {'is_active': 'false'}, format='json')
        self.assertEqual(resposta.status_code, 400)

    def test_servidor_nao_edita_usuarios(self):
        self.client.force_authenticate(self.servidor)
        self.assertEqual(self.client.patch(f'/api/usuarios/{self.servidor.pk}/', {'papel': 'ADMIN'}).status_code, 404)


@override_settings(TRUSTED_PROXY_HOSTS=('frontend',))
class IpClienteTests(SimpleTestCase):
    def requisicao(self, remoto, original='', encaminhado=''):
        return SimpleNamespace(META={'REMOTE_ADDR': remoto, 'HTTP_X_REAL_IP': original, 'HTTP_X_FORWARDED_FOR': encaminhado})

    @patch('usuarios.login.socket.getaddrinfo', return_value=[(2, 1, 6, '', ('172.20.0.3', 0))])
    def test_proxy_confiavel_separa_clientes_e_contadores(self, resolver):
        from .login import LoginSeguroView
        limites = []
        for endereco in ('192.0.2.1', '192.0.2.2'):
            request = self.requisicao('172.20.0.3', endereco)
            request.data = {'username': 'mesma_conta'}
            self.assertEqual(ip_cliente(request), endereco)
            limites.append(LoginSeguroView().limites(request))
        self.assertEqual(limites[0][0], limites[1][0])
        self.assertNotEqual(limites[0][1], limites[1][1])

    @patch('usuarios.login.socket.getaddrinfo', return_value=[(2, 1, 6, '', ('172.20.0.3', 0))])
    def test_cliente_direto_nao_pode_falsificar_ip(self, resolver):
        self.assertEqual(ip_cliente(self.requisicao('192.0.2.1', '192.0.2.99', '192.0.2.88')), '192.0.2.1')

    @patch('usuarios.login.socket.getaddrinfo', return_value=[(2, 1, 6, '', ('172.20.0.3', 0))])
    def test_ip_original_invalido_ou_lista_nao_e_aceito(self, resolver):
        for original in ('', 'invalido', '192.0.2.1, 192.0.2.2'):
            self.assertEqual(ip_cliente(self.requisicao('172.20.0.3', original)), '172.20.0.3')

    @patch('usuarios.login.socket.getaddrinfo', side_effect=OSError)
    def test_falha_dns_nao_confia_em_cabecalhos(self, resolver):
        self.assertEqual(ip_cliente(self.requisicao('192.0.2.1', '192.0.2.99')), '192.0.2.1')

    @override_settings(TRUSTED_PROXY_HOSTS=())
    def test_execucao_local_nao_confia_em_proxy_por_padrao(self):
        self.assertEqual(ip_cliente(self.requisicao('127.0.0.1', '192.0.2.99')), '127.0.0.1')

@override_settings(
    TRUSTED_PROXY_HOSTS=('frontend',), LOGIN_MAX_FAILURES=2, LOGIN_IP_MAX_FAILURES=2,
    PASSWORD_HASHERS=['django.contrib.auth.hashers.MD5PasswordHasher'],
)
class LimitesLoginTests(APITestCase):
    def setUp(self):
        Usuario.objects.create_user(username='conta', password='SenhaDeTeste123!')

    @patch('usuarios.login.socket.getaddrinfo', return_value=[(2, 1, 6, '', ('172.20.0.3', 0))])
    def test_bloqueio_de_ip_nao_afeta_outro_cliente_do_mesmo_proxy(self, resolver):
        for nome, esperado in (('inexistente1', 401), ('inexistente2', 429)):
            resposta = self.client.post('/api/login/', {'username': nome, 'password': 'errada'},
                REMOTE_ADDR='172.20.0.3', HTTP_X_REAL_IP='192.0.2.1')
            self.assertEqual(resposta.status_code, esperado)
        resposta = self.client.post('/api/login/', {'username': 'conta', 'password': 'SenhaDeTeste123!'},
            REMOTE_ADDR='172.20.0.3', HTTP_X_REAL_IP='192.0.2.2')
        self.assertEqual(resposta.status_code, 200)

    @patch('usuarios.login.socket.getaddrinfo', return_value=[(2, 1, 6, '', ('172.20.0.3', 0))])
    def test_conta_permanece_bloqueada_ao_trocar_ip(self, resolver):
        for ip, esperado in (('192.0.2.1', 401), ('192.0.2.2', 429), ('192.0.2.3', 429)):
            resposta = self.client.post('/api/login/', {'username': 'conta', 'password': 'errada'},
                REMOTE_ADDR='172.20.0.3', HTTP_X_REAL_IP=ip)
            self.assertEqual(resposta.status_code, esperado)
