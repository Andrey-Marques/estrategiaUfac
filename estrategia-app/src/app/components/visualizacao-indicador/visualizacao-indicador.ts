import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderPublico } from '../utils/header-publico/header-publico';
import { Rodape } from '../utils/rodape/rodape';

@Component({
  selector: 'app-visualizacao-indicador',
  imports: [RouterLink, CommonModule, HeaderPublico, Rodape],
  templateUrl: './visualizacao-indicador.html',
  styleUrl: './visualizacao-indicador.scss',
})
export class VisualizacaoIndicador {}
