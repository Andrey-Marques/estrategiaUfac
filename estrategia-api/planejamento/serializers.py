from rest_framework import serializers
from .models import Planejamento    

class PlanejamentoSerializer(serializers.ModelSerializer):
    quantidade_objetivos = serializers.IntegerField(source='objetivos_count', read_only=True)

    class Meta:
        model = Planejamento
        fields = ['id', 'nome', 'data_inicio', 'data_fim', 'status', 'quantidade_objetivos']
        read_only_fields = ['quantidade_objetivos']

    def validate(self, attrs):
        data_inicio = attrs.get('data_inicio', getattr(self.instance, 'data_inicio', None))
        data_fim = attrs.get('data_fim', getattr(self.instance, 'data_fim', None))
        if data_inicio and data_fim and data_fim < data_inicio:
            raise serializers.ValidationError({
                'data_fim': 'A data de fim não pode ser anterior à data de início.'
            })
        return attrs