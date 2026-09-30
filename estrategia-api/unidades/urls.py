from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import UnidadeViewSet, UnidadesPublicasView

router = DefaultRouter()

router.register("unidades", UnidadeViewSet, basename="unidade")

urlpatterns = [
    path('unidades-publicas/', UnidadesPublicasView.as_view(), name='unidades-publicas'),
] + router.urls
