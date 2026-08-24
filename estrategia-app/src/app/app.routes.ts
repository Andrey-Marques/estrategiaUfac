import { Routes } from '@angular/router';
import { FormularioIniciativas } from './components/formularios/formulario-iniciativas/formulario-iniciativas';
import { ListagemIniciativas } from './components/listagem-iniciativas/listagem-iniciativas';
import { Home } from './components/home/home';
import { TelaLogin } from './components/tela-login/tela-login';

export const routes: Routes = [
  {
    path: 'home',
    component: Home
  },
  {
    path: 'listagem-iniciativas',
    component: ListagemIniciativas
  },
  {
    path: 'login',
    component: TelaLogin
  }
];
