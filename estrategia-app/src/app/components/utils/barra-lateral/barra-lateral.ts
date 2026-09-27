import { CommonModule } from '@angular/common';
import { Component, HostBinding, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UsuarioService } from '../../../service/usuario.service';

@Component({
  selector: 'app-barra-lateral',
  imports: [RouterLink, RouterLinkActive,  CommonModule],
  templateUrl: './barra-lateral.html',
  styleUrl: './barra-lateral.scss',
})
export class BarraLateral implements OnInit {

  menuExpandido = false;

  papelUsuario = signal<string | null>(null);

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    this.usuarioService.getAtual().subscribe({
      next: usuario => this.papelUsuario.set(usuario.papel),
      error: () => this.papelUsuario.set(null),
    });
  }

  get podeGerenciarUsuarios(): boolean {
    return this.papelUsuario() === 'ADMIN' || this.papelUsuario() === 'GESTOR';
  }

  @HostBinding('class.menu-expandido')
  get classeMenuExpandido(): boolean {
    return this.menuExpandido;
  }

  alternarMenu(): void {
    this.menuExpandido = !this.menuExpandido;
  }
}
