from rest_framework.routers import DefaultRouter
from django.urls import path
from usuarios.views import UsuarioAtualView, UsuarioViewSet

router = DefaultRouter()
 
router.register("usuarios", UsuarioViewSet)

urlpatterns = [
	path('usuarios/me/', UsuarioAtualView.as_view(), name='usuario-atual'),
] + router.urls
