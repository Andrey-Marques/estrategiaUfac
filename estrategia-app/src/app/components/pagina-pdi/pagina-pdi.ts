import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderPublico } from '../utils/header-publico/header-publico';
import { Rodape } from '../utils/rodape/rodape';

@Component({
  selector: 'app-pagina-pdi',
  imports: [RouterLink, HeaderPublico, Rodape],
  templateUrl: './pagina-pdi.html',
  styleUrl: './pagina-pdi.scss',
})
export class PaginaPdi {}
