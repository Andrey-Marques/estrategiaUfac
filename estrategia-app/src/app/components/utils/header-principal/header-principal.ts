import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { Usuario } from '../../../model/usuario';
import { UsuarioService } from '../../../service/usuario.service';
import { AuthService } from '../../../service/auth.service';

@Component({
  selector: 'app-header-principal',
  imports: [CommonModule],
  templateUrl: './header-principal.html',
  styleUrl: './header-principal.scss',
})
export class HeaderPrincipal {

  private usuarioService = inject(UsuarioService);
  private authService = inject(AuthService);
  private router = inject(Router);

  usuarioAtual = signal<Usuario | null>(null);

  menuUsuarioAberto = signal(false);


  ngOnInit(): void {
    this.buscarUsuarioAtual();
  }


  buscarUsuarioAtual(): void {

    this.usuarioService.getAtual().subscribe({

      next: usuario => {
        this.usuarioAtual.set(usuario);
      },

      error: erro => {
        console.error(
          'Erro ao carregar usuário atual:',
          erro
        );
      }

    });
  }


  alternarMenuUsuario(): void {
    this.menuUsuarioAberto.update(
      aberto => !aberto
    );
  }


  fecharMenuUsuario(): void {
    this.menuUsuarioAberto.set(false);
  }


  logout(): void {

    this.authService.logout();

    this.menuUsuarioAberto.set(false);

    this.router.navigate(['/login']);
  }


  obterNomeUsuario(): string {

    const usuario = this.usuarioAtual();

    if (!usuario) {
      return 'Carregando...';
    }

    return (
      usuario.nome_social?.trim() ||
      usuario.nome_completo ||
      usuario.username
    );
  }


  obterPapelUsuario(): string {

    const papel = this.usuarioAtual()?.papel;

    const papeis: Record<string, string> = {
      ADMIN: 'Administrador',
      SERVIDOR: 'Servidor',
      UNIDADE: 'Unidade',
    };

    return papel
      ? papeis[papel] ?? papel
      : '';
  }


  obterUnidadeUsuario(): string {

    const usuario = this.usuarioAtual();

    if (!usuario) {
      return '';
    }

    return usuario.unidade_sigla || usuario.unidade_nome || 'Sem unidade';
  }
}