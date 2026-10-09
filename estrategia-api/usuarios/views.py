from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.db.models.deletion import ProtectedError
from .models import Usuario
from .serializers import UsuarioSerializer, MeuPerfilSerializer, AlterarSenhaSerializer
from rest_framework.throttling import UserRateThrottle
from django.db import transaction



class AlterarSenhaThrottle(UserRateThrottle):
    rate = '5/min'
    scope = 'alterar_senha'


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    permission_classes = [IsAuthenticated]
    
    def destroy(self, request, *args, **kwargs):
        usuario_logado = request.user
        usuario_alvo = self.get_object()

        if usuario_logado.papel == 'SERVIDOR':
            
            raise PermissionDenied('Servidores não possuem permissão para excluir usuários.')

        if usuario_alvo.id == usuario_logado.id:
            raise ValidationError({
                'detail': 'Você não pode excluir o seu próprio usuário.'
            })

        if (usuario_logado.papel == 'GESTOR' and usuario_alvo.unidade_id != usuario_logado.unidade_id):
            
            raise PermissionDenied('Gestores só podem excluir usuários da própria unidade.')

        try:
            usuario_alvo.delete()

        except ProtectedError:
            return Response(
                {'detail': 'Este usuário não pode ser excluído porque possui ' 'projetos, iniciativas ou indicadores vinculados.'}, status=status.HTTP_409_CONFLICT
            )

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )

    def get_queryset(self):
        usuario = self.request.user

        if usuario.papel == 'ADMIN':
            return Usuario.objects.all()

        if usuario.papel == 'GESTOR':
            return Usuario.objects.filter(
                unidade=usuario.unidade
            )

        return Usuario.objects.none()
        
    def list(self, request, *args, **kwargs):
        if request.user.papel == 'SERVIDOR':
            raise PermissionDenied(
                'Servidores não possuem permissão para acessar a listagem de usuários.'
            )

        return super().list(request, *args, **kwargs)
    
    def partial_update(self, request, *args, **kwargs):
        usuario_logado = request.user
        usuario_alvo = self.get_object()

        if usuario_logado.papel == 'SERVIDOR':
            raise PermissionDenied(
                'Servidores não possuem permissão para alterar usuários.'
            )

        if (usuario_logado.papel == 'GESTOR'  and usuario_alvo.unidade_id != usuario_logado.unidade_id):
            raise PermissionDenied(
                'Gestores só podem alterar usuários da própria unidade.'
            )

        if (
            usuario_alvo.id == usuario_logado.id
            and request.data.get('is_active') is False
        ):
            raise ValidationError({
                'is_active': 'Você não pode inativar o seu próprio usuário.'
            })

        return super().partial_update(request, *args, **kwargs)

    @action(detail=False, methods=['get'], url_path='responsaveis')
    def responsaveis(self, request):
        usuario = request.user

        if usuario.papel == 'ADMIN':
            usuarios = Usuario.objects.filter(is_active=True)
        else:
            usuarios = Usuario.objects.filter(
                unidade=usuario.unidade,
                is_active=True,
            )

        serializer = self.get_serializer(usuarios, many=True)
        return Response(serializer.data)

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
        
    


    @action(detail=False, methods=['post'], url_path='alterar-senha', throttle_classes=[AlterarSenhaThrottle])
    def alterar_senha(self, request):
        with transaction.atomic():
            request.user = Usuario.objects.select_for_update().get(pk=request.user.pk)
            serializer = AlterarSenhaSerializer(data=request.data, context={'request': request})
            serializer.is_valid(raise_exception=True)
            request.user.set_password(serializer.validated_data['nova_senha'])
            request.user.save(update_fields=['password'])
        return Response({'detail': 'Senha alterada com sucesso. Entre novamente com sua nova senha.'})

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
