from rest_framework import serializers
from objetivosEstrategicos.models import ObjetivoEstrategico
from .models import ProjetoEstrategico, EvolucaoProjeto, EvolucaoOrcamentaria

class EvolucaoProjetoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvolucaoProjeto
        fields = '__all__'

        read_only_fields = ['fk_projeto']

        extra_kwargs = {'descricao': {'allow_blank': False, 'required': True},
            'tipo': {'required': True},
        }
    
class EvolucaoOrcamentariaSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)

    data_registro = serializers.DateField(required=True, input_formats=['%Y-%m-%d'])
    class Meta:
        model = EvolucaoOrcamentaria
        fields = '__all__'
        read_only_fields = ['fk_projeto']

class ProjetoEstrategicoSerializer(serializers.ModelSerializer):
    responsavel_nome = serializers.SerializerMethodField()

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

    def _salvar_evolucoes_orcamentarias(self, projeto, evolucoes_orcamentarias):
        if not evolucoes_orcamentarias:
            return
        for evolucao in evolucoes_orcamentarias:
            valor = evolucao.get('valor', 0)
            descricao = (evolucao.get('descricao') or '').strip()
            data_registro = evolucao.get('data_registro')
            if valor or descricao:
                EvolucaoOrcamentaria.objects.create(
                    fk_projeto=projeto,
                    valor=valor,
                    descricao=descricao,
                    data_registro=data_registro
                )
                
    def _salvar_evolucoes(self, projeto, evolucoes):

        if not evolucoes:
            return

        for evolucao in evolucoes:

            descricao = (evolucao.get('descricao') or '').strip()
            tipo = evolucao.get('tipo')

            if not descricao:
                continue

            EvolucaoProjeto.objects.create(fk_projeto=projeto,  descricao=descricao,  tipo=tipo)


    def create(self, validated_data):
        objetivos = validated_data.pop('objetivos', [])
        evolucoes = validated_data.pop('evolucoes', [])
        orcamentarias = validated_data.pop('evolucoesOrcamentarias', [])
        projeto = ProjetoEstrategico.objects.create(**validated_data)
        projeto.objetivos.set(objetivos)

        self._salvar_evolucoes(projeto, evolucoes)
        self._salvar_evolucoes_orcamentarias(projeto, orcamentarias)

        projeto.refresh_from_db()

        return projeto

    def update(self, instance, validated_data):

        evolucoes = validated_data.pop('evolucoes', None)
        evolucoes_orcamentarias = validated_data.pop('evolucoesOrcamentarias', None)
        objetivos = validated_data.pop('objetivos',None)

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
            instance.evolucoes.all().delete()
            self._salvar_evolucoes(instance, evolucoes)

        if evolucoes_orcamentarias is not None:
            self._sincronizar_evolucoes_orcamentarias(
                instance,
                evolucoes_orcamentarias
            )

        return instance
    
    def _sincronizar_evolucoes_orcamentarias( self, projeto, evolucoes_orcamentarias):
        ids_mantidos = []
        
        for evolucao in evolucoes_orcamentarias:
            evolucao_id = evolucao.get('id')
            valor = evolucao.get('valor', 0)
            descricao = (evolucao.get('descricao') or '').strip()
            data_registro = evolucao.get('data_registro')
            
            if evolucao_id:
                try:
                    registro = projeto.evolucoesOrcamentarias.get(id=evolucao_id)
                except EvolucaoOrcamentaria.DoesNotExist:
                    raise serializers.ValidationError({'evolucoesOrcamentarias': 'Evolução orçamentária inválida.'})

                registro.valor = valor
                registro.descricao = descricao
                registro.data_registro = data_registro

                registro.save(update_fields=['valor', 'descricao', 'data_registro'])

                ids_mantidos.append(registro.id)

            elif valor or descricao:
                registro = EvolucaoOrcamentaria.objects.create(fk_projeto=projeto,  valor=valor,  descricao=descricao,  data_registro=data_registro)

                ids_mantidos.append(registro.id)

        # Exclui as evoluções removidas no frontend
        projeto.evolucoesOrcamentarias.exclude(
            id__in=ids_mantidos
        ).delete()
        
    def get_responsavel_nome(self, obj):
        if obj.responsavel is None:
            return None

        return obj.responsavel.nome_social or obj.responsavel.nome_completo