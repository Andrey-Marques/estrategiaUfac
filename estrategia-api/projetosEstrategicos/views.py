from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet
from .models import ProjetoEstrategico, EvolucaoProjeto
from .serializers import ProjetoEstrategicoSerializer, EvolucaoProjetoSerializer
from rest_framework.response import Response
from rest_framework import status

class ProjetoEstrategicoViewSet(ModelViewSet):
    queryset = ProjetoEstrategico.objects.all()
    serializer_class = ProjetoEstrategicoSerializer 
    
    def get_queryset(self):
        usuario = self.request.user
        
        if usuario.papel == 'ADMIN':
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

        status_solicitado = self.request.data.get(
            'status'
        )

        status_projeto = (
            'RASCUNHO'
            if status_solicitado == 'RASCUNHO'
            else 'EM_ANALISE'
        )

        serializer.save(
            unidade=usuario.unidade,
            responsavel=usuario,
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