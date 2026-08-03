export interface EvolucaoProjeto{
    id: number;
    realizacao: string;
    proximo_passo: string;
    fk_projeto: number
}
export interface EvolucaoOrcamentaria{
    id: number;
    valor: number;
    data_registro: string;
    fk_projeto: number;
}

export interface ProjetoEstrategico{
    id: number;
    nome: string;
    descricao: string;
    tempo_estimado: string;
    custo_estimado: number;
    ultima_atualizacao: string;
    percentual_progresso: number;
    acoes_previstas: string;
    unidade: number;
    responsavel: number;
    objetivos: number[];
    evolucoes: EvolucaoProjeto[];
    evolucoesOrcamentarias: EvolucaoOrcamentaria[];

}