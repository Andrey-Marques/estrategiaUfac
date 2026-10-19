from django.db import transaction
from django.utils import timezone
from rest_framework import serializers, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from .models import RevisaoEdicao


def pode_excluir(usuario, registro):
    if not usuario or not usuario.is_authenticated or registro.status == 'EXCLUIDO':
        return False
    if usuario.papel == 'ADMIN':
        return True
    if registro.status == 'APROVADO' or usuario.unidade_id != registro.unidade_id:
        return False
    return usuario.papel == 'GESTOR' or (usuario.papel == 'SERVIDOR' and registro.responsavel_id == usuario.pk)


class ExclusaoSerializerMixin(serializers.Serializer):
    pode_excluir = serializers.SerializerMethodField()

    def get_pode_excluir(self, registro):
        request = self.context.get('request')
        return pode_excluir(request.user if request else None, registro)

    def validate_status(self, valor):
        if valor == 'EXCLUIDO':
            raise serializers.ValidationError('Use a opção Excluir na visualização do registro.')
        if valor not in {'APROVADO', 'REJEITADO', 'EM_ESPERA'}:
            raise serializers.ValidationError('Status inválido. Use aprovado, rejeitado ou em espera.')
        return valor


class ExclusaoRegistroMixin:
    def destroy(self, request, *args, **kwargs):
        with transaction.atomic():
            registro = self.get_object()
            registro = registro.__class__.objects.select_for_update().get(pk=registro.pk)
            if registro.status == 'EXCLUIDO':
                raise ValidationError({'detail': 'Este registro já foi excluído.'})
            if not pode_excluir(request.user, registro):
                raise PermissionDenied('Você não possui permissão para excluir este registro. Registros aprovados só podem ser excluídos pelo administrador.')
            status_anterior = registro.status
            registro.status = 'EXCLUIDO'
            registro.save(update_fields=['status'])
            agora = timezone.now()
            RevisaoEdicao.objects.filter(entidade=self.entidade_exclusao, entidade_id=registro.pk, status='PENDENTE').update(
                status='REJEITADA', observacao='Revisão encerrada porque o registro foi excluído.',
                analisado_por=request.user, analisado_em=agora,
            )
            # O histórico existente guarda autor, data e status anterior.
            RevisaoEdicao.objects.create(
                entidade=self.entidade_exclusao, entidade_id=registro.pk,
                dados_anteriores={'id': registro.pk, 'nome': registro.nome, 'status': status_anterior},
                dados_propostos={'exclusao': True, 'status': 'EXCLUIDO'},
                diferencas={'status': {'anterior': status_anterior, 'proposto': 'EXCLUIDO'}},
                status='APROVADA', observacao='Registro excluído após confirmação.', criado_por=request.user,
                analisado_por=request.user, analisado_em=agora,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)
