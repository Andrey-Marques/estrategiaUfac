import { Component, input } from '@angular/core';
import { StatusExecucaoProjeto } from '../../../model/projetoEstrategico';

@Component({
  selector: 'app-status-projeto',
  template: '<span class="status-execucao" [class]="\'status-execucao status-\' + (status() || \'ANDAMENTO\')">{{ rotulo() }}</span>',
  styles: `
    .status-execucao { display: inline-block; padding: 4px 10px; border: 1px solid; border-radius: 4px; font-size: 12px; font-weight: 600; white-space: nowrap; }
    .status-ANDAMENTO { color: #0b3470; background: #e8f0ff; border-color: #aecffa; }
    .status-DESCONTINUADO { color: #b42318; background: #fff3f1; border-color: #f3c6bf; }
    .status-CONCLUIDO { color: #16803c; background: #eef9f1; border-color: #a6dcb5; }
  `,
})
export class StatusProjeto {
  status = input<StatusExecucaoProjeto | undefined>();
  rotulo(): string {
    return { ANDAMENTO: 'Em andamento', DESCONTINUADO: 'Descontinuado', CONCLUIDO: 'Concluído' }[this.status() || 'ANDAMENTO'];
  }
}
