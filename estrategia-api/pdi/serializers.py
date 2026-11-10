from rest_framework import serializers
from .models import PDI

class PDISerializer(serializers.ModelSerializer):
    quantidade_iniciativas = serializers.IntegerField(source='iniciativas_count', read_only=True)

    class Meta:
        model = PDI
        fields = [
            'id',
            'nome',
            'data_inicio',
            'data_fim',
            'status',
            'planejamento',
            'quantidade_iniciativas',
        ]
        read_only_fields = ['quantidade_iniciativas']

    def validate(self, attrs):
        data_inicio = attrs.get('data_inicio', getattr(self.instance, 'data_inicio', None))
        data_fim = attrs.get('data_fim', getattr(self.instance, 'data_fim', None))
        planejamento = attrs.get('planejamento', getattr(self.instance, 'planejamento', None))

        if (
            self.instance
            and 'planejamento' in attrs
            and planejamento.pk != self.instance.planejamento_id
        ):
            raise serializers.ValidationError({
                'planejamento': 'O planejamento do PDI não pode ser alterado após a criação.'
            })

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