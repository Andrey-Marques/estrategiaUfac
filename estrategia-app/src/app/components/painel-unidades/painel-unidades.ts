import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderPublico } from '../utils/header-publico/header-publico';
import { Rodape } from '../utils/rodape/rodape';

@Component({
  selector: 'app-painel-unidades',
  imports: [RouterLink, HeaderPublico, Rodape],
  templateUrl: './painel-unidades.html',
  styleUrl: './painel-unidades.scss',
})
export class PainelUnidades {}
