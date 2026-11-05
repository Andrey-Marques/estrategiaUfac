from rest_framework.routers import DefaultRouter
from .views import PlanejamentoViewSet

router = DefaultRouter()
router.register('planejamentos', PlanejamentoViewSet, basename='planejamento')

urlpatterns = router.urls
