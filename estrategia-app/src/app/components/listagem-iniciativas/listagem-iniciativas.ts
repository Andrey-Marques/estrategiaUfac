import { Component } from '@angular/core';
import { InfoBar } from '../utils/info-bar/info-bar';
import { BarraLateral } from '../utils/barra-lateral/barra-lateral';

@Component({
  selector: 'app-listagem-iniciativas',
  imports: [InfoBar, BarraLateral],
  templateUrl: './listagem-iniciativas.html',
  styleUrl: './listagem-iniciativas.scss',
})
export class ListagemIniciativas {
  
}
