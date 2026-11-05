from rest_framework import serializers
from .models import IndicadorEstrategico, EvolucaoIndicador


class EvolucaoIndicadorSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvolucaoIndicador
        fields = [
            'id',
            'ano',
            'meta_prevista',
            'meta_alcancada',
            'justificativa_meta_alcancada',
        ]

    def validate(self, attrs):
        meta_alcancada = str(attrs.get('meta_alcancada', '')).strip()
        justificativa = str(attrs.get('justificativa_meta_alcancada', '')).strip()

        if meta_alcancada and not justificativa:
            raise serializers.ValidationError({
                'justificativa_meta_alcancada': (
                    'Informe como o resultado da meta alcançada foi obtido.'
                )
            })

        attrs['meta_alcancada'] = meta_alcancada
        attrs['justificativa_meta_alcancada'] = justificativa
        return attrs


from revisoes.exclusao import ExclusaoSerializerMixin

class IndicadorEstrategicoSerializer(ExclusaoSerializerMixin, serializers.ModelSerializer):

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
            'pode_excluir',
            'nome',
            'polaridade',
            'finalidade',
            'status',
            'metodo_calculo',
            'formula',
            'observacao',
            'unidade_medida',
            'unidade',
            'planejamento',
            'planejamento_nome',
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
            'planejamento_nome',
        ]
        extra_kwargs = {'formula': {'required': False, 'allow_blank': True}}

    def validate(self, attrs):
        planejamento = attrs.get('planejamento', getattr(self.instance, 'planejamento', None))
        objetivo = attrs.get('objetivo', getattr(self.instance, 'objetivo', None))
        if planejamento is None:
            raise serializers.ValidationError({'planejamento': 'Selecione um planejamento.'})
        if objetivo is None or objetivo.planejamento_id != planejamento.id:
            raise serializers.ValidationError({
                'objetivo': 'O objetivo deve pertencer ao planejamento selecionado.'
            })

        if attrs.get('status') == 'REJEITADO':
            observacao = (attrs.get('observacao_analise') or '').strip()
            if not observacao:
                raise serializers.ValidationError({
                    'observacao_analise': 'Informe o motivo da rejeição.'
                })
            attrs['observacao_analise'] = observacao
        return attrs

    planejamento_nome = serializers.CharField(source='planejamento.nome', read_only=True)

    def validate_evolucao_indicador(self, evolucoes):
        anos = [str(evolucao['ano']).strip() for evolucao in evolucoes]
        if len(anos) != len(set(anos)):
            raise serializers.ValidationError('Cada ano pode ser informado apenas uma vez.')
        return evolucoes

    def get_responsavel_nome(self, obj):
        if obj.responsavel is None:
            return None

        return (
            obj.responsavel.nome_social
            or obj.responsavel.nome_completo
        )


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
            usuario = self.context.get('request').user if self.context.get('request') else None
            if instance.status == 'APROVADO' and getattr(usuario, 'papel', None) != 'ADMIN':
                atuais = {
                    evolucao.ano: evolucao
                    for evolucao in instance.evolucao_indicador.all()
                }
                propostas = {evolucao['ano']: evolucao for evolucao in evolucoes}

                if set(atuais) != set(propostas):
                    raise serializers.ValidationError({
                        'evolucao_indicador': (
                            'Após a publicação, não é permitido adicionar, remover ou alterar o ano das metas.'
                        )
                    })

                for ano, evolucao in propostas.items():
                    if atuais[ano].meta_prevista != evolucao['meta_prevista']:
                        raise serializers.ValidationError({
                            'evolucao_indicador': (
                                'Após a publicação, a meta prevista não pode ser alterada.'
                            )
                        })
            instance.evolucao_indicador.all().delete()
            for evolucao in evolucoes:
                EvolucaoIndicador.objects.create(indicador=instance, **evolucao)

        return instance
