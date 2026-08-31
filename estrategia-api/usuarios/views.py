from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from usuarios.models import Usuario
from usuarios.serializers import UsuarioSerializer



class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get', 'patch', 'put'], url_path='me')
    def me(self, request):
        usuario = request.user

        if request.method == 'GET':
               serializer = self.get_serializer(usuario)
               return Response(serializer.data)
        serializer = self.get_serializer(usuario, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        return Response(serializer.errors, status=400) 

# class UsuarioAtualView(APIView):
    

#     def get(self, request):
#         return Response(UsuarioSerializer(request.user).data)
