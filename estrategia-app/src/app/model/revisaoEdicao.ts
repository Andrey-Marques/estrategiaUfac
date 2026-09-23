export type TipoEntidade = | 'PROJETO' | 'INICIATIVA' | 'INDICADOR';

export type StatusRevisao = | 'PENDENTE' | 'APROVADA' | 'REJEITADA';

export interface DiferencaRevisao {
    anterior: any;
    proposto: any;
}

export interface RevisaoEdicao {
  id: number;
  entidade: TipoEntidade;
  entidade_id: number;

  dados_anteriores: any;
  dados_propostos: any;

  diferencas: Record<string, DiferencaRevisao>;
  status: StatusRevisao;

  observacao: string;

  criado_por: number;
  criado_por_nome: string;

  analisado_por: number | null;
  analisado_por_nome: string | null;

  criado_em: string;
  analisado_em: string | null;
}