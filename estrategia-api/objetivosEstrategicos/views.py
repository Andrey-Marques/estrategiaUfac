from rest_framework.viewsets import ModelViewSet
from .models import ObjetivoEstrategico
from .serializers import ObjetivoEstrategicoSerializer
from rest_framework.permissions import BasePermission, SAFE_METHODS


class PodeGerenciarObjetivos(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (
            request.method in SAFE_METHODS or request.user.papel == 'ADMIN'
        ))

class ObjetivoEstrategicoViewSet(ModelViewSet):
    queryset = ObjetivoEstrategico.objects.all()
    serializer_class = ObjetivoEstrategicoSerializer
    permission_classes = [PodeGerenciarObjetivos]
