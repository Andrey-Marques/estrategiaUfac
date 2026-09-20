from rest_framework import serializers
from .models import IndicadorEstrategico, EvolucaoIndicador


class EvolucaoIndicadorSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvolucaoIndicador
        fields = [
            'id',
            'ano',
            'meta_prevista',
            'meta_alcancada'
        ]


class IndicadorEstrategicoSerializer(serializers.ModelSerializer):

    evolucao_indicador = EvolucaoIndicadorSerializer(
        many=True,
        required=False
    )

    responsavel_nome = serializers.SerializerMethodField()
    unidade_sigla = serializers.CharField(
        source='unidade.sigla',
        read_only=True
    )

    objetivo_detalhes = serializers.SerializerMethodField()

    class Meta:
        model = IndicadorEstrategico
        fields = [
            'id',
            'nome',
            'polaridade',
            'finalidade',
            'status',
            'metodo_calculo',
            'formula',
            'observacao',
            'unidade_medida',
            'unidade',
            'objetivo',
            'responsavel',
            'data_envio',
            'observacao_analise',
            'responsavel_nome',
            'unidade_sigla',
            'objetivo_detalhes',
            'evolucao_indicador',
        ]
        read_only_fields = [
            'data_envio',
        ]

    def get_responsavel_nome(self, obj):
        nome = obj.responsavel.get_full_name().strip()
        return nome or obj.responsavel.username


    def get_objetivo_detalhes(self, obj):
        if not obj.objetivo:
            return None

        return {
            'id': obj.objetivo.id,
            'codigo': obj.objetivo.codigo,
            'descricao': obj.objetivo.descricao
        }

    def create(self, validated_data):

        evolucoes = validated_data.pop('evolucao_indicador',[])

        indicador = IndicadorEstrategico.objects.create(**validated_data)

        for evolucao in evolucoes:
            EvolucaoIndicador.objects.create(indicador=indicador, **evolucao)
        return indicador

    def update(self, instance, validated_data):

        evolucoes = validated_data.pop('evolucao_indicador', None)
        for atributo, valor in validated_data.items():
            setattr(instance,  atributo,  valor)
        instance.save()

        if evolucoes is not None:
            instance.evolucao_indicador.all().delete()
            for evolucao in evolucoes:
                EvolucaoIndicador.objects.create(indicador=instance, **evolucao)

        return instance