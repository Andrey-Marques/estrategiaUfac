from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet
from .models import ProjetoEstrategico, EvolucaoProjeto
from .serializers import ProjetoEstrategicoSerializer, EvolucaoProjetoSerializer
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError

class ProjetoEstrategicoViewSet(ModelViewSet):
    queryset = ProjetoEstrategico.objects.all()
    serializer_class = ProjetoEstrategicoSerializer 
    
    def get_queryset(self):
        usuario = self.request.user
        
        if usuario.papel == 'ADMIN':
            return ProjetoEstrategico.objects.all()
        
        return ProjetoEstrategico.objects.filter(
            unidade = usuario.unidade
        )
    
    def perform_create(self, serializer):
        usuario = self.request.user

        if usuario.papel == 'ADMIN':
            serializer.save(
                status='APROVADO'
            )
            return

        responsavel_selecionado = serializer.validated_data.get(
            'responsavel'
        )

        if responsavel_selecionado is None:
            raise ValidationError({
                'responsavel':
                'Selecione um líder para o projeto.'
            })

        if responsavel_selecionado.unidade_id != usuario.unidade_id:
            raise ValidationError({
                'responsavel':
                'O líder do projeto deve pertencer à sua unidade.'
            })

        status_solicitado = self.request.data.get(
            'status'
        )

        status_projeto = (
            'RASCUNHO'
            if status_solicitado == 'RASCUNHO'
            else 'EM_ESPERA'
        )

        serializer.save(
            unidade=usuario.unidade,
            responsavel=responsavel_selecionado,
            status=status_projeto
        )
            
    def _validar_campos_edicao(self, request):

        usuario = request.user
        # ADMIN pode alterar qualquer campo
        if usuario.papel == 'ADMIN':
            return None

        # Demais usuários só podem alterar evoluções
        campos_permitidos = {
            'evolucoes'
        }

        campos_enviados = set(
            request.data.keys()
        )

        campos_proibidos = (
            campos_enviados - campos_permitidos
        )

        if campos_proibidos:

            return Response(
                {
                    'detail':
                    'Você só pode alterar realizações e próximos passos do projeto.',

                    'campos_proibidos':
                    list(campos_proibidos)
                },
                status=status.HTTP_403_FORBIDDEN
            )

        return None
    
    def update(self, request, *args, **kwargs):

        erro = self._validar_campos_edicao(request)

        if erro is not None:
            return erro

        return super().update(
            request,
            *args,
            **kwargs
        )
        
    def partial_update( self, request, *args, **kwargs):
        erro = self._validar_campos_edicao(request)

        if erro is not None:
            return erro

        return super().partial_update(
            request,
            *args,
            **kwargs
        )
    
    @action(detail=True, methods=['post'])
    def aprovar(self, request, pk=None):
        usuario = request.user

        if usuario.papel != 'ADMIN':
            return Response(
                {
                    'detail':
                    'Apenas administradores podem aprovar projetos.'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        projeto = self.get_object()

        if projeto.status != 'EM_ESPERA':
            return Response(
                {
                    'detail':
                    'Este projeto não está aguardando análise.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        observacao = (
            request.data.get('observacao') or ''
        ).strip()

        projeto.status = 'APROVADO'
        projeto.observacao_analise = observacao
        projeto.data_analise = timezone.now()
        projeto.analisado_por = usuario

        projeto.save(
            update_fields=[
                'status',
                'observacao_analise',
                'data_analise',
                'analisado_por',
                'ultima_atualizacao'
            ]
        )

        serializer = self.get_serializer(projeto)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )
    @action(detail=True, methods=['post'])
    def rejeitar(self, request, pk=None):
        usuario = request.user

        if usuario.papel != 'ADMIN':
            return Response(
                {
                    'detail':
                    'Apenas administradores podem rejeitar projetos.'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        projeto = self.get_object()

        if projeto.status != 'EM_ESPERA':
            return Response(
                {
                    'detail':
                    'Este projeto não está aguardando análise.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        observacao = (
            request.data.get('observacao') or ''
        ).strip()

        if not observacao:
            return Response(
                {
                    'observacao':
                    'Informe o motivo da rejeição.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        projeto.status = 'REJEITADO'
        projeto.observacao_analise = observacao
        projeto.data_analise = timezone.now()
        projeto.analisado_por = usuario

        projeto.save(
            update_fields=[
                'status',
                'observacao_analise',
                'data_analise',
                'analisado_por',
                'ultima_atualizacao'
            ]
        )

        serializer = self.get_serializer(projeto)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )


class EvolucaoProjetoViewSet(ReadOnlyModelViewSet):
    queryset = EvolucaoProjeto.objects.all()
    serializer_class = EvolucaoProjetoSerializer

    def get_queryset(self):
        usuario = self.request.user

        if usuario.papel == 'ADMIN':
            return EvolucaoProjeto.objects.all()

        return EvolucaoProjeto.objects.filter(
            fk_projeto__unidade=usuario.unidade
        )