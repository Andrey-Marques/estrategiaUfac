from rest_framework import serializers
from .models import Usuario


class UsuarioSerializer(serializers.ModelSerializer):
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


class MeuPerfilSerializer(serializers.ModelSerializer):
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
            'username',
            'nome_completo',
            'papel',
            'unidade',
            'unidade_sigla',
            'unidade_nome'
        ]

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
