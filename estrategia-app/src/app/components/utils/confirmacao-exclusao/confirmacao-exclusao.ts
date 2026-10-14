import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, Output, ViewChild } from '@angular/core';

@Component({
  selector: 'app-confirmacao-exclusao',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmacao-exclusao.html',
  styleUrl: './confirmacao-exclusao.scss',
})
export class ConfirmacaoExclusao implements OnChanges, AfterViewInit {
  private static sequencia = 0;
  readonly tituloId = `titulo-confirmacao-exclusao-${++ConfirmacaoExclusao.sequencia}`;
  readonly mensagemId = `${this.tituloId}-mensagem`;
  @Input() aberto = false;
  @Input() carregando = false;
  @Input() mensagem = 'Tem certeza que deseja excluir esse registro?';
  @Input() erro = '';
  @Output() confirmado = new EventEmitter<void>();
  @Output() cancelado = new EventEmitter<void>();
  @ViewChild('dialogo') dialogo?: ElementRef<HTMLDialogElement>;

  ngOnChanges(): void { this.sincronizar(); }
  ngAfterViewInit(): void { this.sincronizar(); }
  private sincronizar(): void {
    const dialogo = this.dialogo?.nativeElement;
    if (!dialogo) return;
    if (this.aberto && !dialogo.open) dialogo.showModal();
    if (!this.aberto && dialogo.open) dialogo.close();
  }
  cancelar(evento?: Event): void {
    evento?.preventDefault();
    if (!this.carregando) this.cancelado.emit();
  }
  confirmar(): void {
    if (this.aberto && !this.carregando) this.confirmado.emit();
  }
}
