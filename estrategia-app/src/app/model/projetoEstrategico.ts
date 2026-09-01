export interface EvolucaoProjeto{
    id: number;
    realizacao: string;
    proximo_passo: string;
    fk_projeto: number
}

export interface EvolucaoOrcamentaria {
  id: number;
  valor: number;
  descricao: string;
  data_registro: string;
  fk_projeto: number;
}

export interface EvolucaoPayload {
  realizacao?: string;
  proximo_passo?: string;
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
    evolucoes: EvolucaoProjeto[];
    evolucoesOrcamentarias: EvolucaoOrcamentaria[];
}

export interface CriarProjeto{
  nome: string;
  descricao: string;
  tempo_estimado: string;
  custo_estimado: number;
  percentual_progresso: number;
  status: string;
  acoes_previstas: string;
  objetivos: number[];
  evolucoes?: EvolucaoPayload[];
}
