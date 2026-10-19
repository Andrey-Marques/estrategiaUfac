export function validarStatusAcao(status: string, inicio: string | null, fim: string | null): string | null {
  if (status === 'CONCLUIDA' && (!inicio || !fim)) {
    return 'Para concluir a ação, informe as datas de início e fim efetivo.';
  }
  if (status === 'ANDAMENTO' && !inicio) {
    return 'Para colocar a ação em andamento, informe a data de início efetivo.';
  }
  return null;
}
