from django.contrib import admin
from .models import Usuario
from django.contrib.auth.models import Group

admin.site.unregister(Group)

@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ('id', 'username', 'unidade')
    search_fields = ('nome_completo',)
    list_filter = ('unidade',)
