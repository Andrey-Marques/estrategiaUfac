import { Breadcrumb } from '../utils/breadcrumb/breadcrumb';
import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { HeaderPublico } from '../utils/header-publico/header-publico';
import { Rodape } from '../utils/rodape/rodape';
import { carregarDetalhePublico } from '../../service/detalhe-publico';
import * as katex from 'katex';

@Component({
  selector: 'app-visualizacao-indicador',
  imports: [Breadcrumb, CommonModule, HeaderPublico, Rodape],
  templateUrl: './visualizacao-indicador.html',
  styleUrl: './visualizacao-indicador.scss',
})
export class VisualizacaoIndicador {
  private readonly sanitizer = inject(DomSanitizer);
  readonly detalhe = carregarDetalhePublico('indicadores');
  readonly detalheMetaAberto = signal<{ titulo: string; texto: string } | null>(null);

  readonly formula = computed(() => {
    const formula = this.detalhe.registro()?.formula;
    return formula ? this.sanitizer.bypassSecurityTrustHtml(
      katex.renderToString(formula, { throwOnError: false, displayMode: true, trust: false }),
    ) : null;
  });

  abrirPremissas(): void {
    this.detalheMetaAberto.set({
      titulo: 'Premissas das metas',
      texto: this.detalhe.registro()?.observacao || 'Nenhuma premissa foi informada.',
    });
  }

  abrirJustificativa(ano: string, justificativa: string): void {
    this.detalheMetaAberto.set({
      titulo: `Justificativa da meta alcançada — ${ano}`,
      texto: justificativa,
    });
  }

  fecharDetalheMeta(): void {
    this.detalheMetaAberto.set(null);
  }
}
