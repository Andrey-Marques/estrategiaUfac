from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import IndicadorEstrategicoViewSet

router = DefaultRouter()
router.register("indicadores", IndicadorEstrategicoViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

