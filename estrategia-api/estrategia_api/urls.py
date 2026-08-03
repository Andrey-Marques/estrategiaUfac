from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('usuarios.urls')),
    path('api/', include('unidades.urls')),
    path('api/', include('objetivosEstrategicos.urls')),
    path('api/', include('projetosEstrategicos.urls')),
    path('api/', include('iniciativasEstrategicas.urls')),
]