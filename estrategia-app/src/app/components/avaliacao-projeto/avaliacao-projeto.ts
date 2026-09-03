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

  observacao = '';
  mensagemErro = '';

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
}
