from rest_framework import serializers
from .models import IndicadorEstrategico, EvolucaoIndicador

class EvolucaoIndicadorSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvolucaoIndicador
        fields = '__all__'
class IndicadorEstrategicoSerializer(serializers.ModelSerializer):
    evolucao_indicador = EvolucaoIndicadorSerializer(many = True, read_only = True)
    
    class Meta:
        
        model = IndicadorEstrategico
        fields = '__all__'
    