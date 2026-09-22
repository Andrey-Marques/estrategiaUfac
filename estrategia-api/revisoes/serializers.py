from rest_framework import serializers
from decimal import Decimal
from datetime import date, datetime
from .models import RevisaoEdicao
from projetosEstrategicos.serializers import (EvolucaoProjetoSerializer, EvolucaoOrcamentariaSerializer)


class SubmissaoRevisaoProjetoSerializer(serializers.Serializer):

    percentual_progresso = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        min_value=0,
        max_value=100,
        required=False
    )

    evolucoes = EvolucaoProjetoSerializer(
        many=True,
        required=False
    )

    evolucoesOrcamentarias = (
        EvolucaoOrcamentariaSerializer(
            many=True,
            required=False
        )
    )

class RevisaoEdicaoSerializer(serializers.ModelSerializer):

    criado_por_nome = serializers.SerializerMethodField()
    analisado_por_nome = serializers.SerializerMethodField()

    class Meta:
        model = RevisaoEdicao

        fields = [
            'id',
            'entidade',
            'entidade_id',
            'dados_anteriores',
            'dados_propostos',
            'diferencas',
            'status',
            'observacao',
            'criado_por',
            'criado_por_nome',
            'analisado_por',
            'analisado_por_nome',
            'criado_em',
            'analisado_em',
        ]

        read_only_fields = fields

    def get_criado_por_nome(self,  obj):
        
        return (obj.criado_por.get_full_name()  or obj.criado_por.username)

    def get_analisado_por_nome(self, obj):

        if not obj.analisado_por:
            return None

        return (obj.analisado_por.get_full_name() or obj.analisado_por.username)
    
    def tornar_serializavel(valor):

        if isinstance(valor, Decimal):
            return str(valor)

        if isinstance(valor, (date, datetime)):
            return valor.isoformat()

        if isinstance(valor, list):
            return [
                tornar_serializavel(item)
                for item in valor
            ]

        if isinstance(valor, dict):
            return {
                chave: tornar_serializavel(valor)
                for chave, valor in valor.items()
            }

        return valor
    
    def calcular_diferencas(dados_anteriores,   dados_propostos):
        diferencas = {}
        chaves = (set(dados_anteriores.keys()) | set(dados_propostos.keys()))
        for chave in chaves:
            
            anterior = dados_anteriores.get(chave)
            proposto = dados_propostos.get(chave)

            if anterior != proposto:
                diferencas[chave] = {
                    'anterior': anterior,
                    'proposto': proposto
                }

        return diferencas