import { Unidade } from './unidade';

export type PapelUsuario = 'ADMIN' | 'UNIDADE' | 'SERVIDOR';

export interface Usuario {
  id: number;
  username: string;
  nome_completo: string;
  nome_social: string;
  cpf: string;
  email: string;
  papel: PapelUsuario;
  unidade: Unidade | number | null;
  unidade_nome?: string;
}
