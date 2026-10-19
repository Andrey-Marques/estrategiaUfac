import hashlib
import math
import socket
from ipaddress import ip_address
from datetime import timedelta
from django.conf import settings
from django.db.models import F
from django.utils import timezone
from rest_framework.exceptions import AuthenticationFailed, Throttled
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import TentativaLogin


def chave_conta(username):
    return 'conta:' + hashlib.sha256(username.encode('utf-8')).hexdigest()


def liberar_conta(username):
    TentativaLogin.objects.filter(chave=chave_conta(username)).delete()


def ip_cliente(request):
    remoto = request.META.get('REMOTE_ADDR', '')
    try:
        endereco_remoto = ip_address(remoto)
    except ValueError:
        return 'desconhecido'
    # Somente o proxy configurado pode informar o IP original. A resolução
    # por nome acompanha mudanças de endereço ao recriar o container.
    for host in settings.TRUSTED_PROXY_HOSTS:
        try:
            enderecos = socket.getaddrinfo(host, None, type=socket.SOCK_STREAM)
        except OSError:
            continue
        if any(ip_address(item[4][0]) == endereco_remoto for item in enderecos):
            try:
                return str(ip_address(request.META.get('HTTP_X_REAL_IP', '')))
            except ValueError:
                break
    return str(endereco_remoto)


class LoginSeguroView(TokenObtainPairView):
    def limites(self, request):
        username = request.data.get('username', '')
        username = username.strip() if isinstance(username, str) else ''
        ip = ip_cliente(request)
        chave_ip = 'ip:' + hashlib.sha256(ip.encode('utf-8')).hexdigest()
        return [
            (chave_conta(username), settings.LOGIN_MAX_FAILURES),
            (chave_ip, settings.LOGIN_IP_MAX_FAILURES),
        ]

    def verificar_bloqueio(self, limites):
        agora = timezone.now()
        espera = 0
        for chave, limite in limites:
            registro = TentativaLogin.objects.filter(chave=chave, falhas__gte=limite, expira_em__gt=agora).first()
            if registro:
                espera = max(espera, math.ceil((registro.expira_em - agora).total_seconds()))
        if espera:
            raise Throttled(wait=espera, detail='Muitas tentativas de login. Aguarde antes de tentar novamente ou use a recuperação de senha.')

    def registrar_falha(self, limites):
        agora = timezone.now()
        expira = agora + timedelta(seconds=settings.LOGIN_LOCKOUT_SECONDS)
        # Remove somente contadores vencidos; não armazena senhas nem nomes/IPs em texto.
        TentativaLogin.objects.filter(expira_em__lte=agora).delete()
        for chave, limite in limites:
            TentativaLogin.objects.get_or_create(chave=chave, defaults={'expira_em': expira})
            TentativaLogin.objects.filter(chave=chave).update(falhas=F('falhas') + 1)
            # A janela de bloqueio começa quando o limite é atingido.
            TentativaLogin.objects.filter(chave=chave, falhas=limite).update(expira_em=expira)

    def post(self, request, *args, **kwargs):
        limites = self.limites(request)
        self.verificar_bloqueio(limites)
        try:
            resposta = super().post(request, *args, **kwargs)
        except AuthenticationFailed:
            self.registrar_falha(limites)
            self.verificar_bloqueio(limites)
            raise AuthenticationFailed('Usuário ou senha inválidos.')
        # Não zerar o contador do IP: ele protege outras contas contra varreduras.
        TentativaLogin.objects.filter(chave=limites[0][0]).delete()
        return resposta
