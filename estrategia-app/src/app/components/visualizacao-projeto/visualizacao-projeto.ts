import { CommonModule } from '@angular/common';
import { Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderPublico } from '../utils/header-publico/header-publico';
import { Rodape } from '../utils/rodape/rodape';
import { carregarDetalhePublico } from '../../service/detalhe-publico';

@Component({
  selector: 'app-visualizacao-projeto',
  imports: [CommonModule, RouterLink, HeaderPublico, Rodape],
  templateUrl: './visualizacao-projeto.html',
  styleUrl: './visualizacao-projeto.scss',
})
export class VisualizacaoProjeto {
  readonly detalhe = carregarDetalhePublico('projetos');

  readonly evolucoes = computed(() => {
    const itens = this.detalhe.registro()?.evolucoes ?? [];
    const realizadas = itens.filter(item => item.tipo === 'REALIZACAO');
    const proximos = itens.filter(item => item.tipo === 'PROXIMO_PASSO');
    return Array.from({ length: Math.max(realizadas.length, proximos.length) }, (_, i) => ({
      realizada: realizadas[i]?.descricao ?? '—', proximo: proximos[i]?.descricao ?? '—',
    }));
  });
  rotuloStatusAcao(status: string): string {
    return ({ PLANEJAMENTO: 'Não iniciada', ANDAMENTO: 'Em execução', CONCLUIDA: 'Concluída',
      CANCELADA: 'Cancelada' } as Record<string, string>)[status] ?? status;
  }
}
