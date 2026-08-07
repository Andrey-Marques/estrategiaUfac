from django.contrib import admin
from .models import IndicadorEstrategico, EvolucaoIndicador

class EvolucaoIndicadorInline(admin.TabularInline):
    model = EvolucaoIndicador
    extra = 0
    
@admin.register(IndicadorEstrategico)
class IndicadorEstrategicoAdmin(admin.ModelAdmin):
    list_display = ('id')
