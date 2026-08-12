from django.contrib import admin
from .models import IndicadorEstrategico, EvolucaoIndicador

class EvolucaoIndicadorInline(admin.TabularInline):
    model = EvolucaoIndicador
    extra = 0
    
@admin.register(IndicadorEstrategico)
class IndicadorEstrategicoAdmin(admin.ModelAdmin):
    list_display = ('id', 'nome', 'unidade', 'responsavel')
    list_filter = ('responsavel', 'unidade')
    search_fields = ('nome',)
    inlines = [EvolucaoIndicadorInline]
    
@admin.register(EvolucaoIndicador)
class EvolucaoIndicadorAdmin(admin.ModelAdmin):
    list_display = ('id', 'ano', 'meta_prevista', 'meta_alcancada', 'indicador')
    list_filter = ('ano',)
    search_fields = ('ano',)
