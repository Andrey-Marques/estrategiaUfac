import { Router } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Usuario } from '../../model/usuario';
import { UsuarioService } from '../../service/usuario.service';

@Component({
  selector: 'app-perfil-usuario',
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil-usuario.html',
  styleUrl: './perfil-usuario.scss'
})
export class PerfilUsuario implements OnInit {

  usuario = {} as Usuario;
  copia = {} as Usuario;
  modoEdicaoDados = false;

  constructor(
    private usuarioService: UsuarioService,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.usuarioService.buscarMeuPerfil().subscribe({
      next: usuario => {
        this.usuario = usuario;
        this.cdr.detectChanges();
      },
      error: erro => {
        console.error('Erro ao buscar perfil:', erro);
      }
    });
  }

  modalSenhaAberto = false;
  salvandoSenha = false;
  errosSenha: Record<string, string[]> = {};
  senhaFormulario = { senha_atual: '', nova_senha: '', confirmar_senha: '' };

  abrirModalSenha(): void {
    this.errosSenha = {};
    this.senhaFormulario = { senha_atual: '', nova_senha: '', confirmar_senha: '' };
    this.modalSenhaAberto = true;
    setTimeout(() => document.getElementById('senhaAtual')?.focus());
  }

  fecharModalSenha(): void {
    if (this.salvandoSenha) return;
    this.modalSenhaAberto = false;
    this.senhaFormulario = { senha_atual: '', nova_senha: '', confirmar_senha: '' };
    this.errosSenha = {};
    document.getElementById('botaoAlterarSenha')?.focus();
  }

  manterFocoModal(evento: KeyboardEvent): void {
    if (evento.key !== 'Tab') return;
    const modal = evento.currentTarget as HTMLElement;
    const campos = Array.from(modal.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)'));
    const primeiro = campos[0];
    const ultimo = campos[campos.length - 1];
    if (evento.shiftKey && document.activeElement === primeiro) {
      evento.preventDefault(); ultimo?.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault(); primeiro?.focus();
    }
  }

  alterarSenha(): void {
    if (this.salvandoSenha) return;
    this.errosSenha = {};
    if (this.senhaFormulario.nova_senha !== this.senhaFormulario.confirmar_senha) {
      this.errosSenha['confirmar_senha'] = ['As novas senhas não coincidem.'];
      return;
    }
    this.salvandoSenha = true;
    this.usuarioService.alterarSenha(this.senhaFormulario).subscribe({
      next: resposta => {
        this.salvandoSenha = false;
        this.fecharModalSenha();
        this.authService.logout();
        window.alert(resposta.detail);
        this.router.navigate(['/login']);
      },
      error: erro => {
        this.salvandoSenha = false;
        if (erro.status === 400 && erro.error && typeof erro.error === 'object') {
          for (const [campo, mensagens] of Object.entries(erro.error)) {
            this.errosSenha[campo] = Array.isArray(mensagens) ? mensagens : [String(mensagens)];
          }
        } else {
          this.errosSenha['detail'] = [erro.status === 429
            ? 'Muitas tentativas. Aguarde um minuto e tente novamente.'
            : 'Não foi possível alterar a senha. Tente novamente.'];
        }
        this.cdr.detectChanges();
      }
    });
  }

  obterPapel(): string {
    const papeis: Record<string, string> = {
      ADMIN: 'Administrador',
      GESTOR: 'Gestor',
      SERVIDOR: 'Servidor'
    };

    return papeis[this.usuario.papel] ?? '';
  }

  editarDados(): void {
    this.copia = { ...this.usuario };
    this.modoEdicaoDados = true;
  }

  cancelarDados(): void {
    this.usuario = { ...this.copia };
    this.modoEdicaoDados = false;
  }

  salvarDados(): void {
    const { nome_social, cpf, email } = this.usuario;

    this.usuarioService.salvarMeuPerfil({
      nome_social,
      cpf,
      email
    }).subscribe({
      next: usuario => {
        this.usuario = {
          ...this.usuario,
          ...usuario
        };

        this.modoEdicaoDados = false;
        this.cdr.detectChanges();
      },
      error: erro => {
        console.error('Erro ao salvar:', erro);
      }
    });
  }
}
