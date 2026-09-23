import {Component, EventEmitter, Input, Output} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {IniciativaEstrategica} from '../../model/iniciativaEstrategica';
import { RevisaoEdicao } from '../../model/revisaoEdicao';


export interface DecisaoIniciativa {

  iniciativa: IniciativaEstrategica;
  observacao: string;
}

@Component({
  selector: 'app-avaliacao-iniciativa',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl:'./avaliacao-iniciativa.html',
  styleUrl:'./avaliacao-iniciativa.scss'
})
export class AvaliacaoIniciativa {

  @Input({ required: true })
  iniciativa!: IniciativaEstrategica;

  @Input()
  isAdmin = false;

  @Input()
  revisao: RevisaoEdicao | null = null;

  @Output()
  fechado = new EventEmitter<void>();

  @Output()
  aprovado =
    new EventEmitter<DecisaoIniciativa>();

  @Output()
  rejeitado =
    new EventEmitter<DecisaoIniciativa>();

  @Output()
  revisaoAprovada = new EventEmitter<RevisaoEdicao>();

  @Output()
  revisaoRejeitada = new EventEmitter<{ revisao: RevisaoEdicao; observacao: string }>();

  @Output()
  editar =
    new EventEmitter<IniciativaEstrategica>();

  observacao = '';
  mensagemErro = '';


  get modoAvaliacao(): boolean {
    return (
      this.isAdmin &&
      (this.iniciativa.status === 'EM_ESPERA' || this.revisao?.status === 'PENDENTE')
    );
  }


  get modoVisualizacao(): boolean {
    return !this.modoAvaliacao;
  }

  get revisaoPendente(): boolean {
    return this.revisao?.status === 'PENDENTE';
  }

  get acoesPropostas(): Array<{ nome?: string; prazo_inicio?: string; prazo_fim?: string; custo?: string | number; status?: string }> {
    const acoes = this.revisao?.diferencas['acoes']?.proposto;
    return Array.isArray(acoes) ? acoes : [];
  }

  get observacaoProposta(): string | null {
    const observacao = this.revisao?.diferencas['observacao']?.proposto;
    return observacao === null || observacao === undefined ? null : String(observacao);
  }

  get percentualProposto(): string | number | null {
    const percentual = this.revisao?.diferencas['percentual_evolucao']?.proposto;
    return percentual === null || percentual === undefined ? null : percentual;
  }


  fechar(): void {
    this.fechado.emit();
  }


  editarIniciativa(): void {
    this.editar.emit( this.iniciativa);
  }


  rejeitar(): void {
    const observacao = this.observacao.trim();

    if (!observacao) {
      this.mensagemErro = 'Informe o motivo da rejeição.';
      return;
    }

    if (this.revisao?.status === 'PENDENTE') {
      this.revisaoRejeitada.emit({ revisao: this.revisao, observacao });
      return;
    }

    this.rejeitado.emit({iniciativa: this.iniciativa, observacao});
  }

  aprovar(): void {
    if (this.revisao?.status === 'PENDENTE') {
      this.revisaoAprovada.emit(this.revisao);
      return;
    }

    this.aprovado.emit({ iniciativa: this.iniciativa, observacao: this.observacao.trim() });
  }

  obterRotuloRevisao(status: string): string {
    return ({ PENDENTE: 'Alteração pendente', APROVADA: 'Alteração aprovada', REJEITADA: 'Alteração rejeitada' } as Record<string, string>)[status] ?? status;
  }

  obterValorRevisao(valor: unknown, campo: string): string {
    if (valor === null || valor === undefined || valor === '') return 'Não informado';
    if (campo === 'percentual_evolucao') return `${valor}%`;
    if (campo === 'acoes' && Array.isArray(valor)) {
      return valor.map(acao => `${acao.nome || 'Ação sem nome'} | ${acao.status || 'Sem status'} | ${acao.custo ?? 'Sem custo'}`).join('\n') || 'Nenhuma ação';
    }
    return String(valor);
  }
}
