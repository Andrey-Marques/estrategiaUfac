import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BarraLateral } from '../utils/barra-lateral/barra-lateral';
import { HeaderPrincipal } from '../utils/header-principal/header-principal';
import { InfoBar } from '../utils/info-bar/info-bar';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, BarraLateral, HeaderPrincipal, InfoBar],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {

  // Define qual aba começa aberta (1: Projetos, 2: Iniciativas, 3: Indicadores)
  abaAtiva: number = 1; 

  // Dados simulados para testar a lista (comente ou remova se quiser ver a pastinha vazia)
  listaProjetos: any[] = [
    { titulo: 'Reestruturação do Portal Acadêmico', status: 'pendente' },
    { titulo: 'Novo Plano de Metas 2026', status: 'pendente' }
  ]; 

  listaIniciativas: any[] = [];
  listaIndicadores: any[] = [];

  // Função para abrir/fechar o menu lateral


  // Função disparada ao clicar no botão da aba
  mudarAba(numeroDaAba: number): void {
    this.abaAtiva = numeroDaAba;
  }
}