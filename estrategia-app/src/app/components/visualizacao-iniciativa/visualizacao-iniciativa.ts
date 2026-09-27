import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderPublico } from '../utils/header-publico/header-publico';
import { Rodape } from '../utils/rodape/rodape';
import { carregarDetalhePublico } from '../../service/detalhe-publico';

@Component({
  selector: 'app-visualizacao-iniciativa',
  imports: [CommonModule, RouterLink, HeaderPublico, Rodape],
  templateUrl: './visualizacao-iniciativa.html',
  styleUrl: './visualizacao-iniciativa.scss',
})
export class VisualizacaoIniciativa {
  readonly detalhe = carregarDetalhePublico('iniciativas');

  statusAcao(status: string): string {
    return ({ PLANEJAMENTO: 'Planejamento', ANDAMENTO: 'Em andamento', CONCLUIDA: 'Concluída', CANCELADA: 'Cancelada' } as Record<string, string>)[status] ?? status;
  }
}
