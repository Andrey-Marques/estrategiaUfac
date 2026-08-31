import { Component, OnInit } from '@angular/core';
import { UsuarioService } from '../../service/usuario.service';
import { Usuario } from '../../model/usuario';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-perfil-usuario',
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil-usuario.html',
  styleUrl: './perfil-usuario.scss',
})
export class PerfilUsuario implements OnInit {

  usuario?:Usuario;
  carregando = true;
  modoEdicaoDados = false;
  modoEdicaoAcesso = false;

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    this.usuarioService.buscarMeuPerfil().subscribe({
        next: (dados) => {
            console.log('USUÁRIO RECEBIDO:', dados);
            this.usuario = dados;
            this.carregando = false;
        },

        error: (erro) => {
            console.error('Erro ao buscar perfil:', erro);
            this.carregando = false;
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
