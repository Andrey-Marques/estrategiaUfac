from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ObjetivoEstrategicoViewSet

router = DefaultRouter()
router.register("objetivos", ObjetivoEstrategicoViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

 