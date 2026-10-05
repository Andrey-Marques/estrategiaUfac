from django.db import transaction
from rest_framework import serializers
from objetivosEstrategicos.models import ObjetivoEstrategico
from .models import AcaoProjeto, ProjetoEstrategico, EvolucaoProjeto

class EvolucaoProjetoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvolucaoProjeto
        fields = '__all__'

        read_only_fields = ['fk_projeto']

        extra_kwargs = {'descricao': {'allow_blank': False, 'required': True},
            'tipo': {'required': True},
        }


class AcaoProjetoSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    custo_estimado = serializers.DecimalField(
        max_digits=20, decimal_places=2, min_value=0
    )
    custo_realizado = serializers.DecimalField(
        max_digits=20, decimal_places=2, min_value=0, required=False, default=0
    )

    class Meta:
        model = AcaoProjeto
        fields = [
            'id',
            'nome',
            'prazo_inicio',
            'prazo_fim',
            'custo_estimado',
            'custo_realizado',
            'data_inicio_efetivo',
            'data_fim_efetivo',
            'status',
        ]

    def validate(self, attrs):
        prazo_inicio = attrs.get('prazo_inicio')
        prazo_fim = attrs.get('prazo_fim')
        data_inicio_efetivo = attrs.get('data_inicio_efetivo')
        data_fim_efetivo = attrs.get('data_fim_efetivo')

        if prazo_inicio and prazo_fim and prazo_fim < prazo_inicio:
            raise serializers.ValidationError(
                {'prazo_fim': 'O fim previsto não pode ser anterior ao início previsto.'}
            )
        if data_inicio_efetivo and data_fim_efetivo and data_fim_efetivo < data_inicio_efetivo:
            raise serializers.ValidationError(
                {'data_fim_efetivo': 'O fim efetivo não pode ser anterior ao início efetivo.'}
            )
        return attrs


class ProjetoEstrategicoSerializer(serializers.ModelSerializer):
    responsavel_nome = serializers.SerializerMethodField()
    custo_estimado = serializers.DecimalField(max_digits=20, decimal_places=2, read_only=True)
    custo_realizado = serializers.DecimalField(
        max_digits=20, decimal_places=2, source='custo_realizado_total', read_only=True
    )

    unidade_sigla = serializers.CharField(
        source='unidade.sigla',
        read_only=True
    )
    objetivos = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=ObjetivoEstrategico.objects.all(),
        required=False
    )
    
    objetivos_detalhes = serializers.SerializerMethodField()

    evolucoes = EvolucaoProjetoSerializer(many=True, required=False)
    acoes = AcaoProjetoSerializer(many=True, required=False)

    class Meta:
        model = ProjetoEstrategico
        fields = '__all__'
        extra_kwargs = {
            'descricao': {'required': False, 'allow_blank': True},
            'acoes_previstas': {'required': False, 'allow_blank': True},
        }
        
    def get_objetivos_detalhes(self, obj):
        return [
            {
                'id': objetivo.id,
                'codigo': objetivo.codigo,
                'descricao': objetivo.descricao
            }
            for objetivo in obj.objetivos.all()
        ]

    def _salvar_evolucoes(self, projeto, evolucoes):

        if not evolucoes:
            return

        for evolucao in evolucoes:

            descricao = (evolucao.get('descricao') or '').strip()
            tipo = evolucao.get('tipo')

            if not descricao:
                continue

            EvolucaoProjeto.objects.create(fk_projeto=projeto,  descricao=descricao,  tipo=tipo)

    def _salvar_acoes(self, projeto, acoes):
        for acao in acoes:
            AcaoProjeto.objects.create(fk_projeto=projeto, **acao)


    @transaction.atomic
    def create(self, validated_data):
        objetivos = validated_data.pop('objetivos', [])
        evolucoes = validated_data.pop('evolucoes', [])
        acoes = validated_data.pop('acoes', [])
        projeto = ProjetoEstrategico.objects.create(**validated_data)
        projeto.objetivos.set(objetivos)

        self._salvar_evolucoes(projeto, evolucoes)
        self._salvar_acoes(projeto, acoes)
        projeto.atualizar_custo_estimado()

        projeto.refresh_from_db()

        return projeto

    @transaction.atomic
    def update(self, instance, validated_data):

        evolucoes = validated_data.pop('evolucoes', None)
        acoes = validated_data.pop('acoes', None)
        objetivos = validated_data.pop('objetivos',None)

        for atributo, valor in validated_data.items():
            setattr(
                instance,
                atributo,
                valor
            )
        instance.save()

        if objetivos is not None:
            instance.objetivos.set(
                objetivos
            )

        if evolucoes is not None:
            instance.evolucoes.all().delete()
            self._salvar_evolucoes(instance, evolucoes)

        if acoes is not None:
            instance.acoes.all().delete()
            self._salvar_acoes(instance, acoes)

        instance.atualizar_custo_estimado()

        return instance

    def get_responsavel_nome(self, obj):
        if obj.responsavel is None:
            return None

        return obj.responsavel.nome_social or obj.responsavel.nome_completo
