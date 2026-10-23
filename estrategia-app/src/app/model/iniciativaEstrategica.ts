export interface AcaoReslizada {
  id?: number;
  nome: string;
  prazo_inicio: string;
  prazo_fim: string;
  custo: string;
  custo_realizado?: string | number;
  data_inicio_efetivo?: string | null;
  data_fim_efetivo?: string | null;
  status: string;
  fk_iniciativa?: number;
}

export interface ObjetivoIniciativaDetalhe {
  id: number;
  codigo: string;
  descricao: string;
}

export interface IniciativaEstrategica {
  pode_excluir?: boolean;
  id: number;
  nome: string;
  data_preenchimento: string;
  ultima_atualizacao: string;
  observacao: string | null;
  percentual_evolucao: number | string;
  status: 'APROVADO' | 'REJEITADO' | 'EM_ESPERA';
  unidade: number;
  unidade_sigla?: string;
  responsavel: number;
  responsavel_nome?: string;
  projeto?: number | null;
  objetivos?: number[];
  objetivos_detalhes?: ObjetivoIniciativaDetalhe[];
  acoes_realizadas: AcaoReslizada[];
  observacao_analise?: string | null;
  analisado_por?: number | null;
}

export function totaisCustosIniciativa(acoes: readonly AcaoReslizada[] = []) {
  const centavos = (valor: number | string | undefined) => {
    const numero = Number(valor ?? 0);
    return Number.isFinite(numero) ? Math.round(numero * 100) : 0;
  };
  const estimado = acoes.reduce((total, acao) => total + centavos(acao.custo), 0);
  const realizado = acoes.reduce((total, acao) => total + centavos(acao.custo_realizado), 0);
  return { estimado: estimado / 100, realizado: realizado / 100 };
}
