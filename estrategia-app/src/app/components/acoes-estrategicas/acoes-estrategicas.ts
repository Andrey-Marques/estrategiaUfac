import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { HeaderPublico } from '../utils/header-publico/header-publico';

@Component({
  selector: 'app-acoes-estrategicas',
  imports: [CommonModule, HeaderPublico],
  templateUrl: './acoes-estrategicas.html',
  styleUrl: './acoes-estrategicas.scss',
})
export class AcoesEstrategicas {}
