from rest_framework import serializers
from .models import IndicadorEstrategico, EvolucaoIndicador

class EvolucaoIndicadorSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvolucaoIndicador
        fields = ['id', 'ano', 'meta_prevista', 'meta_alcancada']
class IndicadorEstrategicoSerializer(serializers.ModelSerializer):
    evolucao_indicador = EvolucaoIndicadorSerializer(many = True, read_only = True)
    
    class Meta:
        
        model = IndicadorEstrategico
        fields = ['id', 'nome', 'polaridade', 'finalidade', 'status', 'metodo_calculo', 'formula', 'observacao', 'unidade', 'objetivo', 'responsavel', 'evolucao_indicador', 'unidade_medida']
    def create(self, validated_data):
        evolucoes = validated_data.pop('evolucao_indicador', [])
        indicador = IndicadorEstrategico.objects.create(**validated_data)
        for evolucao in evolucoes:
            EvolucaoIndicador.objects.create(indicador = indicador, **evolucao)
        return indicador
    