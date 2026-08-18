import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BarraLateral } from '../barra-lateral/barra-lateral';
import { HeaderPrincipal } from '../header-principal/header-principal';
import { InfoBar } from '../info-bar/info-bar';

@Component({
  selector: 'app-tela-cadastro',
  imports: [CommonModule, BarraLateral, HeaderPrincipal, InfoBar],
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
    
}
