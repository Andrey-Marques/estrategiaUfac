from django.contrib import admin
from .models import ProjetoEstrategico, EvolucaoProjeto, EvolucaoOrcamentaria, ObjetivoProjeto

class EvolucaoProjetoInline(admin.TabularInline):
    model = EvolucaoProjeto
    extra = 0

class EvolucaoOrcamentariaInline(admin.TabularInline):
    model = EvolucaoOrcamentaria
    extra = 0
    
class ObjetivoProjetoInline(admin.TabularInline):
    model = ObjetivoProjeto
    extra = 1

@admin.register(ProjetoEstrategico)
class ProjetoEstrategicoAdmin(admin.ModelAdmin):
    list_display = ('id', 'nome', 'tempo_estimado', 'custo_estimado','unidade')
    search_fields = ('nome',)
    list_filter = ('unidade', 'responsavel')
    inlines = [ObjetivoProjetoInline, EvolucaoProjetoInline, EvolucaoOrcamentariaInline]
    
    
@admin.register(EvolucaoProjeto)
class EvolucaoProjetoAdmin(admin.ModelAdmin):
    list_display = ('id', 'realizacao', 'proximo_passo')
    search_fields = ('realizacao', 'proximo_passo')
    list_filter = ('fk_projeto',)
    
@admin.register(EvolucaoOrcamentaria)
class EvolucaoOrcamentariaAdmin(admin.ModelAdmin):
    list_display = ('id', 'valor', 'data_registro', 'fk_projeto')
    search_fields = ('valor',)
    list_filter = ('fk_projeto',)