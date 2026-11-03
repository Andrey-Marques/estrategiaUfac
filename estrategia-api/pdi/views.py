from rest_framework import ModelViewSet
from .models import Planejamento
from .serializers import PlanejamentoSerializer

class PlanejamentoViewSet(ModelViewSet):
    queryset = Planejamento.objects.all()
    serializer_class = PlanejamentoSerializer