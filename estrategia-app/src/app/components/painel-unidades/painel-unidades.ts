import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderPublico } from '../utils/header-publico/header-publico';
import { Rodape } from '../utils/rodape/rodape';
import { UnidadeService } from '../../service/unidade.service';
import { Unidade } from '../../model/unidade';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-painel-unidades',
  imports: [RouterLink, HeaderPublico, Rodape, CommonModule],
  templateUrl: './painel-unidades.html',
  styleUrl: './painel-unidades.scss',
})
export class PainelUnidades {

  unidades = signal<Unidade[]>([]);

  constructor(private unidadeService: UnidadeService){}
  ngOnInit(): void {
    this.buscarUnidade()

  }

  buscarUnidade(): void{
    this.unidadeService.getPublicas().subscribe({
      next: (dados) => this.unidades.set(dados),
      error: (erro) => {console.log("erro ao buscar unidade", erro)}
    })
  }
}
