import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Home } from './components/home/home';
import { BarraLateral } from './components/utils/barra-lateral/barra-lateral';
import { HeaderPrincipal } from './components/utils/header-principal/header-principal';
import { InfoBar } from './components/utils/info-bar/info-bar';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, Home, BarraLateral, HeaderPrincipal, InfoBar],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  mostrarLayout = true;
  protected readonly title = signal('estrategia-app');

  constructor(private router: Router){
    this.router.events.subscribe(event => {
      if(event instanceof NavigationEnd){
        const rota = event.urlAfterRedirects;
        const rotasSemLayout = ['/login',]

        this.mostrarLayout = !rotasSemLayout.some(r => rota.startsWith(r))
      }
    })
  }
}
