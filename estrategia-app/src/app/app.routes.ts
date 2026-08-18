import { Routes } from '@angular/router';
import { TelaCadastro } from './components/tela-cadastro/tela-cadastro';
import { Home } from './components/home/home';


export const routes: Routes = [
    {path: "tela-cadastro", component: TelaCadastro},
    {path:"home-servidor", component: Home}
];
