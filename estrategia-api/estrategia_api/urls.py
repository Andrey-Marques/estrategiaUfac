from django.contrib import admin
from django.urls import path
from usuarios.views import usuarios

urlpatterns = [
    path('admin/', admin.site.urls),
    path('usuarios/', usuarios, name='usuarios'),
]
