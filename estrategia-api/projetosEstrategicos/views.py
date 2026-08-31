from rest_framework.viewsets import ModelViewSet
from .models import ProjetoEstrategico, EvolucaoProjeto
from .serializers import ProjetoEstrategicoSerializer, EvolucaoProjetoSerializer

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
            serializer.save()
        else:
            serializer.save(unidade = usuario.unidade)


class EvolucaoProjetoViewSet(ModelViewSet):
    queryset = EvolucaoProjeto.objects.all()
    serializer_class = EvolucaoProjetoSerializer