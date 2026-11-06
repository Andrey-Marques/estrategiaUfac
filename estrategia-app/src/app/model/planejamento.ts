export interface Planejamento {
  id: number;
  nome: string;
  data_inicio: string;
  data_fim: string;
  status: 'Vigente' | 'Expirado';
  quantidade_objetivos?: number;
}

export type CriarPlanejamento = Omit<Planejamento, 'id'>;

export interface Pdi {
  id: number;
  nome: string;
  data_inicio: string;
  data_fim: string;
  status: 'Vigente' | 'Expirado';
  planejamento: number;
  quantidade_iniciativas?: number;
}

export type CriarPdi = Omit<Pdi, 'id'>;
