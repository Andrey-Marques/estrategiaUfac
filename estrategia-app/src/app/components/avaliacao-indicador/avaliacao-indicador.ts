import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { IndicadorEstrategico } from '../../model/indicadorEstrategico';
import { RevisaoEdicao } from '../../model/revisaoEdicao';
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

  @Input()
  revisao: RevisaoEdicao | null = null;

  @Output()
  fechado = new EventEmitter<void>();

  @Output()
  aprovado = new EventEmitter<DecisaoIndicador>();

  @Output()
  rejeitado = new EventEmitter<DecisaoIndicador>();

  @Output()
  revisaoAprovada = new EventEmitter<RevisaoEdicao>();

  @Output()
  revisaoRejeitada = new EventEmitter<{ revisao: RevisaoEdicao; observacao: string }>();

  @Output()
  editar = new EventEmitter<IndicadorEstrategico>();

  formulaRenderizada: SafeHtml | null = null;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnChanges(): void {
    this.renderizarFormula();
  }

  private renderizarFormula(): void {
    if (!this.indicador?.formula) {
      this.formulaRenderizada = '';
      return;
    }
    try {
      const htmlFormula = katex.renderToString(this.indicador.formula, {
        throwOnError: false,
        displayMode: true,
      });
      this.formulaRenderizada = this.sanitizer.bypassSecurityTrustHtml(htmlFormula);
    } catch (erro) {
      console.error('Erro ao renderizar fórmula:', erro);
      this.formulaRenderizada = null;
    }
  }

  observacao = '';
  mensagemErro = '';

  get modoAvaliacao(): boolean {
    return this.isAdmin && (this.indicador.status === 'EM_ESPERA' || this.revisao?.status === 'PENDENTE');
  }

  get modoVisualizacao(): boolean {
    return !this.modoAvaliacao;
  }

  get revisaoPendente(): boolean {
    return this.revisao?.status === 'PENDENTE';
  }

  get metasPropostas(): Array<{ ano?: string; meta_prevista?: string; meta_alcancada?: string }> {
    const metas = this.revisao?.diferencas['evolucao_indicador']?.proposto;
    return Array.isArray(metas) ? metas : [];
  }

  get observacaoProposta(): string | null {
    const observacao = this.revisao?.diferencas['observacao']?.proposto;
    return observacao === null || observacao === undefined ? null : String(observacao);
  }

  fechar(): void {
    this.observacao = '';
    this.mensagemErro = '';
    this.fechado.emit();
  }

  aprovar(): void {
    if (this.revisao?.status === 'PENDENTE') {
      this.revisaoAprovada.emit(this.revisao);
      return;
    }

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

    if (this.revisao?.status === 'PENDENTE') {
      this.revisaoRejeitada.emit({ revisao: this.revisao, observacao });
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

  obterRotuloRevisao(status: string): string {
    return ({ PENDENTE: 'Alteração pendente', APROVADA: 'Alteração aprovada', REJEITADA: 'Alteração rejeitada' } as Record<string, string>)[status] ?? status;
  }

  obterValorRevisao(valor: unknown, campo: string): string {
    if (valor === null || valor === undefined || valor === '') return 'Não informado';
    if (campo === 'evolucao_indicador' && Array.isArray(valor)) {
      return valor.map(meta => `${meta.ano || 'Ano'} | Prevista: ${meta.meta_prevista || '-'} | Alcançada: ${meta.meta_alcancada || '-'}`).join('\n') || 'Nenhuma evolução';
    }
    return String(valor);
  }
}
