from django.contrib import admin
from .models import Usuario

@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ('id', 'username', 'unidade')
    search_fields = ('nome',)
    list_filter = ('unidade',)
