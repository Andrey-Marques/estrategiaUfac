import { Breadcrumb } from '../utils/breadcrumb/breadcrumb';
import { Component } from '@angular/core';
import { HeaderPublico } from '../utils/header-publico/header-publico';
import { Rodape } from '../utils/rodape/rodape';

@Component({
  selector: 'app-pagina-pdi',
  imports: [Breadcrumb, HeaderPublico, Rodape],
  templateUrl: './pagina-pdi.html',
  styleUrl: './pagina-pdi.scss',
})
export class PaginaPdi {}
