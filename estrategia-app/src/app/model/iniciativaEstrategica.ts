export interface AcaoReslizada{
    id: number;
    nome: string;
    prazo_inicio: string;
    prazo_fim: string;
    custo: string;
    status: string;
    fk_iniciativa: number;
}

export interface IniciativaEstrategica{
    id: number;
    nome: string;
    descricao: string;
    data_preenchimento: string;
    observacao: string;
    percentual_evolucao: string;
    unidade: number;
    responsavel: number;
    projeto: number;
    acoesRealizadas: AcaoReslizada[];
}