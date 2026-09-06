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
        read_only_fields = ['fk_projeto', 'data_registro']

class ProjetoEstrategicoSerializer(serializers.ModelSerializer):
    responsavel_nome = serializers.CharField(
        source='responsavel.nome_completo',
        read_only=True
    )

    unidade_sigla = serializers.CharField(
        source='unidade.sigla',
        read_only=True
    )
    objetivos = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=ObjetivoEstrategico.objects.all(),
        required=False
    )
    
    objetivos_detalhes = serializers.SerializerMethodField()
    
    evolucoes = EvolucaoProjetoSerializer(many=True, required=False)
    evolucoesOrcamentarias = EvolucaoOrcamentariaSerializer(many=True, required=False)

    class Meta:
        model = ProjetoEstrategico
        fields = '__all__'
        
    def get_objetivos_detalhes(self, obj):
        return [
            {
                'id': objetivo.id,
                'codigo': objetivo.codigo,
                'descricao': objetivo.descricao
            }
            for objetivo in obj.objetivos.all()
        ]

    def _salvar_evolucoes_orcamentarias( self,  projeto,  evolucoes_orcamentarias):
        if not evolucoes_orcamentarias:
            return

        for evolucao in evolucoes_orcamentarias:

            valor = evolucao.get(
                'valor',
                0
            )

            descricao = (
                evolucao.get('descricao')
                or ''
            ).strip()

            if valor or descricao:

                EvolucaoOrcamentaria.objects.create(
                    fk_projeto=projeto,
                    valor=valor,
                    descricao=descricao
                )

    def _salvar_evolucoes_orcamentarias(self, projeto, evolucoes):
        if not evolucoes:
            return

        for evolucao in evolucoes:
            valor = evolucao.get('valor', 0)
            descricao = (evolucao.get('descricao') or '').strip()

            if valor or descricao:
                EvolucaoOrcamentaria.objects.create(
                    fk_projeto=projeto,
                    valor=valor,
                    descricao=descricao
                )

    def create(self, validated_data):
        objetivos = validated_data.pop('objetivos', [])
        evolucoes = validated_data.pop('evolucoes', [])
        orcamentarias = validated_data.pop('evolucoesOrcamentarias', [])

        projeto = ProjetoEstrategico.objects.create(**validated_data)
        projeto.objetivos.set(objetivos)

        self._salvar_evolucoes(projeto, evolucoes)
        self._salvar_evolucoes_orcamentarias(projeto, orcamentarias)

        return projeto

    def update(self, instance, validated_data):

        evolucoes = validated_data.pop(
            'evolucoes',
            None
        )

        evolucoes_orcamentarias = validated_data.pop(
            'evolucoesOrcamentarias',
            None
        )

        objetivos = validated_data.pop(
            'objetivos',
            None
        )

        for atributo, valor in validated_data.items():
            setattr(
                instance,
                atributo,
                valor
            )

        instance.save()


        if objetivos is not None:
            instance.objetivos.set(
                objetivos
            )


        if evolucoes is not None:

            for evolucao in evolucoes:

                realizacao = (
                    evolucao.get('realizacao')
                    or ''
                ).strip()

                proximo_passo = (
                    evolucao.get('proximo_passo')
                    or ''
                ).strip()

                if realizacao or proximo_passo:

                    EvolucaoProjeto.objects.create(
                        fk_projeto=instance,
                        realizacao=realizacao,
                        proximo_passo=proximo_passo
                    )


        if evolucoes_orcamentarias is not None:

            self._salvar_evolucoes_orcamentarias(
                instance,
                evolucoes_orcamentarias
            )


        return instance