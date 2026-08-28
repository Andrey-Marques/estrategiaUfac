import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IndicadorEstrategico } from '../../model/indicadorEstrategico';
import { IndicadorService } from '../../service/indicador.service';

@Component({
  selector: 'app-listagem-indicadores',
  imports: [CommonModule],
  templateUrl: './listagem-indicadores.html',
  styleUrl: './listagem-indicadores.scss',
})
export class ListagemIndicadores {
  indicadores = signal<IndicadorEstrategico[]>([]);

  constructor(private indicadorService: IndicadorService) {}

  ngOnInit(): void {
    this.buscarIndicador();
  }

  buscarIndicador(): void {
    this.indicadorService.get().subscribe({
      next: (indicadores) => this.indicadores.set(indicadores),
      error: (erro) => console.error('erro ao buscar indicadores', erro)
    });
  }
}
