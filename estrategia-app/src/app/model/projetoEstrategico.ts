export type TipoEvolucao =
  'REALIZACAO' |
  'PROXIMO_PASSO';


export interface EvolucaoProjeto {
  id: number;
  descricao: string;
  tipo: TipoEvolucao;
  fk_projeto: number;
}

export interface EvolucaoOrcamentaria {
  id: number;
  valor: number;
  descricao: string;
  data_registro: string;
  fk_projeto: number;
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
    acoes_previstas: string;
    unidade: number;
    responsavel: number;
    objetivos: number[];
    objetivos_detalhes?: ObjetivoProjetoDetalhe[];
    evolucoes: EvolucaoProjeto[];
    evolucoesOrcamentarias: EvolucaoOrcamentaria[];
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
  custo_estimado: number;
  percentual_progresso: number;
  status: string;
  acoes_previstas: string;
  objetivos: number[];
  evolucoes?: EvolucaoPayload[];
  evolucoesOrcamentarias?: {valor: number; descricao: string;}[];
}
