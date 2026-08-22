import { Routes } from '@angular/router';
import { FormularioIniciativas } from './components/formularios/formulario-iniciativas/formulario-iniciativas';
import { ListagemIniciativas } from './components/listagem-iniciativas/listagem-iniciativas';
import { Home } from './components/home/home';
import { TelaCadastro } from './components/tela-cadastro/tela-cadastro';


export const routes: Routes = [
  {
    path: 'home',
    component: Home
  },
  {
    path: 'formulario-iniciativas',
    component: FormularioIniciativas
  },
  {
    path: 'listagem-iniciativas',
    component: ListagemIniciativas
  },
  {path: "tela-cadastro", component: TelaCadastro},
  {path:"home-servidor", component: Home}
];
