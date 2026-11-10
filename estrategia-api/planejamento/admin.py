from django.contrib import admin
from .models import Planejamento

@admin.register(Planejamento)
class PlanejamentoAdmin(admin.ModelAdmin):
    list_display = ('nome', 'status')
    search_fields = ('nome',)