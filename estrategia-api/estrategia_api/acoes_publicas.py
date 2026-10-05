from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from indicadoresEstrategicos.models import IndicadorEstrategico
from iniciativasEstrategicas.models import IniciativaEstrategica
from objetivosEstrategicos.models import ObjetivoEstrategico
from projetosEstrategicos.models import ProjetoEstrategico
from unidades.models import Unidade


class AcoesEstrategicasPublicasView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        projetos = (
            ProjetoEstrategico.objects.filter(status='APROVADO')
            .select_related('unidade', 'responsavel')
            .prefetch_related('objetivos').order_by('id')
        )
        iniciativas = (
            IniciativaEstrategica.objects.filter(status='APROVADO')
            .select_related('unidade', 'responsavel')
            .prefetch_related('objetivos').order_by('id')
        )
        indicadores = (
            IndicadorEstrategico.objects.filter(status='APROVADO')
            .select_related('unidade', 'responsavel', 'objetivo').order_by('id')
        )

        registros = []
        for tipo, queryset in (
            ('projetos', projetos),
            ('indicadores', indicadores),
            ('iniciativas', iniciativas),
        ):
            for registro in queryset:
                objetivos = (
                    [registro.objetivo] if tipo == 'indicadores'
                    else sorted(registro.objetivos.all(), key=lambda objetivo: objetivo.codigo)
                )
                responsavel = registro.responsavel
                registros.append({
                    'id': registro.id,
                    'tipo': tipo,
                    'titulo': registro.nome,
                    'unidade_id': registro.unidade_id,
                    'unidade_sigla': registro.unidade.sigla,
                    'responsavel': (
                        responsavel.nome_social or responsavel.nome_completo
                    ) if responsavel else None,
                    'objetivos': [
                        {'id': objetivo.id, 'codigo': objetivo.codigo}
                        for objetivo in objetivos
                    ],
                    'data_atualizacao': getattr(registro, 'ultima_atualizacao', None),
                    'data_cadastro': (
                        registro.data_envio if tipo == 'indicadores'
                        else getattr(registro, 'data_preenchimento', None)
                    ),
                })

        return Response({
            'registros': registros,
            'unidades': list(Unidade.objects.order_by('sigla').values('id', 'sigla', 'nome')),
            'objetivos': list(
                ObjetivoEstrategico.objects.order_by('codigo').values('id', 'codigo', 'descricao')
            ),
        })


class AcaoEstrategicaPublicaDetalheView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, tipo, pk):
        from django.shortcuts import get_object_or_404
        from rest_framework.exceptions import NotFound

        modelos = {
            'projetos': ProjetoEstrategico,
            'indicadores': IndicadorEstrategico,
            'iniciativas': IniciativaEstrategica,
        }
        if tipo not in modelos:
            raise NotFound()
        registro = get_object_or_404(
            modelos[tipo].objects.select_related('unidade', 'responsavel'),
            pk=pk, status='APROVADO',
        )
        responsavel = registro.responsavel
        objetivos = [registro.objetivo] if tipo == 'indicadores' else registro.objetivos.all()
        dados = {
            'id': registro.id,
            'nome': registro.nome,
            'unidade_nome': registro.unidade.nome,
            'unidade_sigla': registro.unidade.sigla,
            'responsavel_nome': (responsavel.nome_social or responsavel.nome_completo) if responsavel else None,
            'objetivos_detalhes': [
                {'id': objetivo.id, 'codigo': objetivo.codigo, 'descricao': objetivo.descricao}
                for objetivo in objetivos
            ],
        }
        if tipo == 'projetos':
            campos = ('descricao', 'tempo_estimado', 'custo_estimado', 'ultima_atualizacao',
                      'percentual_progresso', 'acoes_previstas')
            dados['evolucoes'] = list(registro.evolucoes.order_by('id').values('id', 'descricao', 'tipo'))
            dados['acoes'] = list(registro.acoes.order_by('id').values(
                'id', 'nome', 'prazo_inicio', 'prazo_fim', 'custo_estimado', 'custo_realizado',
                'data_inicio_efetivo', 'data_fim_efetivo', 'status'
            ))
            dados['custo_realizado'] = registro.custo_realizado_total
        elif tipo == 'indicadores':
            campos = ('finalidade', 'polaridade', 'unidade_medida', 'metodo_calculo', 'formula',
                      'observacao', 'data_envio')
            dados['evolucao_indicador'] = list(registro.evolucao_indicador.order_by('ano', 'id').values(
                'id', 'ano', 'meta_prevista', 'meta_alcancada'))
        else:
            campos = ('data_preenchimento', 'ultima_atualizacao', 'observacao', 'percentual_evolucao')
            dados['acoes_realizadas'] = list(registro.acoes_realizadas.order_by('prazo_inicio', 'id').values(
                'id', 'nome', 'prazo_inicio', 'prazo_fim', 'custo', 'status'))
        dados.update({campo: getattr(registro, campo) for campo in campos})
        return Response(dados)
