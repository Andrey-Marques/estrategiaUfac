import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProjetoEstrategico } from '../../model/projetoEstrategico';

type ProjetoAvaliacao = ProjetoEstrategico & {
  responsavel_nome?: string;
  unidade_sigla?: string;
};

export interface DecisaoProjeto {
  projeto: ProjetoEstrategico;
  observacao: string;
}

@Component({
  selector: 'app-avaliacao-projeto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './avaliacao-projeto.html',
  styleUrl: './avaliacao-projeto.scss'
})
export class AvaliacaoProjeto {

  @Input({ required: true })
  projeto!: ProjetoAvaliacao;

  @Input() isAdmin = false;

  @Output()
  fechado = new EventEmitter<void>();

  @Output()
  aprovado = new EventEmitter<DecisaoProjeto>();

  @Output()
  rejeitado = new EventEmitter<DecisaoProjeto>();

  @Output()
  editar = new EventEmitter<ProjetoEstrategico>();

    observacao = '';
    mensagemErro = '';

  get modoAvaliacao(): boolean {
    return this.isAdmin && this.projeto.status === 'EM_ESPERA';
  }

  get modoVisualizacao(): boolean {
    return !this.modoAvaliacao;
  }
  get realizacoesValidas() {
    return (this.projeto.evolucoes ?? [])
      .filter(evolucao =>
        evolucao.realizacao?.trim()
      );
  }

  get proximosPassosValidos() {
    return (this.projeto.evolucoes ?? [])
      .filter(evolucao =>
        evolucao.proximo_passo?.trim()
      );
  }

  editarProjeto(): void {
    this.editar.emit(this.projeto);
  }

  fechar(): void {
    this.observacao = '';
    this.mensagemErro = '';
    this.fechado.emit();
  }

  aprovar(): void {
    this.aprovado.emit({
      projeto: this.projeto,
      observacao: this.observacao.trim()
    });
  }

  rejeitar(): void {
    const observacao = this.observacao.trim();

    if (!observacao) {
      this.mensagemErro = 'Informe o motivo da rejeição.';
      return;
    }

    this.rejeitado.emit({
      projeto: this.projeto,
      observacao
    });
  }

  obterRotuloStatus(): string {
    const rotulos: Record<string, string> = {
      APROVADO: 'Aprovado/Público',
      REJEITADO: 'Rejeitado',
      RASCUNHO: 'Rascunho',
      EM_ESPERA: 'Em espera',
    };

    return rotulos[this.projeto.status] ?? this.projeto.status;
  }

  obterClasseStatus(): string {
    const classes: Record<string, string> = {
      APROVADO: 'status-aprovado',
      REJEITADO: 'status-rejeitado',
      RASCUNHO: 'status-rascunho',
      EM_ESPERA: 'status-em-espera',
    };

    return classes[this.projeto.status] ?? 'status-rascunho';
  }
}
