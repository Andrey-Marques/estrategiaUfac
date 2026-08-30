from rest_framework import serializers
from objetivosEstrategicos.models import ObjetivoEstrategico
from .models import ProjetoEstrategico, EvolucaoProjeto, EvolucaoOrcamentaria

class EvolucaoProjetoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvolucaoProjeto
        fields = '__all__'
        extra_kwargs = {
            'realizacao': {'allow_blank': True, 'required': False},
            'proximo_passo': {'allow_blank': True, 'required': False},
            'fk_projeto': {'required': False, 'read_only': True},
        }
    
class EvolucaoOrcamentariaSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvolucaoOrcamentaria
        fields = '__all__'

class ProjetoEstrategicoSerializer(serializers.ModelSerializer):
    objetivos = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=ObjetivoEstrategico.objects.all(),
        required=False
    )
    evolucoes = EvolucaoProjetoSerializer(many=True, required=False)
    evolucoesOrcamentarias = EvolucaoOrcamentariaSerializer(many=True, required=False)

    class Meta:
        model = ProjetoEstrategico
        fields = '__all__'

    def _salvar_evolucoes(self, projeto, evolucoes):
        if evolucoes is None:
            return

        projeto.evolucoes.all().delete()

        for evolucao in evolucoes:
            realizacao = (evolucao.get('realizacao') or '').strip()
            proximo_passo = (evolucao.get('proximo_passo') or '').strip()

            if not realizacao and not proximo_passo:
                continue

            EvolucaoProjeto.objects.create(
                fk_projeto=projeto,
                realizacao=realizacao,
                proximo_passo=proximo_passo,
            )

    def create(self, validated_data):
        objetivos = validated_data.pop('objetivos', [])
        evolucoes = validated_data.pop('evolucoes', [])
        projeto = ProjetoEstrategico.objects.create(**validated_data)
        projeto.objetivos.set(objetivos)
        self._salvar_evolucoes(projeto, evolucoes)
        return projeto

    def update(self, instance, validated_data):
        objetivos = validated_data.pop('objetivos', None)
        evolucoes = validated_data.pop('evolucoes', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if objetivos is not None:
            instance.objetivos.set(objetivos)

        if evolucoes is not None:
            self._salvar_evolucoes(instance, evolucoes)

        return instance