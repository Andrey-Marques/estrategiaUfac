from rest_framework import viewsets
from usuarios.models import Usuario
from usuarios.serializers import UsuarioSerializer

class UsuarioViewSet(viewsets.ModelViewSet):
     queryset = Usuario.objects.all()
     serializer_class = UsuarioSerializer
