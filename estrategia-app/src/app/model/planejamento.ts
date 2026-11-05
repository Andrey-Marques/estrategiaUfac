export interface Planejamento {
  id: number;
  nome: string;
  data_inicio: string;
  data_fim: string;
  status: 'Vigente' | 'Expirado';
}

export type CriarPlanejamento = Omit<Planejamento, 'id'>;

export interface Pdi {
  id: number;
  nome: string;
  data_inicio: string;
  data_fim: string;
  status: 'Vigente' | 'Expirado';
  planejamento: number;
}

export type CriarPdi = Omit<Pdi, 'id'>;
