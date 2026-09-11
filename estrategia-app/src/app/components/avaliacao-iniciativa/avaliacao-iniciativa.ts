import {Component, EventEmitter, Input, Output} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {IniciativaEstrategica} from '../../model/iniciativaEstrategica';


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

  @Output()
  fechado = new EventEmitter<void>();

  @Output()
  aprovado =
    new EventEmitter<DecisaoIniciativa>();

  @Output()
  rejeitado =
    new EventEmitter<DecisaoIniciativa>();

  @Output()
  editar =
    new EventEmitter<IniciativaEstrategica>();

  observacao = '';
  mensagemErro = '';


  get modoAvaliacao(): boolean {
    return (
      this.isAdmin &&
      this.iniciativa.status === 'EM_ESPERA'
    );
  }


  get modoVisualizacao(): boolean {
    return !this.modoAvaliacao;
  }


  fechar(): void {
    this.fechado.emit();
  }


  editarIniciativa(): void {
    this.editar.emit( this.iniciativa);
  }


  aprovar(): void {
    this.aprovado.emit({ iniciativa: this.iniciativa, observacao: this.observacao.trim()});
  }

  rejeitar(): void {
    const observacao = this.observacao.trim();

    if (!observacao) {
      this.mensagemErro = 'Informe o motivo da rejeição.';
      return;
    }

    this.rejeitado.emit({iniciativa: this.iniciativa, observacao});
  }
}
