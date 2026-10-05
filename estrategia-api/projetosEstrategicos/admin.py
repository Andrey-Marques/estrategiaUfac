from django.contrib import admin
from .models import AcaoProjeto, ProjetoEstrategico, EvolucaoProjeto, ObjetivoProjeto

class EvolucaoProjetoInline(admin.TabularInline):
    model = EvolucaoProjeto
    extra = 0


class AcaoProjetoInline(admin.TabularInline):
    model = AcaoProjeto
    extra = 0

class ObjetivoProjetoInline(admin.TabularInline):
    model = ObjetivoProjeto
    extra = 1

@admin.register(ProjetoEstrategico)
class ProjetoEstrategicoAdmin(admin.ModelAdmin):
    list_display = ('id', 'nome', 'tempo_estimado', 'custo_estimado','unidade')
    search_fields = ('nome',)
    list_filter = ('unidade', 'responsavel')
    inlines = [ObjetivoProjetoInline, EvolucaoProjetoInline, AcaoProjetoInline]

    def save_formset(self, request, form, formset, change):
        super().save_formset(request, form, formset, change)
        if formset.model is AcaoProjeto:
            form.instance.atualizar_custo_estimado()


@admin.register(EvolucaoProjeto)
class EvolucaoProjetoAdmin(admin.ModelAdmin):
    list_display = ('id', 'descricao', 'tipo', 'fk_projeto')
    search_fields = ('descricao',)
    list_filter = ('tipo', 'fk_projeto')


@admin.register(AcaoProjeto)
class AcaoProjetoAdmin(admin.ModelAdmin):
    list_display = ('id', 'nome', 'custo_estimado', 'custo_realizado', 'status', 'fk_projeto')
    search_fields = ('nome',)
    list_filter = ('status', 'fk_projeto')

    def delete_queryset(self, request, queryset):
        projeto_ids = set(queryset.values_list('fk_projeto_id', flat=True))
        super().delete_queryset(request, queryset)
        for projeto in ProjetoEstrategico.objects.filter(id__in=projeto_ids):
            projeto.atualizar_custo_estimado()