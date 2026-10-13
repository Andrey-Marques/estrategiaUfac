import { Component, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Meta } from '@angular/platform-browser';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-redefinir-senha',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './redefinir-senha.html',
  styleUrl: './redefinir-senha.scss',
})
export class RedefinirSenha implements OnDestroy {
  novaSenha = '';
  confirmarSenha = '';
  salvando = false;
  sucesso = '';
  erro = '';
  private referrerAnterior: string | null;
  constructor(private auth: AuthService, private rota: ActivatedRoute, private cdr: ChangeDetectorRef, private meta: Meta) {
    this.referrerAnterior = meta.getTag('name="referrer"')?.content ?? null;
    meta.updateTag({name: 'referrer', content: 'no-referrer'});
  }
  ngOnDestroy(): void {
    if (this.referrerAnterior === null) this.meta.removeTag('name="referrer"');
    else this.meta.updateTag({name: 'referrer', content: this.referrerAnterior});
  }
  salvar(): void {
    if (this.salvando || this.sucesso) return;
    this.erro = '';
    if (this.novaSenha !== this.confirmarSenha) { this.erro = 'As senhas não coincidem.'; return; }
    this.salvando = true;
    this.auth.redefinirSenha({
      uid: this.rota.snapshot.paramMap.get('uid') ?? '',
      token: this.rota.snapshot.paramMap.get('token') ?? '',
      nova_senha: this.novaSenha,
      confirmar_senha: this.confirmarSenha,
    }).subscribe({
      next: resposta => {
        this.salvando = false;
        this.sucesso = resposta.detail;
        this.novaSenha = this.confirmarSenha = '';
        this.auth.logout();
        this.cdr.detectChanges();
      },
      error: erro => {
        this.salvando = false;
        this.erro = erro.status === 429 ? 'Muitas tentativas. Aguarde e tente novamente mais tarde.'
          : erro.status === 400 ? Object.values(erro.error ?? {}).flatMap(v => Array.isArray(v) ? v : [String(v)]).join(' ')
          : 'Não foi possível redefinir a senha. Tente novamente.';
        this.cdr.detectChanges();
      }
    });
  }
}
