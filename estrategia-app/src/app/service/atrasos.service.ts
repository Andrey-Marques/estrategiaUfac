import { computed, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';

export interface AcaoEmAtraso {
  tipo: 'projetos' | 'iniciativas';
  registro_id: number;
  registro_nome: string;
  acao_id: number;
  acao_nome: string;
  prazo_inicio: string;
  dias_atraso: number;
}

@Injectable({providedIn: 'root'})
export class AtrasosService {
  projetos = signal<AcaoEmAtraso[]>([]);
  iniciativas = signal<AcaoEmAtraso[]>([]);
  todas = computed(() => [...this.projetos(), ...this.iniciativas()]);
  private tokenAtual: string | null = null;
  private carregando = false;
  constructor(private http: HttpClient) {}
  atualizar(): void {
    const token = localStorage.getItem('access');
    if (token !== this.tokenAtual) { this.projetos.set([]); this.iniciativas.set([]); this.tokenAtual = token; }
    if (this.carregando) return;
    this.carregando = true;
    this.http.get<{projetos: AcaoEmAtraso[]; iniciativas: AcaoEmAtraso[]}>('http://127.0.0.1:8000/api/acoes-em-atraso/').pipe(finalize(() => this.carregando = false)).subscribe({
      next: dados => { if (localStorage.getItem('access') === token) { this.projetos.set(dados.projetos); this.iniciativas.set(dados.iniciativas); } },
      error: () => { this.projetos.set([]); this.iniciativas.set([]); },
    });
  }
  temAtraso(tipo: 'projetos' | 'iniciativas', id: number): boolean {
    return this[tipo]().some(acao => acao.registro_id === id);
  }
}
