import { totaisCustosIniciativa } from '../../model/iniciativaEstrategica';
import { Breadcrumb } from '../utils/breadcrumb/breadcrumb';
import { CommonModule } from '@angular/common';
import { Component, computed } from '@angular/core';
import { HeaderPublico } from '../utils/header-publico/header-publico';
import { Rodape } from '../utils/rodape/rodape';
import { carregarDetalhePublico } from '../../service/detalhe-publico';

@Component({
  selector: 'app-visualizacao-iniciativa',
  imports: [Breadcrumb, CommonModule, HeaderPublico, Rodape],
  templateUrl: './visualizacao-iniciativa.html',
  styleUrl: './visualizacao-iniciativa.scss',
})
export class VisualizacaoIniciativa {
  readonly detalhe = carregarDetalhePublico('iniciativas');
  readonly custos = computed(() => totaisCustosIniciativa(this.detalhe.registro()?.acoes_realizadas));

  statusAcao(status: string): string {
    return ({ PLANEJAMENTO: 'Não iniciada', ANDAMENTO: 'Em execução', CONCLUIDA: 'Concluída', CANCELADA: 'Cancelada' } as Record<string, string>)[status] ?? status;
  }
}
