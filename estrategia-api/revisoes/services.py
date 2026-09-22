from decimal import Decimal
from datetime import date, datetime
from rest_framework.exceptions import ValidationError
from .models import RevisaoEdicao
from django.db import transaction
from django.utils import timezone

from projetosEstrategicos.models import (ProjetoEstrategico, EvolucaoProjeto,  EvolucaoOrcamentaria)


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

def calcular_diferencas(
    dados_anteriores,
    dados_propostos
):

    diferencas = {}

    chaves = (
        set(dados_anteriores.keys())
        | set(dados_propostos.keys())
    )

    for chave in chaves:

        anterior = dados_anteriores.get(
            chave
        )

        proposto = dados_propostos.get(
            chave
        )

        if anterior != proposto:

            diferencas[chave] = {
                'anterior': anterior,
                'proposto': proposto
            }

    return diferencas

def snapshot_projeto(projeto):

    return {

        'percentual_progresso': str(
            projeto.percentual_progresso
        ),

        'evolucoes': [
            {
                'descricao':
                    evolucao.descricao,

                'tipo':
                    evolucao.tipo,
            }

            for evolucao
            in projeto.evolucoes.all()
        ],

        'evolucoesOrcamentarias': [
            {
                'valor':
                    str(evolucao.valor),

                'descricao':
                    evolucao.descricao,

                'data_registro':
                    evolucao.data_registro.isoformat()
            }

            for evolucao
            in projeto.evolucoesOrcamentarias.all()
        ]
    }
    
def montar_proposta_projeto(
    projeto,
    dados
):

    proposta = snapshot_projeto(
        projeto
    )

    if 'percentual_progresso' in dados:

        proposta['percentual_progresso'] = str(
            dados['percentual_progresso']
        )

    if 'evolucoes' in dados:

        proposta['evolucoes'] = [
            {
                'descricao':
                    evolucao['descricao'],

                'tipo':
                    evolucao['tipo']
            }

            for evolucao
            in dados['evolucoes']
        ]

    if 'evolucoesOrcamentarias' in dados:

        proposta['evolucoesOrcamentarias'] = [
            {
                'valor':
                    str(evolucao['valor']),

                'descricao':
                    evolucao.get(
                        'descricao',
                        ''
                    ),

                'data_registro':
                    evolucao[
                        'data_registro'
                    ].isoformat()
            }

            for evolucao
            in dados[
                'evolucoesOrcamentarias'
            ]
        ]

    return proposta

def criar_revisao_projeto(
    projeto,
    dados,
    usuario
):

    # Só existe revisão para algo
    # que já está publicado.
    if projeto.status != 'APROVADO':

        raise ValidationError({
            'detail':
                'Somente projetos publicados '
                'podem gerar revisão de edição.'
        })

    # Não permite duas alterações
    # pendentes simultaneamente.
    if RevisaoEdicao.objects.filter(
        entidade='PROJETO',
        entidade_id=projeto.id,
        status='PENDENTE'
    ).exists():

        raise ValidationError({
            'detail':
                'Este projeto já possui uma '
                'alteração aguardando análise.'
        })

    anteriores = snapshot_projeto(
        projeto
    )

    propostos = montar_proposta_projeto(
        projeto,
        dados
    )

    diferencas = calcular_diferencas(
        anteriores,
        propostos
    )

    if not diferencas:

        raise ValidationError({
            'detail':
                'Nenhuma alteração foi realizada.'
        })

    return RevisaoEdicao.objects.create(
        entidade='PROJETO',

        entidade_id=projeto.id,

        dados_anteriores=anteriores,

        dados_propostos=propostos,

        diferencas=diferencas,

        criado_por=usuario
    )
    
    
@transaction.atomic
def aprovar_revisao_projeto(
    revisao,
    administrador
):

    if revisao.status != 'PENDENTE':

        raise ValidationError({
            'detail':
                'Esta revisão já foi analisada.'
        })

    projeto = (
        ProjetoEstrategico.objects
        .select_for_update()
        .get(
            id=revisao.entidade_id
        )
    )

    dados = revisao.dados_propostos

    # --------------------------------
    # PERCENTUAL
    # --------------------------------

    projeto.percentual_progresso = (
        dados['percentual_progresso']
    )

    projeto.save()

    # --------------------------------
    # REALIZAÇÕES / PRÓXIMOS PASSOS
    # --------------------------------

    projeto.evolucoes.all().delete()

    for evolucao in dados.get(
        'evolucoes',
        []
    ):

        EvolucaoProjeto.objects.create(
            fk_projeto=projeto,

            descricao=evolucao[
                'descricao'
            ],

            tipo=evolucao['tipo']
        )

    # --------------------------------
    # EVOLUÇÃO ORÇAMENTÁRIA
    # --------------------------------

    projeto.evolucoesOrcamentarias.all().delete()

    for evolucao in dados.get(
        'evolucoesOrcamentarias',
        []
    ):

        EvolucaoOrcamentaria.objects.create(
            fk_projeto=projeto,

            valor=evolucao['valor'],

            descricao=evolucao.get(
                'descricao',
                ''
            ),

            data_registro=evolucao[
                'data_registro'
            ]
        )

    # --------------------------------
    # REVISÃO APROVADA
    # --------------------------------

    revisao.status = 'APROVADA'

    revisao.analisado_por = (
        administrador
    )

    revisao.analisado_em = (
        timezone.now()
    )

    revisao.save()

    return projeto

        @transaction.atomic
    def rejeitar_revisao(
        revisao,
        administrador,
        observacao
    ):

        if revisao.status != 'PENDENTE':

            raise ValidationError({
                'detail':
                    'Esta revisão já foi analisada.'
            })

        observacao = (
            observacao or ''
        ).strip()

        if not observacao:

            raise ValidationError({
                'observacao':
                    'Informe o motivo da rejeição.'
            })

        revisao.status = 'REJEITADA'

        revisao.observacao = observacao

        revisao.analisado_por = (
            administrador
        )

        revisao.analisado_em = (
            timezone.now()
        )

        revisao.save()

        return revisao