from rest_framework.permissions import BasePermission, SAFE_METHODS
from rest_framework.viewsets import ModelViewSet
from .models import PDI
from .serializers import PDISerializer

class PodeGerenciarPDIs(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                request.method in SAFE_METHODS
                or request.user.papel == 'ADMIN'
            )
        )

class PDIViewSet(ModelViewSet):
    queryset = PDI.objects.select_related('planejamento').order_by('data_inicio', 'id')
    serializer_class = PDISerializer
    permission_classes = [PodeGerenciarPDIs]