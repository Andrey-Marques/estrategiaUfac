import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderPublico } from '../utils/header-publico/header-publico';
import { Rodape } from '../utils/rodape/rodape';

@Component({
  selector: 'app-visualizacao-iniciativa',
  imports: [CommonModule, RouterLink, Rodape, HeaderPublico],
  templateUrl: './visualizacao-iniciativa.html',
  styleUrl: './visualizacao-iniciativa.scss',
})
export class VisualizacaoIniciativa {}
