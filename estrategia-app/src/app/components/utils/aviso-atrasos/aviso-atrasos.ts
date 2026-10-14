import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AcaoEmAtraso } from '../../../service/atrasos.service';

export function agruparAtrasos(acoes: AcaoEmAtraso[]) {
  const grupos = new Map<string, {tipo: AcaoEmAtraso['tipo']; registro_nome: string; nomes: string[]; prazo_inicio: string; dias_atraso: number}>();
  for (const acao of acoes) {
    const chave = `${acao.tipo}:${acao.registro_id}`;
    const grupo = grupos.get(chave);
    if (grupo) {
      grupo.nomes.push(acao.acao_nome);
      if (acao.prazo_inicio < grupo.prazo_inicio) grupo.prazo_inicio = acao.prazo_inicio;
      grupo.dias_atraso = Math.max(grupo.dias_atraso, acao.dias_atraso);
    } else {
      grupos.set(chave, {tipo: acao.tipo, registro_nome: acao.registro_nome, nomes: [acao.acao_nome], prazo_inicio: acao.prazo_inicio, dias_atraso: acao.dias_atraso});
    }
  }
  return [...grupos.values()];
}

@Component({
  selector: 'app-aviso-atrasos',
  standalone: true,
  imports: [CommonModule],
  template: `<div *ngIf="acoes.length" class="aviso-atrasos" role="status"><strong><i class="bi bi-exclamation-triangle" aria-hidden="true"></i> Ações em atraso ({{ acoes.length }})</strong><div class="lista-atrasos"><p *ngFor="let grupo of grupos"><strong>{{ grupo.tipo === 'projetos' ? 'Projeto' : 'Iniciativa' }}: {{ grupo.registro_nome }}</strong> — {{ grupo.nomes.join(', ') }}<small>{{ grupo.nomes.length > 1 ? 'Início previsto mais antigo' : 'Início previsto' }}: {{ grupo.prazo_inicio | date:'dd/MM/yyyy':'UTC' }} · {{ grupo.nomes.length > 1 ? 'Maior atraso' : 'Atraso no início' }}: {{ grupo.dias_atraso }} dia(s)</small></p></div></div>`,
  styles: [`.aviso-atrasos { margin-bottom: 20px; padding: 14px 18px; border: 1px solid #f0d991; border-left: 4px solid #d99b00; border-radius: 5px; background: #fffaf0; color: #8a5200; font-size: 14px; } .lista-atrasos { max-height: 200px; overflow-y: auto; margin-top: 10px; } p { margin: 0; padding: 8px 0; border-top: 1px solid #f0e3c5; } small { display: block; margin-top: 4px; font-size: 12px; }`],
})
export class AvisoAtrasos {
  @Input() acoes: AcaoEmAtraso[] = [];
  get grupos() { return agruparAtrasos(this.acoes); }
}
