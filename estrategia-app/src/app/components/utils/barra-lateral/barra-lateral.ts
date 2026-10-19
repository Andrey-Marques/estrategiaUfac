import { CommonModule } from '@angular/common';
import { Component, DestroyRef, HostBinding, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { merge, timer, filter } from 'rxjs';
import { NavigationEnd, Router } from '@angular/router';
import { AtrasosService } from '../../../service/atrasos.service';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UsuarioService } from '../../../service/usuario.service';

@Component({
  selector: 'app-barra-lateral',
  imports: [RouterLink, RouterLinkActive,  CommonModule],
  templateUrl: './barra-lateral.html',
  styleUrl: './barra-lateral.scss',
})
export class BarraLateral implements OnInit {
  atrasos = inject(AtrasosService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  menuExpandido = false;

  papelUsuario = signal<string | null>(null);

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    merge(timer(0, 60000), this.router.events.pipe(filter(evento => evento instanceof NavigationEnd))).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.atrasos.atualizar());
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
