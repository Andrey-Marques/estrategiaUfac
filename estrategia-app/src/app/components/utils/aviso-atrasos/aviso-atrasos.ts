import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AcaoEmAtraso } from '../../../service/atrasos.service';

@Component({
  selector: 'app-aviso-atrasos',
  standalone: true,
  imports: [CommonModule],
  template: `<div *ngIf="acoes.length" class="aviso-atrasos" role="status"><strong><i class="bi bi-exclamation-triangle" aria-hidden="true"></i> Ações em atraso ({{ acoes.length }})</strong><div class="lista-atrasos"><p *ngFor="let acao of acoes"><strong>{{ acao.tipo === 'projetos' ? 'Projeto' : 'Iniciativa' }}: {{ acao.registro_nome }}</strong> — {{ acao.acao_nome }}<small>Prazo previsto: {{ acao.prazo_fim | date:'dd/MM/yyyy':'UTC' }} · {{ acao.dias_atraso }} dia(s) de atraso</small></p></div></div>`,
  styles: [`.aviso-atrasos { margin-bottom: 20px; padding: 14px 18px; border: 1px solid #f0d991; border-left: 4px solid #d99b00; border-radius: 5px; background: #fffaf0; color: #8a5200; font-size: 14px; } .lista-atrasos { max-height: 200px; overflow-y: auto; margin-top: 10px; } p { margin: 0; padding: 8px 0; border-top: 1px solid #f0e3c5; } small { display: block; margin-top: 4px; font-size: 12px; }`],
})
export class AvisoAtrasos {
  @Input() acoes: AcaoEmAtraso[] = [];
}
