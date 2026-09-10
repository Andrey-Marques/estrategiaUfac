export interface AcaoReslizada{
    id: number;
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
  descrição: string;
}

export interface IniciativaEstrategica{
    id: number;
    nome: string;
    data_preenchimento: string;
    ultima_atualização: string;
    observacao: string;
    percentual_evolucao: string;
    status: |'APROVADO'|'REJEITADO'|'RASCUNHO'|'EM_ESPERA';
    unidade: number;
    unidade_sigla?: string;
    responsavel: number;
    responsavel_nome?: string;
    projeto?: number | null;
    objetivos?: number[];
    objetivo_detalhe?: string;
    acoes_realizadas: AcaoReslizada[];
    obeservacao_analise?: string | null;
    analisado_por?: number | null;
}
