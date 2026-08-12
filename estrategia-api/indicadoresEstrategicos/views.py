from rest_framework. viewsets import ModelViewSet
from .models import IndicadorEstrategico
from .serializers import IndicadorEstrategicoSerializer

class IndicadorEstrategicoViewSet(ModelViewSet):
    queryset = IndicadorEstrategico.objects.all()
    serializer_class = IndicadorEstrategicoSerializer