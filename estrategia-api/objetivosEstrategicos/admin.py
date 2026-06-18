from django.contrib import admin
from .models import ObjetivoEstrategico

@admin.register(ObjetivoEstrategico)
class ObjetivosEstrategicosAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'descricao')
    search_fields = ('codigo', 'descricao')
    filter_horizontal = ('unidade',)

