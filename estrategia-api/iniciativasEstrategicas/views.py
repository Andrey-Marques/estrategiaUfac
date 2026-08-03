from rest_framework.viewsets import ModelViewSet
from .models import IniciativaEstrategica
from .serializers import IniciativaEstrategicaSerializer

class IniciativaEstrategicaViewSet(ModelViewSet):
    queryset = IniciativaEstrategica.objects.all()
    serializer_class = IniciativaEstrategicaSerializer