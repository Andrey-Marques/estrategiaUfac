from django.urls import path, include
from rest_framework.routers  import DefaultRouter
from .views import ProjetoEstrategicoViewSet

router = DefaultRouter()
router.register("projetos", ProjetoEstrategicoViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
