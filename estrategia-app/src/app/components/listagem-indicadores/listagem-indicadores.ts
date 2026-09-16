import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IndicadorEstrategico } from '../../model/indicadorEstrategico';
import { IndicadorService } from '../../service/indicador.service';
import { FormsModule } from '@angular/forms';
import { ObjetivoEstrategico } from '../../model/objetivoEstrategico';

@Component({
  selector: 'app-listagem-indicadores',
  imports: [CommonModule, FormsModule],
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

  etapaAtual = 1;

  previewFormula: string | null = null;

  metas: {
    ano: number | null;
    prevista: number | null;
    alcancada: number | null;
  }[] = [
    {
      ano: new Date().getFullYear(),
      prevista: null,
      alcancada: null
    }
  ];


  /* =========================
    NAVEGAÇÃO
    ========================= */

  avancar(): void {
    if (this.etapaAtual < 4) {
      this.etapaAtual++;
    }
  }


  voltar(): void {
    if (this.etapaAtual > 1) {
      this.etapaAtual--;
    }
  }


  irParaEtapa(etapa: number): void {
    if (etapa >= 1 && etapa <= 4) {
      this.etapaAtual = etapa;
    }
  }


  /* =========================
    METAS
    ========================= */

  adicionarMeta(): void {

    const ultimoAno =
      this.metas.length > 0
        ? Number(this.metas[this.metas.length - 1].ano)
        : new Date().getFullYear() - 1;


    this.metas.push({
      ano: ultimoAno + 1,
      prevista: null,
      alcancada: null
    });

  }


  removerMeta(indice: number): void {
    this.metas.splice(indice, 1);
  }


  /* =========================
    IMAGEM DA FÓRMULA
    ========================= */

  selecionarImagemFormula(event: Event): void {

    const input = event.target as HTMLInputElement;

    const arquivo = input.files?.[0];


    if (!arquivo) {
      return;
    }


    const reader = new FileReader();


    reader.onload = () => {
      this.previewFormula = reader.result as string;
    };


    reader.readAsDataURL(arquivo);
  }

  objetivos = signal([
    {
      codigo: 'OBJ-001',
      descricao: 'Exemplo de objetivo estratégico'
    },
    {
      codigo: 'OBJ-002',
      descricao: 'Outro objetivo estratégico'
    }
  ]);

}
