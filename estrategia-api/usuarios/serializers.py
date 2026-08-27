from rest_framework import serializers
from .models import Usuario

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id','username','password','nome_completo','papel','unidade']
        extra_kwargs = {'password': { 'write_only': True}}
        
    def create(self, validated_data):
        password = validated_data.pop('password')
        
        usuario = Usuario.objects.create_user(password = password, **validated_data) 
        return usuario