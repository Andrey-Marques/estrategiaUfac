from rest_framework import serializers

from unidades.models import Unidade
from usuarios.models import Usuario
from objetivosEstrategicos.models import ObjetivoEstrategico

from .models import (IniciativaEstrategica, AcaoRealizada)


class AcaoRealizadaSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcaoRealizada

        fields = ['id','nome','prazo_inicio','prazo_fim','custo','status']


class RelatedByIdOrNameField(serializers.PrimaryKeyRelatedField):
    def to_internal_value(self, data):
        if (isinstance(data, str)and not data.isdigit()):
            lookup_field = (
                'nome_completo'
                if self.queryset.model is Usuario
                else 'nome'
            )
            try:
                return self.queryset.get(**{f'{lookup_field}__iexact':data.strip()})

            except self.queryset.model.DoesNotExist:
                self.fail('does_not_exist', pk=data)

        return super().to_internal_value(data)

class IniciativaEstrategicaSerializer(serializers.ModelSerializer):

    responsavel_nome = serializers.CharField(source='responsavel.nome_completo', read_only=True)

    unidade_sigla = serializers.CharField(source='unidade.sigla', read_only=True)

    objetivos = serializers.PrimaryKeyRelatedField(many=True, queryset=ObjetivoEstrategico.objects.all(), required=False)

    objetivos_detalhes = serializers.SerializerMethodField()

    acoes_realizadas = AcaoRealizadaSerializer( many=True,  read_only=True)

    acoes = AcaoRealizadaSerializer( many=True, write_only=True, required=False)

    unidade = RelatedByIdOrNameField( queryset=Unidade.objects.all())

    responsavel = RelatedByIdOrNameField(queryset=Usuario.objects.all())
    class Meta:
        model = IniciativaEstrategica
        fields = [
            'id',
            'nome',
            'data_preenchimento',
            'ultima_atualizacao',
            'unidade',
            'unidade_sigla',
            'responsavel',
            'responsavel_nome',
            'projeto',
            'objetivos',
            'objetivos_detalhes',
            'acoes_realizadas',
            'acoes',
            'percentual_evolucao',
            'observacao',
            'status',
            'observacao_analise',
            'data_analise',
            'analisado_por'
        ]


    def get_objetivos_detalhes(self, obj):

        return [
            {
                'id': objetivo.id,
                'codigo': objetivo.codigo,
                'descricao': objetivo.descricao
            }

            for objetivo in obj.objetivos.all()
        ]


    def create(self, validated_data):
        acoes = validated_data.pop('acoes',[])
        objetivos = validated_data.pop('objetivos',[])

        iniciativa = ( IniciativaEstrategica.objects.create( **validated_data))

        iniciativa.objetivos.set(objetivos)

        for acao in acoes:
            AcaoRealizada.objects.create(fk_iniciativa=iniciativa,**acao)

        return iniciativa

    def update(self,instance,validated_data):
        acoes = validated_data.pop('acoes',None)
        objetivos = validated_data.pop('objetivos',None)

        for campo, valor in validated_data.items():
            setattr(instance,  campo, valor)
        instance.save()
        if objetivos is not None:
            instance.objetivos.set(objetivos)

        if acoes is not None:
            instance.acoes_realizadas.all().delete()
            for acao in acoes:
                AcaoRealizada.objects.create( fk_iniciativa=instance, **acao)
        return instance


