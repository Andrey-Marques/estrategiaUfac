from decimal import Decimal
from datetime import date, datetime
from rest_framework.exceptions import ValidationError
from .models import RevisaoEdicao
from django.db import transaction
from django.utils import timezone

from projetosEstrategicos.models import (ProjetoEstrategico, EvolucaoProjeto,  EvolucaoOrcamentaria)
from iniciativasEstrategicas.models import IniciativaEstrategica, AcaoRealizada
from indicadoresEstrategicos.models import IndicadorEstrategico, EvolucaoIndicador


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


def snapshot_iniciativa(iniciativa):
    return {
        'percentual_evolucao': str(iniciativa.percentual_evolucao),
        'observacao': iniciativa.observacao or '',
        'acoes': [
            {
                'nome': acao.nome,
                'prazo_inicio': acao.prazo_inicio.isoformat(),
                'prazo_fim': acao.prazo_fim.isoformat(),
                'custo': str(acao.custo),
                'status': acao.status,
            }
            for acao in iniciativa.acoes_realizadas.all()
        ],
    }


def criar_revisao_iniciativa(iniciativa, dados, usuario):
    if iniciativa.status != 'APROVADO':
        raise ValidationError({'detail': 'Somente iniciativas publicadas podem gerar revisão de edição.'})

    if RevisaoEdicao.objects.filter(
        entidade='INICIATIVA', entidade_id=iniciativa.id, status='PENDENTE'
    ).exists():
        raise ValidationError({'detail': 'Esta iniciativa já possui uma alteração aguardando análise.'})

    anteriores = snapshot_iniciativa(iniciativa)
    propostos = dict(anteriores)

    if 'percentual_evolucao' in dados:
        propostos['percentual_evolucao'] = str(dados['percentual_evolucao'])
    if 'observacao' in dados:
        propostos['observacao'] = dados['observacao']
    if 'acoes' in dados:
        propostos['acoes'] = [
            {
                'nome': acao['nome'],
                'prazo_inicio': acao['prazo_inicio'].isoformat(),
                'prazo_fim': acao['prazo_fim'].isoformat(),
                'custo': str(acao['custo']),
                'status': acao['status'],
            }
            for acao in dados['acoes']
        ]

    diferencas = calcular_diferencas(anteriores, propostos)
    if not diferencas:
        raise ValidationError({'detail': 'Nenhuma alteração foi realizada.'})

    return RevisaoEdicao.objects.create(
        entidade='INICIATIVA', entidade_id=iniciativa.id,
        dados_anteriores=anteriores, dados_propostos=propostos,
        diferencas=diferencas, criado_por=usuario
    )


@transaction.atomic
def aprovar_revisao_iniciativa(revisao, administrador):
    if revisao.status != 'PENDENTE':
        raise ValidationError({'detail': 'Esta revisão já foi analisada.'})

    iniciativa = IniciativaEstrategica.objects.select_for_update().get(id=revisao.entidade_id)
    dados = revisao.dados_propostos
    iniciativa.percentual_evolucao = dados['percentual_evolucao']
    iniciativa.observacao = dados.get('observacao', '')
    iniciativa.save(update_fields=['percentual_evolucao', 'observacao', 'ultima_atualizacao'])

    iniciativa.acoes_realizadas.all().delete()
    for acao in dados.get('acoes', []):
        AcaoRealizada.objects.create(fk_iniciativa=iniciativa, **acao)

    revisao.status = 'APROVADA'
    revisao.analisado_por = administrador
    revisao.analisado_em = timezone.now()
    revisao.save()
    return iniciativa


def snapshot_indicador(indicador):
    return {
        'observacao': indicador.observacao or '',
        'evolucao_indicador': [
            {
                'ano': evolucao.ano,
                'meta_prevista': evolucao.meta_prevista,
                'meta_alcancada': evolucao.meta_alcancada,
            }
            for evolucao in indicador.evolucao_indicador.all()
        ],
    }


def criar_revisao_indicador(indicador, dados, usuario):
    if indicador.status != 'APROVADO':
        raise ValidationError({'detail': 'Somente indicadores publicados podem gerar revisão de edição.'})

    if RevisaoEdicao.objects.filter(
        entidade='INDICADOR', entidade_id=indicador.id, status='PENDENTE'
    ).exists():
        raise ValidationError({'detail': 'Este indicador já possui uma alteração aguardando análise.'})

    anteriores = snapshot_indicador(indicador)
    propostos = dict(anteriores)
    if 'observacao' in dados:
        propostos['observacao'] = dados['observacao']
    if 'evolucao_indicador' in dados:
        propostos['evolucao_indicador'] = [
            {
                'ano': evolucao['ano'],
                'meta_prevista': evolucao['meta_prevista'],
                'meta_alcancada': evolucao['meta_alcancada'],
            }
            for evolucao in dados['evolucao_indicador']
        ]

    diferencas = calcular_diferencas(anteriores, propostos)
    if not diferencas:
        raise ValidationError({'detail': 'Nenhuma alteração foi realizada.'})

    return RevisaoEdicao.objects.create(
        entidade='INDICADOR', entidade_id=indicador.id,
        dados_anteriores=anteriores, dados_propostos=propostos,
        diferencas=diferencas, criado_por=usuario
    )


@transaction.atomic
def aprovar_revisao_indicador(revisao, administrador):
    if revisao.status != 'PENDENTE':
        raise ValidationError({'detail': 'Esta revisão já foi analisada.'})

    indicador = IndicadorEstrategico.objects.select_for_update().get(id=revisao.entidade_id)
    dados = revisao.dados_propostos
    indicador.observacao = dados.get('observacao', '')
    indicador.save(update_fields=['observacao'])

    indicador.evolucao_indicador.all().delete()
    for evolucao in dados.get('evolucao_indicador', []):
        EvolucaoIndicador.objects.create(indicador=indicador, **evolucao)

    revisao.status = 'APROVADA'
    revisao.analisado_por = administrador
    revisao.analisado_em = timezone.now()
    revisao.save()
    return indicador

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
def rejeitar_revisao(revisao, administrador, observacao):

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