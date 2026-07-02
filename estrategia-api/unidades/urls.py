from rest_framework.routers import DefaultRouter
from .views import UnidadeViewSet

router = DefaultRouter()

router.register("unidades", UnidadeViewSet, basename="unidade")

urlpatterns = router.urls
