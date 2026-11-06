from django.db.models import Count
from rest_framework.permissions import BasePermission, SAFE_METHODS
from rest_framework.viewsets import ModelViewSet
from rest_framework.exceptions import ValidationError
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
    queryset = (
        PDI.objects.select_related('planejamento')
        .annotate(iniciativas_count=Count('iniciativas_estrategicas'))
        .order_by('data_inicio', 'id')
    )
    serializer_class = PDISerializer
    permission_classes = [PodeGerenciarPDIs]

    def perform_destroy(self, instance):
        if instance.iniciativas_estrategicas.exists():
            raise ValidationError({
                'detail': 'Este PDI não pode ser excluído porque possui iniciativas vinculadas.'
            })
        instance.delete()