export interface IndicadorEstrategico {
    id: number;
    nome: string;
    polaridade: string;
    finalidade: string;
    status: string;
    metodo_calculo: string;
    formula: string;
    unidade: number;
    objetivo: number;
    responsavel: number;
    observacao: string;
    unidade_medida: string;
    data_envio?: string;
    responsavel_nome?: string;
    unidade_sigla?: string;
    objetivo_detalhes?: {id: number; codigo: string; descricao: string;};
    evolucao_indicador?: EvolucaoIndicador[];
    observacao_analise?: string;
}

export interface EvolucaoIndicador {
    id: number;
    meta_prevista: string;
    meta_alcancada: string;
    ano: string;
    indicador: number;
}
