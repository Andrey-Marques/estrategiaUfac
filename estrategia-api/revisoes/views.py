from rest_framework.viewsets import (ReadOnlyModelViewSet)
from .models import RevisaoEdicao
from .serializers import (RevisaoEdicaoSerializer)
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status

from .services import (
    aprovar_revisao_projeto,
    aprovar_revisao_iniciativa,
    aprovar_revisao_indicador,
    rejeitar_revisao
)


class RevisaoEdicaoViewSet(
    ReadOnlyModelViewSet
):

    serializer_class = (
        RevisaoEdicaoSerializer
    )

    def get_queryset(self):

        usuario = self.request.user

        queryset = (
            RevisaoEdicao.objects
            .select_related(
                'criado_por',
                'analisado_por'
            )
        )

        if usuario.papel == 'ADMIN':
            return queryset

        return queryset.filter(
            criado_por=usuario
        )
    @action(
    detail=True,
    methods=['post']
    )
    def aprovar(
        self,
        request,
        pk=None
    ):

        if request.user.papel != 'ADMIN':

            return Response(
                {
                    'detail':
                        'Apenas administradores '
                        'podem aprovar revisões.'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        revisao = self.get_object()

        if revisao.entidade == 'PROJETO':

            projeto = aprovar_revisao_projeto(
                revisao,
                request.user
            )

            return Response({
                'detail':
                    'Alterações aprovadas e publicadas.',

                'projeto_id':
                    projeto.id
            })

        if revisao.entidade == 'INICIATIVA':
            iniciativa = aprovar_revisao_iniciativa(revisao, request.user)
            return Response({
                'detail': 'Alterações aprovadas e publicadas.',
                'iniciativa_id': iniciativa.id
            })

        if revisao.entidade == 'INDICADOR':
            indicador = aprovar_revisao_indicador(revisao, request.user)
            return Response({
                'detail': 'Alterações aprovadas e publicadas.',
                'indicador_id': indicador.id
            })

        return Response(
            {
                'detail':
                    'Este tipo de revisão ainda '
                    'não foi implementado.'
            },
            status=status.HTTP_400_BAD_REQUEST
        )
        
    @action(
        detail=True,
        methods=['post']
    )
    def rejeitar(
        self,
        request,
        pk=None
    ):

        if request.user.papel != 'ADMIN':

            return Response(
                {
                    'detail':
                        'Apenas administradores '
                        'podem rejeitar revisões.'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        revisao = self.get_object()

        revisao = rejeitar_revisao(
            revisao=revisao,

            administrador=request.user,

            observacao=request.data.get(
                'observacao'
            )
        )

        return Response(
            RevisaoEdicaoSerializer(
                revisao
            ).data
        )