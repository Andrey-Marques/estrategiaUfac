from django.contrib import admin
from .models import IniciativaEstrategica

@admin.register(IniciativaEstrategica)
class IniciativaEstrategicaAdmin(admin.ModelAdmin):
    list_display = ('id', 'nome', 'data_preenchimento', 'percentual_evolucao', 'unidade', 'responsavel')
    list_filter = ('responsavel', 'unidade', 'status')
    search_fields = ('nome',)