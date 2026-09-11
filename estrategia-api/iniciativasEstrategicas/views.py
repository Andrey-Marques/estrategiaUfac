from rest_framework.viewsets import ModelViewSet
from .models import IniciativaEstrategica
from .serializers import IniciativaEstrategicaSerializer
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from django.utils import timezone
from rest_framework.response import Response
class IniciativaEstrategicaViewSet(ModelViewSet):
    queryset = IniciativaEstrategica.objects.all()
    serializer_class = IniciativaEstrategicaSerializer
    
    def get_queryset(self):
        usuario = self.request.user
        
        if usuario.papel == 'ADMIN':
            return IniciativaEstrategica.objects.all()
        
        return IniciativaEstrategica.objects.filter(
            unidade=usuario.unidade
        )
        
    def perform_create(self, serializer):
        usuario = self.request.user

        if usuario.papel == 'ADMIN':
            serializer.save(status='APROVADO')
            return

        responsavel = (serializer.validated_data.get( 'responsavel'))

        if responsavel is None:
            raise ValidationError({'responsavel':'Selecione um responsável ''pela iniciativa.'})


        if (responsavel.unidade_id != usuario.unidade_id):
             raise ValidationError({ 'responsavel': 'O responsável pela iniciativa ''deve pertencer à sua unidade.'})

        status_solicitado = (self.request.data.get('status'))

        status_iniciativa = ( 'RASCUNHO' if status_solicitado == 'RASCUNHO' else 'EM_ESPERA')

        serializer.save( unidade=usuario.unidade, responsavel=responsavel, status=status_iniciativa)

    def _validar_campos_edicao(self, request):
        usuario = request.user

        if usuario.papel == 'ADMIN':
            return None

        iniciativa = self.get_object()

        if iniciativa.status == 'REJEITADO':
            campos_permitidos = {
                'nome',
                'responsavel',
                'unidade',
                'objetivos',
                'projeto',
                'acoes',
                'percentual_evolucao',
                'observacao'
            }
        else:
            campos_permitidos = {
                'acoes',
                'percentual_evolucao',
                'observacao'
            }

        campos_enviados = set(request.data.keys())
        campos_proibidos = (campos_enviados - campos_permitidos)

        if campos_proibidos:
            return Response(
                {'detail': 'Você não possui permissão ''para alterar um ou mais campos.','campos_proibidos': list(campos_proibidos)},

                status=status.HTTP_403_FORBIDDEN
            )
        return None
    
    def update(self, request, *args, **kwargs):
        erro = self._validar_campos_edicao(request)

        if erro is not None:
            return erro
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        erro = self._validar_campos_edicao(request)

        if erro is not None:
            return erro
        return super().partial_update(request, *args, **kwargs)
    
    def perform_update(self, serializer):
        usuario = self.request.user

        if usuario.papel == 'ADMIN':
            serializer.save()
            return
        serializer.save(status='EM_ESPERA', observacao_analise='', data_analise=None, analisado_por=None)
        
    @action(detail=True, methods=['post'])
    def aprovar(self, request, pk=None):
        usuario = request.user

        if usuario.papel != 'ADMIN':
            return Response({'detail':'Apenas administradores ''podem aprovar iniciativas.'},status=status.HTTP_403_FORBIDDEN)

        iniciativa = self.get_object()

        if iniciativa.status != 'EM_ESPERA':
            return Response({'detail': 'Esta iniciativa não está ' 'aguardando análise.'},status=status.HTTP_400_BAD_REQUEST)

        observacao = ( request.data.get('observacao')or '').strip()

        iniciativa.status = 'APROVADO'

        iniciativa.observacao_analise = ( observacao)
        iniciativa.data_analise = timezone.now()

        iniciativa.analisado_por = usuario

        iniciativa.save(
            update_fields=[
                'status',
                'observacao_analise',
                'data_analise',
                'analisado_por',
                'ultima_atualizacao'
            ]
        )


        serializer = self.get_serializer(iniciativa)

        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action( detail=True, methods=['post'])
    def rejeitar( self, request, pk=None):
        usuario = request.user

        if usuario.papel != 'ADMIN':
            return Response(
                { 'detail': 'Apenas administradores ''podem rejeitar iniciativas.'},
                status=status.HTTP_403_FORBIDDEN
            )

        iniciativa = self.get_object()

        if iniciativa.status != 'EM_ESPERA':

            return Response(
                {'detail':'Esta iniciativa não está ''aguardando análise.'},

                status=status.HTTP_400_BAD_REQUEST
            )

        observacao = (request.data.get('observacao')or '').strip()

        if not observacao:
            return Response(
                {'observacao': 'Informe o motivo da rejeição.'}, status=status.HTTP_400_BAD_REQUEST)

        iniciativa.status = 'REJEITADO'

        iniciativa.observacao_analise = (observacao)

        iniciativa.data_analise = timezone.now()

        iniciativa.analisado_por = usuario
        iniciativa.save(
            update_fields=[
                'status',
                'observacao_analise',
                'data_analise',
                'analisado_por',
                'ultima_atualizacao'
            ]
        )

        serializer = self.get_serializer(iniciativa)

        return Response(serializer.data,status=status.HTTP_200_OK)