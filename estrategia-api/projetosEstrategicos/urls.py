from django.urls import path, include
from rest_framework.routers  import DefaultRouter
from .views import ProjetoEstrategicoViewSet, EvolucaoProjetoViewSet

router = DefaultRouter()
router.register("projetos", ProjetoEstrategicoViewSet)
router.register("evolucoes-projeto", EvolucaoProjetoViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
