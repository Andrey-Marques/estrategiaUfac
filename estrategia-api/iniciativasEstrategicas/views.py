from rest_framework.viewsets import ModelViewSet
from .models import IniciativaEstrategica
from .serializers import IniciativaEstrategicaSerializer

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
            serializer.save()
        else:
            serializer.save(unidade = usuario.unidade, responsavel = usuario)