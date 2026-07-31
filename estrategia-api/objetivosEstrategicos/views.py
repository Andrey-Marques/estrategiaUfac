from rest_framework import ModelViewSet
from .models import ObjetivoEstrategico
from .serializers import ObjetivoEstrategicoSerializer

class ObjetivoEstrategicoViewSet(ModelViewSet):
    queryset = ObjetivoEstrategico.objects.all()
    serializer_class = ObjetivoEstrategicoSerializer