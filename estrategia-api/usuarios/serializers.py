from rest_framework import serializers
from .models import Usuario


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = [
            'id', 'username', 'password', 'nome_completo',
            'nome_social', 'cpf', 'papel', 'unidade', 'email'
        ]
        extra_kwargs = {'password': {'write_only': True}}

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
            'email'
        ]
        read_only_fields = [
            'id',
            'username',
            'nome_completo',
            'papel',
            'unidade',
            'unidade_nome'
        ]