export interface AcaoReslizada{
    id?: number;
    nome: string;
    prazo_inicio: string;
    prazo_fim: string;
    custo: string;
    status: string;
    fk_iniciativa?: number;
}

export interface ObjetivoIniciativaDetalhe{
  id: number;
  codigo: string;
  descricao: string;
}

export interface IniciativaEstrategica{
    id: number;
    nome: string;
    data_preenchimento: string;
    ultima_atualização: string;
    observacao: string | null;
    percentual_evolucao: number | string;
    status: |'APROVADO'|'REJEITADO'|'RASCUNHO'|'EM_ESPERA';
    unidade: number;
    unidade_sigla?: string;
    responsavel: number;
    responsavel_nome?: string;
    projeto?: number | null;
    objetivos?: number[];
    objetivo_detalhe?: ObjetivoIniciativaDetalhe[];
    acoes_realizadas: AcaoReslizada[];
    observacao_analise?: string | null;
    analisado_por?: number | null;
}
