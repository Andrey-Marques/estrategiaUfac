from rest_framework import serializers
from .models import IniciativaEstrategica, AcaoRealizada

class AcaoRealizadaSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcaoRealizada
        fields = '__all__'    

class IniciativaEstrategicaSerializer(serializers.ModelSerializer):
    acoes_realizadas = AcaoRealizadaSerializer(many = True, read_only = True)
        
    class Meta:
        
        model = IniciativaEstrategica
        fields = '__all__'