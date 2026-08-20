from rest_framework import serializers
from unidades.models import Unidade
from usuarios.models import Usuario
from .models import IniciativaEstrategica, AcaoRealizada

class AcaoRealizadaSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcaoRealizada
        fields = ['id', 'nome', 'prazo_inicio', 'prazo_fim', 'custo', 'status']

class RelatedByIdOrNameField(serializers.PrimaryKeyRelatedField):
    def to_internal_value(self, data):
        if isinstance(data, str) and not data.isdigit():
            lookup_field = 'nome_completo' if self.queryset.model is Usuario else 'nome'
            try:
                return self.queryset.get(**{f'{lookup_field}__iexact': data.strip()})
            except self.queryset.model.DoesNotExist:
                self.fail('does_not_exist', pk=data)
        return super().to_internal_value(data)

class IniciativaEstrategicaSerializer(serializers.ModelSerializer):
    acoes_realizadas = AcaoRealizadaSerializer(many = True, read_only = True)
    acoes = AcaoRealizadaSerializer(many=True, write_only=True, required=False)
    unidade = RelatedByIdOrNameField(queryset=Unidade.objects.all())
    responsavel = RelatedByIdOrNameField(queryset=Usuario.objects.all())
        
    class Meta:
        
        model = IniciativaEstrategica
        fields = ['id','nome','unidade','responsavel','objetivos','acoes_realizadas','percentual_evolucao','observacao','status','acoes']
    def create(self, validated_data):
        acoes = validated_data.pop('acoes', [])
        objetivos = validated_data.pop('objetivos',[])
        iniciativa = IniciativaEstrategica.objects.create(**validated_data)
        iniciativa.objetivos.set(objetivos)
        for acao in acoes:
            AcaoRealizada.objects.create(fk_iniciativa=iniciativa, **acao)
        return iniciativa