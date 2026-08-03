from rest_framework import serializers
from .models import ProjetoEstrategico, EvolucaoProjeto, EvolucaoOrcamentaria

class EvolucaoProjetoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvolucaoProjeto
        fields = '__all__'
    
class EvolucaoOrcamentariaSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvolucaoOrcamentaria
        fields = '__all__'

class ProjetoEstrategicoSerializer(serializers.ModelSerializer):
    
    evolucoes = EvolucaoProjetoSerializer(many = True, read_only = True)
    
    evolucoesOrcamentarias = EvolucaoOrcamentariaSerializer(many = True, read_only = True)
    
    class Meta:
        model = ProjetoEstrategico
        fields = '__all__'