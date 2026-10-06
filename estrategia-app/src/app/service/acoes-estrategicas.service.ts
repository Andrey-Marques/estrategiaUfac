import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ProjetoEstrategico } from '../model/projetoEstrategico';
import { IndicadorEstrategico } from '../model/indicadorEstrategico';
import { IniciativaEstrategica } from '../model/iniciativaEstrategica';

interface DetalhePublico {
  id: number;
  nome: string;
  unidade_nome: string;
  unidade_sigla: string;
  responsavel_nome: string | null;
  objetivos_detalhes: Array<{ id: number; codigo: string; descricao: string }>;
}

export interface DetalhesPublicos {
  projetos: DetalhePublico & Pick<ProjetoEstrategico, 'descricao' | 'tempo_estimado' | 'custo_estimado' | 'ultima_atualizacao' | 'percentual_progresso' | 'custo_realizado' | 'acoes' | 'evolucoes'>;
  indicadores: DetalhePublico & Pick<IndicadorEstrategico, 'finalidade' | 'polaridade' | 'unidade_medida' | 'metodo_calculo' | 'formula' | 'observacao' | 'data_envio' | 'evolucao_indicador'>;
  iniciativas: DetalhePublico & Pick<IniciativaEstrategica, 'data_preenchimento' | 'ultima_atualizacao' | 'observacao' | 'percentual_evolucao' | 'acoes_realizadas'>;
}

export type TipoAcaoEstrategica = 'projetos' | 'indicadores' | 'iniciativas';

export interface AcaoEstrategicaPublica {
  id: number;
  tipo: TipoAcaoEstrategica;
  titulo: string;
  unidade_id: number;
  unidade_sigla: string;
  responsavel: string | null;
  objetivos: Array<{ id: number; codigo: string }>;
  data_atualizacao: string | null;
  data_cadastro: string | null;
}

export interface AcoesEstrategicasPublicas {
  registros: AcaoEstrategicaPublica[];
  unidades: Array<{ id: number; sigla: string; nome: string }>;
  objetivos: Array<{ id: number; codigo: string; descricao: string }>;
}

@Injectable({ providedIn: 'root' })
export class AcoesEstrategicasService {
  private readonly http = inject(HttpClient);
  private readonly url = 'http://localhost:8000/api/acoes-estrategicas/';

  listar() {
    return this.http.get<AcoesEstrategicasPublicas>(this.url);
  }

  detalhe<T extends TipoAcaoEstrategica>(tipo: T, id: number) {
    return this.http.get<DetalhesPublicos[T]>(`${this.url}${tipo}/${id}/`);
  }
}
