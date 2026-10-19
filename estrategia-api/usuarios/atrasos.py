from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


class AcoesEmAtrasoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from projetosEstrategicos.models import AcaoProjeto
        from iniciativasEstrategicas.models import AcaoRealizada
        hoje = timezone.localdate()
        resultado = {'projetos': [], 'iniciativas': []}
        for tipo, modelo, vinculo in [('projetos', AcaoProjeto, 'fk_projeto'), ('iniciativas', AcaoRealizada, 'fk_iniciativa')]:
            acoes = modelo.objects.filter(prazo_inicio__lt=hoje, data_inicio_efetivo__isnull=True, **{f'{vinculo}__status': 'APROVADO'}).exclude(status__in=['CONCLUIDA', 'CANCELADA']).select_related(vinculo).order_by('prazo_inicio', 'id')
            if tipo == 'projetos':
                acoes = acoes.filter(fk_projeto__status_execucao='ANDAMENTO')
            if request.user.papel != 'ADMIN':
                acoes = acoes.filter(**{f'{vinculo}__unidade_id': request.user.unidade_id})
            for acao in acoes:
                registro = getattr(acao, vinculo)
                resultado[tipo].append({
                    'tipo': tipo,
                    'registro_id': registro.pk, 'registro_nome': registro.nome,
                    'acao_id': acao.pk, 'acao_nome': acao.nome,
                    'prazo_inicio': acao.prazo_inicio, 'dias_atraso': (hoje - acao.prazo_inicio).days,
                })
        return Response(resultado)
