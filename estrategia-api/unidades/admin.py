from django.contrib import admin
from .models import Unidade

@admin.register(Unidade)
class Unidadeadmin(admin.ModelAdmin):
    list_display = ('id', 'nome', 'sigla')
    search_fields = ('nome', 'sigla')
