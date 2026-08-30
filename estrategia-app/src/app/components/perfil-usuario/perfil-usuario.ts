import { Component, OnInit } from '@angular/core';
import { UsuarioService } from '../../service/usuario.service';
import { Usuario } from '../../model/usuario';

@Component({
  selector: 'app-perfil-usuario',
  imports: [],
  templateUrl: './perfil-usuario.html',
  styleUrl: './perfil-usuario.scss',
})
export class PerfilUsuario {

  usuario!:Usuario;
  modoEdicaoDados = false;
  modoEdicaoAcesso = false;

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    this.usuarioService.buscarMeuPerfil().subscribe({
        next: (dados) => {
            console.log('USUÁRIO RECEBIDO:', dados);
            this.usuario = dados;
        },

        error: (erro) => {
            console.error('Erro ao buscar perfil:', erro);
        }
});


  }

  editarDados(): void {
    this.modoEdicaoDados = true;

  }

  cancelarDados(): void {
    this.modoEdicaoDados = false; // 

  }

  salvarDados(): void {

  }

  editarAcesso(): void { this.modoEdicaoAcesso = true; }
  cancelarAcesso(): void { this.modoEdicaoAcesso = false; }
  salvarAcesso(): void { this.modoEdicaoAcesso = false; }
}
