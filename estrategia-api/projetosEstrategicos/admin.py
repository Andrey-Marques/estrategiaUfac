from django.contrib import admin
from .models import ProjetoEstrategico

@admin.register(ProjetoEstrategico)
class ProjetoEstrategicoAdmin(admin.ModelAdmin):
    list_display = ('id', 'nome', 'tempo_estimado', 'custo_estimado','unidade')
    search_fields = ('nome',)
    list_filter = ('status', 'unidade', 'responsavel')