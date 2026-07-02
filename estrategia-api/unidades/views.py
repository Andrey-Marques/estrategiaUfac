from rest_framework import viewsets
from .models import Unidade
from .serializers import UnidadeSerializer

class UnidadeViewSet(viewsets.ModelViewSet):
     queryset = Unidade.objects.all()
     serializer_class = UnidadeSerializer