from rest_framework import serializers
from .models import PDI

class PDISerializer(serializers.ModelSerializer):
    class Meta:
        model = PDI
        fields = '__all__'

    def validate(self, attrs):
        data_inicio = attrs.get('data_inicio', getattr(self.instance, 'data_inicio', None))
        data_fim = attrs.get('data_fim', getattr(self.instance, 'data_fim', None))
        planejamento = attrs.get('planejamento', getattr(self.instance, 'planejamento', None))

        if data_inicio and data_fim and data_fim < data_inicio:
            raise serializers.ValidationError({
                'data_fim': 'A data de fim não pode ser anterior à data de início.'
            })

        if planejamento and data_inicio and data_fim:
            if data_inicio < planejamento.data_inicio or data_fim > planejamento.data_fim:
                raise serializers.ValidationError({
                    'non_field_errors': [
                        'O período do PDI deve estar dentro do período do planejamento escolhido.'
                    ]
                })

        return attrs