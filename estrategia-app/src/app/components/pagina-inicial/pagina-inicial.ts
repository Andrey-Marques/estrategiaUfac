import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderPublico } from '../utils/header-publico/header-publico';
import { Rodape } from '../utils/rodape/rodape';

@Component({
  selector: 'app-pagina-inicial',
  imports: [RouterLink, HeaderPublico, Rodape],
  templateUrl: './pagina-inicial.html',
  styleUrl: './pagina-inicial.scss',
})
export class PaginaInicial {}
