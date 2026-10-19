import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-paginacao',
  imports: [CommonModule],
  templateUrl: './paginacao.html',
  styleUrl: './paginacao.scss',
})
export class Paginacao {
  total = input.required<number>();
  pagina = input.required<number>();
  porPagina = input.required<number>();
  paginaAlterada = output<number>();
  tamanhoAlterado = output<number>();
  totalPaginas = computed(() => Math.max(1, Math.ceil(this.total() / this.porPagina())));
  inicio = computed(() => this.total() ? (this.pagina() - 1) * this.porPagina() + 1 : 0);
  fim = computed(() => Math.min(this.pagina() * this.porPagina(), this.total()));
  paginas = computed(() => {
    const ultima = this.totalPaginas();
    const numeros = Array.from(new Set([1, this.pagina() - 1, this.pagina(), this.pagina() + 1, ultima]))
      .filter(pagina => pagina >= 1 && pagina <= ultima).sort((a, b) => a - b);
    const paginas: number[] = [];
    for (const numero of numeros) {
      if (paginas.length && numero - paginas[paginas.length - 1] > 1) paginas.push(0);
      paginas.push(numero);
    }
    return paginas;
  });

  alterarTamanho(evento: Event): void {
    this.tamanhoAlterado.emit(Number((evento.target as HTMLSelectElement).value));
  }
}
