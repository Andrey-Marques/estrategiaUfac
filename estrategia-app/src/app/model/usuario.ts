import { Unidade } from "./unidade";

/**
 * Papéis permitidos no sistema.
 */
export type PapelUsuario = "ADMIN" | "UNIDADE" | "SERVIDOR";

export interface Usuario {
    id: number;
    username: string;
    password: string;
    first_name: string;
    last_name: string;
    nome_completo: string;
    email: string;
    papel: PapelUsuario;
    unidade: Unidade | null;
    last_login: string | null;
    date_joined: string;
    is_superuser: boolean;
    is_staff: boolean;
    is_active: boolean;
    groups: number[];
    user_permissions: number[];
}