import { Routes } from '@angular/router';
import { FormularioIniciativas } from './components/formularios/formulario-iniciativas/formulario-iniciativas';
import { ListagemIniciativas } from './components/listagem-iniciativas/listagem-iniciativas';
import { Home } from './components/home/home';
import { TelaLogin } from './components/tela-login/tela-login';
import { TelaCadastro } from './components/tela-cadastro/tela-cadastro';
import { ListagemProjetos } from './components/listagem-projetos/listagem-projetos';
import { ListagemIndicadores } from './components/listagem-indicadores/listagem-indicadores';
import { authGuard } from './guards/auth.guard';
import { PerfilUsuario } from './components/perfil-usuario/perfil-usuario';

export const routes: Routes = [
  {
    path: 'login',
    component: TelaLogin
  },
  //paginas/urls/rotas que precisam de login para ser acessadas 
  {
    path: '',
    canActivate: [authGuard],
    children:[
      {
        path: 'home',
        component: Home
      },
      {
        path: 'listagem-iniciativas',
        component: ListagemIniciativas
      },
      {
        path: "tela-cadastro", 
        component: TelaCadastro
      },
      {
        path:"listagem-projetos", 
        component: ListagemProjetos},
      {
        path:"listagem-indicadores", 
        component:ListagemIndicadores
      },
      {
        path:"perfil-usuario", component: PerfilUsuario
      },
    ]
  }
];
