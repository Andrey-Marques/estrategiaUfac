from rest_framework.test import APITestCase
from usuarios.models import Usuario
from .models import ObjetivoEstrategico


class PermissoesObjetivosTests(APITestCase):
    def setUp(self):
        self.objetivo = ObjetivoEstrategico.objects.create(codigo='OE1', descricao='Original')

    def test_servidor_e_gestor_so_podem_ler(self):
        for papel in ('SERVIDOR', 'GESTOR'):
            usuario = Usuario.objects.create_user(username=papel.lower(), papel=papel)
            self.client.force_authenticate(usuario)
            self.assertEqual(self.client.get('/api/objetivos/').status_code, 200)
            for metodo, url, dados in (
                ('post', '/api/objetivos/', {'codigo': 'OE2', 'descricao': 'Outro'}),
                ('put', f'/api/objetivos/{self.objetivo.pk}/', {'codigo': 'OE1', 'descricao': 'Alterado'}),
                ('patch', f'/api/objetivos/{self.objetivo.pk}/', {'descricao': 'Alterado'}),
                ('delete', f'/api/objetivos/{self.objetivo.pk}/', {}),
            ):
                with self.subTest(papel=papel, metodo=metodo):
                    self.assertEqual(getattr(self.client, metodo)(url, dados, format='json').status_code, 403)
        self.objetivo.refresh_from_db()
        self.assertEqual(self.objetivo.descricao, 'Original')
        self.assertEqual(ObjetivoEstrategico.objects.count(), 1)

    def test_admin_pode_criar_editar_e_excluir(self):
        self.client.force_authenticate(Usuario.objects.create_user(username='admin', papel='ADMIN'))
        resposta = self.client.post('/api/objetivos/', {'codigo': 'OE2', 'descricao': 'Novo'}, format='json')
        self.assertEqual(resposta.status_code, 201)
        url = f"/api/objetivos/{resposta.data['id']}/"
        self.assertEqual(self.client.patch(url, {'descricao': 'Editado'}, format='json').status_code, 200)
        self.assertEqual(self.client.delete(url).status_code, 204)

    def test_anonimo_nao_acessa_api_privada(self):
        self.assertEqual(self.client.get('/api/objetivos/').status_code, 401)
