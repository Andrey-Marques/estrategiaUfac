// Remove pares iguais sem depender da ordem ou dos IDs recriados pela API.
export function compararAcoes<T extends object>(anteriores: T[], propostas: T[]): { anteriores: T[]; propostas: T[] } {
  const chave = (acao: T): string => {
    const dados = acao as Record<string, unknown>;
    return JSON.stringify([
      dados['nome'], dados['prazo_inicio'], dados['prazo_fim'], dados['status'],
      Number(dados['custo_estimado'] ?? dados['custo'] ?? 0),
      Number(dados['custo_realizado'] ?? 0),
      dados['data_inicio_efetivo'] || null, dados['data_fim_efetivo'] || null,
    ]);
  };
  const restantes = propostas.map(acao => ({ acao, chave: chave(acao) }));
  const alteradas = anteriores.filter(acao => {
    const indice = restantes.findIndex(item => item.chave === chave(acao));
    if (indice === -1) return true;
    restantes.splice(indice, 1);
    return false;
  });
  return { anteriores: alteradas, propostas: restantes.map(item => item.acao) };
}
