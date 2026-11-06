from django.db.models import Count
from rest_framework.exceptions import ValidationError
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
    queryset = Planejamento.objects.annotate(
        objetivos_count=Count('objetivos_estrategicos'),
    ).order_by('data_inicio', 'id')
    serializer_class = PlanejamentoSerializer
    permission_classes = [PodeGerenciarPlanejamentos]

    def perform_destroy(self, instance):
        if instance.objetivos_estrategicos.exists():
            raise ValidationError({
                'detail': 'Este planejamento não pode ser excluído porque possui objetivos estratégicos vinculados.'
            })
        if instance.pdis.filter(iniciativas_estrategicas__isnull=False).exists():
            raise ValidationError({
                'detail': 'Este planejamento não pode ser excluído porque um de seus PDIs possui iniciativas vinculadas.'
            })
        instance.delete()
