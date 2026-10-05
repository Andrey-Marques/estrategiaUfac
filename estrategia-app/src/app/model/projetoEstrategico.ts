export type TipoEvolucao =
  'REALIZACAO' |
  'PROXIMO_PASSO';


export interface EvolucaoProjeto {
  id: number;
  descricao: string;
  tipo: TipoEvolucao;
  fk_projeto: number;
}

export interface AcaoProjeto {
  id?: number;
  nome: string;
  prazo_inicio: string;
  prazo_fim: string;
  custo_estimado: number | string;
  custo_realizado: number | string;
  data_inicio_efetivo: string | null;
  data_fim_efetivo: string | null;
  status: 'PLANEJAMENTO' | 'ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';
}

export interface EvolucaoPayload {
  descricao: string;
  tipo: TipoEvolucao;
}
export interface ObjetivoProjetoDetalhe {
  id: number;
  codigo: string;
  descricao: string;
}

export interface ProjetoEstrategico{
    id: number;
    nome: string;
    descricao: string;
    tempo_estimado: string;
    custo_estimado: number;
    ultima_atualizacao: string;
    percentual_progresso: number;
    status: string;
    custo_realizado: number | string;
    acoes: AcaoProjeto[];
    unidade: number;
    responsavel: number;
    objetivos: number[];
    objetivos_detalhes?: ObjetivoProjetoDetalhe[];
    evolucoes: EvolucaoProjeto[];
    observacao_analise?: string;
    data_analise?: string | null;
    analisado_por?: number | null;
    responsavel_nome?: string;
    unidade_sigla?: string;
}

export interface CriarProjeto {
  nome: string;
  descricao: string;
  tempo_estimado: string;
  percentual_progresso: number;
  status: string;
  acoes: Omit<AcaoProjeto, 'id'>[];
  objetivos: number[];
  evolucoes?: EvolucaoPayload[];
}
