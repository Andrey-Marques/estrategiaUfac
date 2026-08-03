from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import IniciativaEstrategicaViewSet

router = DefaultRouter()
router.register("iniciativas", IniciativaEstrategicaViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
