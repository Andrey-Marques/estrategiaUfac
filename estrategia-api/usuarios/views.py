from rest_framework import viewsets
from usuarios.models import Usuario
from usuarios.serializers import UsuarioSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer

    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):

        serializer = self.get_serializer(request.user)

        return Response(serializer.data)
        
