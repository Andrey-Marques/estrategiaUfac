import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Home } from './components/home/home';
import { BarraLateral } from './components/utils/barra-lateral/barra-lateral';
import { HeaderPrincipal } from './components/utils/header-principal/header-principal';
import { InfoBar } from './components/utils/info-bar/info-bar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Home, BarraLateral, HeaderPrincipal, InfoBar],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('estrategia-app');
}
