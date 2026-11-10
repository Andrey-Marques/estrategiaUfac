import { Component } from '@angular/core';
import { HeaderPublico } from '../utils/header-publico/header-publico';
import { Rodape } from '../utils/rodape/rodape';

@Component({
  selector: 'app-equipe-responsavel',
  imports: [HeaderPublico, Rodape],
  templateUrl: './equipe-responsavel.html',
  styleUrl: './equipe-responsavel.scss',
})
export class EquipeResponsavel {}
