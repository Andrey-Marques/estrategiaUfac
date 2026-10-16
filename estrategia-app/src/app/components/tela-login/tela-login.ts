import { Component, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../service/auth.service';
import { FormsModule } from '@angular/forms';
import { Router } from "@angular/router";
@Component({
  selector: 'app-tela-login',
  imports: [FormsModule, CommonModule],
  templateUrl: './tela-login.html',
  styleUrl: './tela-login.scss',
  standalone: true
})
export class TelaLogin {
  constructor(private authService: AuthService, private router: Router, private cdr: ChangeDetectorRef){}

  recuperacaoAberta = false;
  enviandoRecuperacao = false;
  emailRecuperacao = '';
  mensagemRecuperacao = '';
  erroRecuperacao = '';

  abrirRecuperacao(): void {
    this.emailRecuperacao = '';
    this.mensagemRecuperacao = '';
    this.erroRecuperacao = '';
    this.recuperacaoAberta = true;
    setTimeout(() => document.getElementById('email-recuperacao')?.focus());
  }

  fecharRecuperacao(): void {
    this.recuperacaoAberta = false;
    document.getElementById('esqueci-senha')?.focus();
  }

  @HostListener('document:keydown', ['$event'])
  teclaModal(evento: KeyboardEvent): void {
    if (!this.recuperacaoAberta) return;
    if (evento.key === 'Escape') this.fecharRecuperacao();
    if (evento.key === 'Tab') {
      const campos = Array.from(document.querySelectorAll<HTMLElement>('#modal-recuperacao button:not(:disabled), #modal-recuperacao input:not(:disabled)'));
      const primeiro = campos[0];
      const ultimo = campos[campos.length - 1];
      if (evento.shiftKey && document.activeElement === primeiro) { evento.preventDefault(); ultimo?.focus(); }
      if (!evento.shiftKey && document.activeElement === ultimo) { evento.preventDefault(); primeiro?.focus(); }
    }
  }

  enviarRecuperacao(): void {
    if (this.enviandoRecuperacao) return;
    this.enviandoRecuperacao = true;
    this.erroRecuperacao = '';
    this.mensagemRecuperacao = '';
    this.authService.solicitarRecuperacaoSenha(this.emailRecuperacao.trim()).subscribe({
      next: resposta => {
        this.enviandoRecuperacao = false;
        this.mensagemRecuperacao = resposta.detail;
        this.cdr.detectChanges();
      },
      error: erro => {
        this.enviandoRecuperacao = false;
        this.erroRecuperacao = erro.status === 429
          ? 'Muitas solicitações. Aguarde e tente novamente mais tarde.'
          : erro.status === 400 ? 'Informe um e-mail válido.' : 'Não foi possível solicitar a recuperação. Tente novamente.';
        this.cdr.detectChanges();
      }
    });
  }

  username = '';
  password = '';
  entrando = false;
  erroLogin = '';

  login(){
    if (this.entrando) return;
    this.entrando = true;
    this.erroLogin = '';
    this.authService.login(this.username, this.password).subscribe({

      next: (res) => {
        this.entrando = false;
        localStorage.setItem('access', res.access);
        localStorage.setItem('refresh', res.refresh);

        this.router.navigate(['/home'])
      },

      error: (erro) => {
        this.entrando = false;
        if (erro.status === 429) {
          const segundos = Number(erro.headers?.get('Retry-After') || 900);
          const minutos = Math.max(1, Math.ceil(segundos / 60));
          this.erroLogin = `Limite de tentativas atingido. Tente novamente em ${minutos} minuto(s). Você também pode recuperar sua senha.`;
        } else {
          this.erroLogin = erro.status === 401 ? 'Usuário ou senha inválidos.' : 'Não foi possível entrar. Tente novamente.';
        }
        this.cdr.detectChanges();
      }
    })
  }
}
