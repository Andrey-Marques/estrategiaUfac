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

  obterPapel(): string {
    const papeis: Record<string, string> = {
      ADMIN: 'Administrador',
      UNIDADE: 'Unidade',
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
