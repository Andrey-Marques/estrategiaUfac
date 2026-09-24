import { Unidade } from './unidade';

export type PapelUsuario = 'ADMIN' | 'GESTOR' | 'SERVIDOR';

export interface Usuario {
  id: number;
  username: string;
  password?: string;
  nome_completo: string;
  nome_social: string;
  cpf: string;
  email: string;
  date_joined: string;
  papel: PapelUsuario;
  unidade: Unidade | number | null;
  unidade_nome?: string;
  unidade_sigla?: string;
}
