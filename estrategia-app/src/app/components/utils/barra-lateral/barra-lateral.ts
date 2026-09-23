import { CommonModule } from '@angular/common';
import { Component, HostBinding, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-barra-lateral',
  imports: [RouterLink, RouterLinkActive,  CommonModule],
  templateUrl: './barra-lateral.html',
  styleUrl: './barra-lateral.scss',
})
export class BarraLateral {

  menuExpandido = false;

    // INTEGRAR para substituir por valor vindo do serviço de autenticação
  @Input() papelUsuario: string = 'ADMIN';

  get ehAdministrador(): boolean {
    return this.papelUsuario === 'ADMIN';
  }

  @HostBinding('class.menu-expandido')
  get classeMenuExpandido(): boolean {
    return this.menuExpandido;
  }

  alternarMenu(): void {
    this.menuExpandido = !this.menuExpandido;
  }
}
