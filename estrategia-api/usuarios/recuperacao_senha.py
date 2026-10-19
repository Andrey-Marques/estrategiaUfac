import logging
from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import send_mail
from django.db import transaction
from django.db.models.functions import Lower, Trim
from django.template.loader import render_to_string
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView
from .models import Usuario
from .login import liberar_conta
from .serializers import SolicitarRecuperacaoSenhaSerializer, ConfirmarRecuperacaoSenhaSerializer

logger = logging.getLogger(__name__)


class RecuperacaoSenhaThrottle(AnonRateThrottle):
    rate = '5/hour'
    scope = 'recuperacao_senha'


class RedefinicaoSenhaThrottle(AnonRateThrottle):
    rate = '20/hour'
    scope = 'redefinicao_senha'


class SolicitarRecuperacaoSenhaView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [RecuperacaoSenhaThrottle]

    def post(self, request):
        serializer = SolicitarRecuperacaoSenhaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email'].strip()
        usuario = Usuario.objects.annotate(email_normalizado=Lower(Trim('email'))).filter(email_normalizado=email.lower(), is_active=True).first()
        if usuario and usuario.has_usable_password():
            uid = urlsafe_base64_encode(force_bytes(usuario.pk))
            token = default_token_generator.make_token(usuario)
            link = f'{settings.FRONTEND_URL}/redefinir-senha/{uid}/{token}'
            mensagem = render_to_string('usuarios/email_recuperacao_senha.txt', {
                'link': link, 'minutos': settings.PASSWORD_RESET_TIMEOUT // 60,
            })
            try:
                send_mail('Redefinição de senha — Estratégia UFAC', mensagem, None, [usuario.email], fail_silently=False)
            except Exception:
                # Não registrar credenciais, destinatário ou token.
                logger.error('Falha no envio do e-mail de recuperação de senha.')
        return Response({'detail': 'Se houver uma conta elegível com esse e-mail, você receberá as instruções de recuperação.'})


class ConfirmarRecuperacaoSenhaView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [RedefinicaoSenhaThrottle]

    def post(self, request):
        serializer = ConfirmarRecuperacaoSenhaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        dados = serializer.validated_data
        erro_link = {'detail': 'Link inválido ou expirado. Solicite um novo e-mail de recuperação.'}
        try:
            identificador = int(force_str(urlsafe_base64_decode(dados['uid'])))
            if identificador <= 0 or identificador > 9223372036854775807:
                raise ValueError
        except (ValueError, TypeError, OverflowError, UnicodeError):
            raise ValidationError(erro_link)
        with transaction.atomic():
            try:
                usuario = Usuario.objects.select_for_update().get(pk=identificador, is_active=True)
            except Usuario.DoesNotExist:
                raise ValidationError(erro_link)
            if not usuario.has_usable_password() or not default_token_generator.check_token(usuario, dados['token']):
                raise ValidationError(erro_link)
            try:
                validate_password(dados['nova_senha'], user=usuario)
            except DjangoValidationError as erro:
                raise ValidationError({'nova_senha': erro.messages})
            if usuario.check_password(dados['nova_senha']):
                raise ValidationError({'nova_senha': 'Escolha uma senha diferente da anterior.'})
            hash_anterior = usuario.password
            usuario.set_password(dados['nova_senha'])
            # A condição impede duas utilizações simultâneas mesmo no SQLite.
            if Usuario.objects.filter(pk=usuario.pk, password=hash_anterior).update(password=usuario.password) != 1:
                raise ValidationError(erro_link)
            liberar_conta(usuario.username)
        return Response({'detail': 'Senha redefinida com sucesso. Entre com sua nova senha.'})
