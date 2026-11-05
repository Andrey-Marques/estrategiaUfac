from rest_framework.permissions import BasePermission, SAFE_METHODS
from rest_framework.viewsets import ModelViewSet
from .models import Planejamento
from .serializers import PlanejamentoSerializer

class PodeGerenciarPlanejamentos(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                request.method in SAFE_METHODS
                or request.user.papel == 'ADMIN'
            )
        )

class PlanejamentoViewSet(ModelViewSet):
    queryset = Planejamento.objects.order_by('data_inicio', 'id')
    serializer_class = PlanejamentoSerializer
    permission_classes = [PodeGerenciarPlanejamentos]
