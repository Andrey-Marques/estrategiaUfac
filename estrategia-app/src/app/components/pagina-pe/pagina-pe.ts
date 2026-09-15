import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderPublico } from '../utils/header-publico/header-publico';
import { Rodape } from '../utils/rodape/rodape';

@Component({
  selector: 'app-pagina-pe',
  imports: [RouterLink, CommonModule, HeaderPublico, Rodape],
  templateUrl: './pagina-pe.html',
  styleUrl: './pagina-pe.scss',
})
export class PaginaPe {
  opcaoSelecionada = 'apresentacao'

  titulos: any = {
    apresentacao: 'O Planejamento Estratégico da Ufac',
    etapas: 'Etapas de Elaboração',
    projetos: 'Projetos Estratégicos',
    planejamento: 'Planejamento e Gestão Estratégica 2024-2033',
    planos: 'Planos Anteriores',
    documentos: 'Documentos',
    indicadores: 'Indicadores Estratégicos'
  };

  selecionarOpcao(opcao:string){
    this.opcaoSelecionada = opcao;
  }
}
