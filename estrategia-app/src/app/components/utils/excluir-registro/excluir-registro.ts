import { ConfirmacaoExclusao } from '../confirmacao-exclusao/confirmacao-exclusao';
import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef, EventEmitter, Input, Output } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-excluir-registro',
  standalone: true,
  imports: [CommonModule, ConfirmacaoExclusao],
  templateUrl: './excluir-registro.html',
  styleUrl: './excluir-registro.scss',
})
export class ExcluirRegistro {
  @Input({required: true}) tipo!: 'projetos' | 'iniciativas' | 'indicadores';
  @Input({required: true}) registro!: {id: number; nome: string; status: string; pode_excluir?: boolean};
  @Output() excluido = new EventEmitter<void>();
  excluindo = false;
  erro = '';
  get mensagemConfirmacao(): string {
    const nome = {projetos: 'esse projeto', iniciativas: 'essa iniciativa', indicadores: 'esse indicador'}[this.tipo];
    return `Tem certeza que deseja excluir ${nome}?`;
  }
  confirmacaoAberta = false;
  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}
  abrir(): void {
    if (this.excluindo) return;
    this.erro = '';
    this.confirmacaoAberta = true;
  }
  fecharConfirmacaoFinal(evento?: Event): void {
    evento?.preventDefault();
    if (!this.excluindo) this.confirmacaoAberta = false;
  }
  excluirConfirmado(): void {
    if (this.excluindo || !this.confirmacaoAberta) return;
    this.excluindo = true;
    this.erro = '';
    this.http.delete(`http://127.0.0.1:8000/api/${this.tipo}/${this.registro.id}/`).subscribe({
      next: () => { this.excluindo = false; this.confirmacaoAberta = false; this.excluido.emit(); this.cdr.detectChanges(); },
      error: erro => {
        this.excluindo = false;
        this.erro = erro.error?.detail || 'Não foi possível excluir o registro. Tente novamente.';
        this.cdr.detectChanges();
      },
    });
  }
}
