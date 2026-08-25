import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BarraLateral } from '../utils/barra-lateral/barra-lateral';
import { InfoBar } from '../utils/info-bar/info-bar';

@Component({
  selector: 'app-tela-cadastro',
  imports: [CommonModule, BarraLateral, InfoBar],
  templateUrl: './tela-cadastro.html',
  styleUrl: './tela-cadastro.scss',
})
export class TelaCadastro {

  unidades_selecionadas: string[] = [];

  filtrarUnidade(unidade: string): void {
     if (this.unidades_selecionadas.includes(unidade)){
        this.unidades_selecionadas =
        this.unidades_selecionadas.filter(
          unidade_Selecionada => unidade_Selecionada !== unidade);
     }else{
        this.unidades_selecionadas.push(unidade)

     }

    }

    filtroAberto = false;
    alternarFiltro(): void{
      this.filtroAberto = !this.filtroAberto;
    }

}
