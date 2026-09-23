from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from .models import IndicadorEstrategico
from .serializers import IndicadorEstrategicoSerializer
from revisoes.serializers import SubmissaoRevisaoIndicadorSerializer, RevisaoEdicaoSerializer
from revisoes.services import criar_revisao_indicador

class IndicadorEstrategicoViewSet(ModelViewSet):
    queryset = IndicadorEstrategico.objects.all()
    serializer_class = IndicadorEstrategicoSerializer

    def get_queryset(self):
        usuario = self.request.user

        if usuario.papel == 'ADMIN':
            return IndicadorEstrategico.objects.all()

        return IndicadorEstrategico.objects.filter(unidade=usuario.unidade)

    def perform_create(self, serializer):
        usuario = self.request.user

        if usuario.papel == 'ADMIN':
            serializer.save(status='APROVADO')
            return

        responsavel = serializer.validated_data.get('responsavel')

        if responsavel is None or responsavel.unidade_id != usuario.unidade_id:
            raise ValidationError({
                'responsavel': 'O responsável pelo indicador deve pertencer à sua unidade.'
            })

        status_solicitado = self.request.data.get('status')
        status_indicador = 'RASCUNHO' if status_solicitado == 'RASCUNHO' else 'EM_ESPERA'

        serializer.save(
            unidade=usuario.unidade,
            responsavel=responsavel,
            status=status_indicador,
        )

    def _validar_campos_edicao(self, request):
        usuario = request.user

        if usuario.papel == 'ADMIN':
            return None

        indicador = self.get_object()

        if indicador.status == 'APROVADO':
            return Response(
                {'detail': 'Indicadores publicados devem ser alterados através do fluxo de revisão.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if indicador.status == 'REJEITADO':
            campos_permitidos = {
                'nome',
                'responsavel',
                'unidade',
                'objetivo',
                'finalidade',
                'unidade_medida',
                'polaridade',
                'metodo_calculo',
                'formula',
                'observacao',
                'evolucao_indicador',
                'status',
            }
        else:
            campos_permitidos = {'evolucao_indicador', 'observacao'}

        campos_proibidos = set(request.data.keys()) - campos_permitidos
        if campos_proibidos:
            return Response(
                {
                    'detail': 'Você não possui permissão para alterar um ou mais campos.',
                    'campos_proibidos': list(campos_proibidos),
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        responsavel = request.data.get('responsavel')
        if responsavel is not None:
            try:
                responsavel_id = int(responsavel)
            except (TypeError, ValueError):
                responsavel_id = None

            if responsavel_id is None or not usuario.__class__.objects.filter(
                id=responsavel_id,
                unidade=usuario.unidade,
            ).exists():
                return Response(
                    {'detail': 'O responsável deve pertencer à sua unidade.'},
                    status=status.HTTP_403_FORBIDDEN,
                )

        if 'unidade' in request.data and str(request.data['unidade']) != str(usuario.unidade_id):
            return Response(
                {'detail': 'O indicador deve permanecer na sua unidade.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        return None

    def update(self, request, *args, **kwargs):
        erro = self._validar_campos_edicao(request)
        if erro is not None:
            return erro
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        erro = self._validar_campos_edicao(request)
        if erro is not None:
            return erro
        return super().partial_update(request, *args, **kwargs)

    def perform_update(self, serializer):
        usuario = self.request.user

        if usuario.papel == 'ADMIN':
            serializer.save()
            return

        serializer.save(
            unidade=usuario.unidade,
            status='EM_ESPERA',
            observacao_analise='',
        )

    @action(detail=True, methods=['post'], url_path='submeter-atualizacao')
    def submeter_atualizacao(self, request, pk=None):
        usuario = request.user
        indicador = self.get_object()

        if usuario.papel == 'ADMIN':
            return Response(
                {'detail': 'Administradores devem atualizar o indicador diretamente.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = SubmissaoRevisaoIndicadorSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        revisao = criar_revisao_indicador(indicador, serializer.validated_data, usuario)
        return Response(RevisaoEdicaoSerializer(revisao).data, status=status.HTTP_201_CREATED)