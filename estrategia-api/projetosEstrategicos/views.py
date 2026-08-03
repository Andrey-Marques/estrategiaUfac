from rest_framework.viewsets import ModelViewSet
from .models import ProjetoEstrategico
from .serializers import ProjetoEstrategicoSerializer

class ProjetoEstrategicoViewSet(ModelViewSet):
    queryset = ProjetoEstrategico.objects.all()
    serializer_class = ProjetoEstrategicoSerializer 
    