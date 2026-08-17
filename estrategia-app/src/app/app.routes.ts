import { Routes } from '@angular/router';
import { FormularioIniciativas } from './components/formularios/formulario-iniciativas/formulario-iniciativas';
import { ListagemIniciativas } from './components/listagem-iniciativas/listagem-iniciativas';

export const routes: Routes = [
  {
    path: 'formulario-iniciativas',
    component: FormularioIniciativas
  },
  {
    path: 'listagem-iniciativas',
    component: ListagemIniciativas
  }
];
