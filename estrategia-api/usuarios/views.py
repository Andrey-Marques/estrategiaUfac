from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError

from .models import Usuario
from .serializers import UsuarioSerializer, MeuPerfilSerializer


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        usuario = self.request.user

        if usuario.papel == 'ADMIN':
            return Usuario.objects.all()

        return Usuario.objects.filter(unidade=usuario.unidade)

    def perform_create(self, serializer):
        usuario = self.request.user

        if usuario.papel not in ('ADMIN', 'GESTOR'):
            raise PermissionDenied('Apenas administradores e gestores podem cadastrar usuários.')

        dados = {}
        if usuario.papel == 'GESTOR':
            if serializer.validated_data.get('papel') == 'ADMIN':
                raise ValidationError({'papel': 'Gestores não podem cadastrar administradores.'})
            dados['unidade'] = usuario.unidade

        serializer.save(**dados)

    def perform_destroy(self, instance):
        usuario = self.request.user

        if usuario.papel == 'ADMIN':
            instance.delete()
            return

        if usuario.papel != 'GESTOR' or instance.unidade_id != usuario.unidade_id:
            raise PermissionDenied('Gestores só podem excluir usuários da própria unidade.')

        instance.delete()

    @action(detail=False, methods=['get', 'patch'], url_path='me')
    def me(self, request):
        if request.method == 'GET':
            serializer = MeuPerfilSerializer(request.user)
            return Response(serializer.data)

        serializer = MeuPerfilSerializer(
            request.user,
            data=request.data,
            partial=True
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data)