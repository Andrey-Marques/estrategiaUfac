from rest_framework import serializers


def validar_datas_status_acao(dados, instancia=None):
    status = dados.get('status', getattr(instancia, 'status', 'PLANEJAMENTO'))
    inicio = dados.get('data_inicio_efetivo', getattr(instancia, 'data_inicio_efetivo', None))
    fim = dados.get('data_fim_efetivo', getattr(instancia, 'data_fim_efetivo', None))
    erros = {}
    if status in ('ANDAMENTO', 'CONCLUIDA') and not inicio:
        erros['data_inicio_efetivo'] = 'Informe o início efetivo para uma ação em andamento ou concluída.'
    if status == 'CONCLUIDA' and not fim:
        erros['data_fim_efetivo'] = 'Informe o fim efetivo para concluir a ação.'
    if erros:
        raise serializers.ValidationError(erros)
