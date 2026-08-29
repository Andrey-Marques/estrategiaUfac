import { Component, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ProjetoEstrategico } from '../../model/projetoEstrategico';
import { ProjetoService } from '../../service/projeto.service';

@Component({
  selector: 'app-listagem-projetos',
  imports: [CommonModule],
  templateUrl: './listagem-projetos.html',
  styleUrl: './listagem-projetos.scss',
  providers: [DatePipe],
})
export class ListagemProjetos {
  projetos = signal<ProjetoEstrategico[]>([]);
  private datePipe = inject(DatePipe);

  constructor(private projetoService: ProjetoService){}

  ngOnInit(): void {
    this.buscarProjeto();
    
  }

  buscarProjeto(): void{
    this.projetoService.get().subscribe({
      next: (projeto) => {this.projetos.set(projeto)},
      error: (erro)=> {console.error('erro ao buscar projetos',erro)}
    })
  }
}
