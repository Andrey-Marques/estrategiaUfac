import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderPublico } from '../utils/header-publico/header-publico';
import { Rodape } from '../utils/rodape/rodape';

@Component({
  selector: 'app-visualizacao-publica',
  imports: [HeaderPublico, RouterLink, CommonModule, Rodape],
  templateUrl: './visualizacao-publica.html',
  styleUrl: './visualizacao-publica.scss',
})
export class VisualizacaoPublica {}
