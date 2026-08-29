from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from usuarios.models import Usuario
from usuarios.serializers import UsuarioSerializer

class UsuarioViewSet(viewsets.ModelViewSet):
     queryset = Usuario.objects.all()
     serializer_class = UsuarioSerializer

class UsuarioAtualView(APIView):
     permission_classes = [IsAuthenticated]

     def get(self, request):
          return Response(UsuarioSerializer(request.user).data)
