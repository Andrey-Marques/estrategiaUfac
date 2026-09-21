import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IndicadorEstrategico } from '../../model/indicadorEstrategico';
import * as katex from 'katex';

type IndicadorAvaliacao = IndicadorEstrategico & {
  responsavel_nome?: string;
  unidade_sigla?: string;
  objetivo_detalhes?: { id: number; codigo: string; descricao: string };
  evolucao_indicador?: {
    ano: string;
    meta_prevista: string;
    meta_alcancada: string;
  }[];
};

export interface DecisaoIndicador {
  indicador: IndicadorEstrategico;
  observacao: string;
}

@Component({
  selector: 'app-avaliacao-indicador',
  standalone: true,
  imports: [CommonModule, FormsModule],

  templateUrl: './avaliacao-indicador.html',
  styleUrl: './avaliacao-indicador.scss',
})
export class AvaliacaoIndicador implements OnChanges {
  @Input({ required: true })
  indicador!: IndicadorAvaliacao;

  @Input()
  isAdmin = false;

  @Output()
  fechado = new EventEmitter<void>();

  @Output()
  aprovado = new EventEmitter<DecisaoIndicador>();

  @Output()
  rejeitado = new EventEmitter<DecisaoIndicador>();

  @Output()
  editar = new EventEmitter<IndicadorEstrategico>();
  ngOnChanges(): void {
    this.renderizarFormula();
  }

  private renderizarFormula(): void {
    if (!this.indicador?.formula) {
      this.formulaRenderizada = '';
      return;
    }
    this.formulaRenderizada =
      katex.renderToString(
        this.indicador.formula,
        {throwOnError: false, displayMode: true}
      );
  }

  observacao = '';
  mensagemErro = '';
  formulaRenderizada = '';

  get modoAvaliacao(): boolean {
    return this.isAdmin && this.indicador.status === 'EM_ESPERA';
  }

  get modoVisualizacao(): boolean {
    return !this.modoAvaliacao;
  }

  fechar(): void {
    this.observacao = '';
    this.mensagemErro = '';
    this.fechado.emit();
  }

  aprovar(): void {
    this.aprovado.emit({
      indicador: this.indicador,
      observacao: this.observacao.trim(),
    });
  }

  rejeitar(): void {
    const observacao = this.observacao.trim();

    if (!observacao) {
      this.mensagemErro = 'Informe o motivo da rejeição.';
      return;
    }

    this.rejeitado.emit({ indicador: this.indicador, observacao });
  }

  editarIndicador(): void {
    this.editar.emit(this.indicador);
  }

  obterRotuloStatus(): string {
    const rotulos: Record<string, string> = {
      APROVADO: 'Aprovado/Público',
      REJEITADO: 'Rejeitado',
      RASCUNHO: 'Rascunho',
      EM_ESPERA: 'Em espera',
    };

    return rotulos[this.indicador.status] ?? this.indicador.status;
  }

  obterClasseStatus(): string {
    const classes: Record<string, string> = {
      APROVADO: 'status-aprovado',
      REJEITADO: 'status-rejeitado',
      RASCUNHO: 'status-rascunho',
      EM_ESPERA: 'status-em-espera',
    };

    return classes[this.indicador.status] ?? 'status-rascunho';
  }
}
