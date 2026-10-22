from rest_framework import serializers
from .models import Usuario
from .models import cpf_sem_mascara
from django.db import IntegrityError, transaction
from django.db.models.functions import Lower, Trim
import re


class IdentificacaoUnicaMixin:
    def usuarios_outros(self):
        usuarios = Usuario.objects.all()
        if self.instance is not None:
            usuarios = usuarios.exclude(pk=self.instance.pk)
        return usuarios

    def validate_email(self, value):
        value = value.strip().lower()
        if value and self.usuarios_outros().annotate(email_normalizado=Lower(Trim('email'))).filter(email_normalizado=value).exists():
            raise serializers.ValidationError('Já existe um usuário com este e-mail.')
        return value

    def validate_cpf(self, value):
        if not value.strip():
            return ''
        if re.search(r'[^0-9.\-\s]', value):
            raise serializers.ValidationError('Informe o CPF com 11 dígitos.')
        digitos = re.sub(r'\D', '', value)
        if len(digitos) != 11:
            raise serializers.ValidationError('Informe o CPF com 11 dígitos.')
        if self.usuarios_outros().annotate(cpf_normalizado=cpf_sem_mascara()).filter(cpf_normalizado=digitos).exists():
            raise serializers.ValidationError('Já existe um usuário com este CPF.')
        return f'{digitos[:3]}.{digitos[3:6]}.{digitos[6:9]}-{digitos[9:]}'

    def save(self, **kwargs):
        try:
            with transaction.atomic():
                return super().save(**kwargs)
        except IntegrityError as erro:
            mensagem = str(erro)
            if 'usuario_email_unico' in mensagem:
                raise serializers.ValidationError({'email': 'Já existe um usuário com este e-mail.'}) from erro
            if 'usuario_cpf_unico' in mensagem:
                raise serializers.ValidationError({'cpf': 'Já existe um usuário com este CPF.'}) from erro
            raise


class UsuarioSerializer(IdentificacaoUnicaMixin, serializers.ModelSerializer):
    def validate(self, dados):
        dados = super().validate(dados)
        papel = dados.get('papel', getattr(self.instance, 'papel', 'SERVIDOR'))
        unidade = dados.get('unidade', getattr(self.instance, 'unidade', None))
        if papel == 'ADMIN' and (unidade is None or unidade.sigla != 'PROPLAN'):
            raise serializers.ValidationError({
                'unidade': 'Administradores devem pertencer à unidade PROPLAN.'
            })
        request = self.context.get('request')
        if request is None or self.instance is None:
            return dados
        usuario = request.user
        if usuario.papel != 'ADMIN':
            if 'papel' in dados and dados['papel'] != self.instance.papel:
                raise serializers.ValidationError({'papel': 'Apenas administradores podem alterar o perfil.'})
            if 'unidade' in dados and dados['unidade'] != self.instance.unidade:
                raise serializers.ValidationError({'unidade': 'Apenas administradores podem alterar a unidade.'})
        if usuario.pk == self.instance.pk and dados.get('is_active') is False:
            raise serializers.ValidationError({'is_active': 'Você não pode inativar o seu próprio usuário.'})
        return dados

    class Meta:
        model = Usuario
        fields = [
            'id', 'username', 'password', 'nome_completo',
            'nome_social', 'cpf', 'papel', 'unidade', 'email', 'date_joined', 'is_active'
        ]
        extra_kwargs = {'password': {'write_only': True}}

    def validate_password(self, value):
        if self.instance is not None:
            raise serializers.ValidationError('Use a opção Alterar senha no seu perfil.')
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        return Usuario.objects.create_user(
            password=password,
            **validated_data
        )


class MeuPerfilSerializer(IdentificacaoUnicaMixin, serializers.ModelSerializer):
    unidade_nome = serializers.CharField(
        source='unidade.nome',
        read_only=True
    )
    unidade_sigla = serializers.CharField(
        source='unidade.sigla',
        read_only=True
    )

    class Meta:
        model = Usuario
        fields = [
            'id',
            'username',
            'nome_completo',
            'nome_social',
            'cpf',
            'papel',
            'unidade',
            'unidade_nome',
            'unidade_sigla',
            'email',
            'date_joined',
            'is_active'
        ]
        read_only_fields = [
            'id',
            'papel',
            'unidade',
            'unidade_sigla',
            'unidade_nome'
        ]

class SolicitarRecuperacaoSenhaSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)


class ConfirmarRecuperacaoSenhaSerializer(serializers.Serializer):
    uid = serializers.CharField(max_length=200)
    token = serializers.CharField(max_length=200)
    nova_senha = serializers.CharField(write_only=True, trim_whitespace=False, max_length=1024)
    confirmar_senha = serializers.CharField(write_only=True, trim_whitespace=False, max_length=1024)

    def validate(self, dados):
        if dados['nova_senha'] != dados['confirmar_senha']:
            raise serializers.ValidationError({'confirmar_senha': 'As senhas não coincidem.'})
        return dados


class AlterarSenhaSerializer(serializers.Serializer):
    senha_atual = serializers.CharField(write_only=True, trim_whitespace=False, max_length=1024)
    nova_senha = serializers.CharField(write_only=True, trim_whitespace=False, max_length=1024)
    confirmar_senha = serializers.CharField(write_only=True, trim_whitespace=False, max_length=1024)

    def validate(self, attrs):
        from django.contrib.auth.password_validation import validate_password
        from django.core.exceptions import ValidationError as DjangoValidationError
        usuario = self.context['request'].user
        if not usuario.check_password(attrs['senha_atual']):
            raise serializers.ValidationError({'senha_atual': 'A senha atual está incorreta.'})
        if attrs['nova_senha'] != attrs['confirmar_senha']:
            raise serializers.ValidationError({'confirmar_senha': 'As novas senhas não coincidem.'})
        if usuario.check_password(attrs['nova_senha']):
            raise serializers.ValidationError({'nova_senha': 'Escolha uma senha diferente da atual.'})
        try:
            validate_password(attrs['nova_senha'], usuario)
        except DjangoValidationError as erro:
            raise serializers.ValidationError({'nova_senha': erro.messages})
        return attrs
