from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import UsuarioViewSet
from .atrasos import AcoesEmAtrasoView
from .recuperacao_senha import SolicitarRecuperacaoSenhaView, ConfirmarRecuperacaoSenhaView

router = DefaultRouter()
router.register(r'usuarios', UsuarioViewSet)

urlpatterns = [
    path('acoes-em-atraso/', AcoesEmAtrasoView.as_view(), name='acoes-em-atraso'),
    path('recuperar-senha/', SolicitarRecuperacaoSenhaView.as_view(), name='recuperar-senha'),
    path('redefinir-senha/', ConfirmarRecuperacaoSenhaView.as_view(), name='redefinir-senha'),
    path('', include(router.urls)),
]
