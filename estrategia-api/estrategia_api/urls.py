from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import( TokenObtainPairView, TokenRefreshView,)
from unidades.views import ResumoUnidadeView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('usuarios.urls')),
    path('api/', include('unidades.urls')),
    path('api/', include('objetivosEstrategicos.urls')),
    path('api/', include('projetosEstrategicos.urls')),
    path('api/', include('iniciativasEstrategicas.urls')),
    path('api/', include('indicadoresEstrategicos.urls')),
    path('api/login/', TokenObtainPairView.as_view(), name='login'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/resumo-unidade/', ResumoUnidadeView.as_view(), name='resumo-unidade'),
]