import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { HeaderPublico } from '../utils/header-publico/header-publico';
import { Rodape } from '../utils/rodape/rodape';
import { carregarDetalhePublico } from '../../service/detalhe-publico';
import * as katex from 'katex';

@Component({
  selector: 'app-visualizacao-indicador',
  imports: [CommonModule, RouterLink, HeaderPublico, Rodape],
  templateUrl: './visualizacao-indicador.html',
  styleUrl: './visualizacao-indicador.scss',
})
export class VisualizacaoIndicador {
  private readonly sanitizer = inject(DomSanitizer);
  readonly detalhe = carregarDetalhePublico('indicadores');

  readonly formula = computed(() => {
    const formula = this.detalhe.registro()?.formula;
    return formula ? this.sanitizer.bypassSecurityTrustHtml(
      katex.renderToString(formula, { throwOnError: false, displayMode: true, trust: false }),
    ) : null;
  });
}
