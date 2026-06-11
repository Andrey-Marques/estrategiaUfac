from django.contrib import admin
from .models import IniciativaEstrategica, AcaoRealizada

class AcaoRealizadaInline(admin.TabularInline):
    model = AcaoRealizada
    extra = 0

@admin.register(IniciativaEstrategica)
class IniciativaEstrategicaAdmin(admin.ModelAdmin):
    list_display = ('id', 'nome', 'data_preenchimento', 'percentual_evolucao', 'unidade', 'responsavel')
    list_filter = ('responsavel', 'unidade')
    search_fields = ('nome',)
    inlines = [AcaoRealizadaInline]

@admin.register(AcaoRealizada)
class AcaoRealizadaAdmin(admin.ModelAdmin):
    list_display = ('id', 'nome', 'prazo_inicio', 'prazo_fim', 'custo', 'status', 'fk_iniciativa')
    list_filter = ('status',)
    search_fields = ('nome',)