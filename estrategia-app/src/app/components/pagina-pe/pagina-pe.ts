import { Breadcrumb } from '../utils/breadcrumb/breadcrumb';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { HeaderPublico } from '../utils/header-publico/header-publico';
import { Rodape } from '../utils/rodape/rodape';

@Component({
  selector: 'app-pagina-pe',
  imports: [Breadcrumb, CommonModule, HeaderPublico, Rodape],
  templateUrl: './pagina-pe.html',
  styleUrl: './pagina-pe.scss',
})
export class PaginaPe {
  opcaoSelecionada = 'apresentacao'

  titulos: any = {
    apresentacao: 'O Planejamento Estratégico da Ufac',
    etapas: 'Etapas de Elaboração',
    planejamento: 'Planejamento e Gestão Estratégica 2024-2033',
    planos: 'Planos Anteriores',
    documentos: 'Documentos',
    indicadores: 'Indicadores Estratégicos'
  };

  selecionarOpcao(opcao:string){
    this.opcaoSelecionada = opcao;
  }
}
