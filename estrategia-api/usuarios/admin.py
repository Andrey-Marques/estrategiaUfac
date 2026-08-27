from django.contrib.auth.admin import UserAdmin
from django.contrib import admin
from .models import Usuario


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    list_display = ('id', 'username','nome_completo','papel', 'unidade','is_active',)
    search_fields = ('username','nome_completo',)
    list_filter = ('papel','unidade','is_active',)
