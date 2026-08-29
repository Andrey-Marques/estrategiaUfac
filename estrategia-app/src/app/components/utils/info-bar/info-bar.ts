import { Component, signal } from '@angular/core';
import { DashBoardService } from '../../../service/dash-board.service';
import { UsuarioService } from '../../../service/usuario.service';
import { UnidadeService } from '../../../service/unidade.service';
import { Unidade } from '../../../model/unidade';

@Component({
  selector: 'app-info-bar',
  imports: [],
  templateUrl: './info-bar.html',
  styleUrl: './info-bar.scss',
})
export class InfoBar {
  resumo = signal({ iniciativas: 0, projetos: 0, indicadores: 0 });
  unidade = signal<Unidade | null>(null);

  constructor(
    private dashboardService: DashBoardService,
    private usuarioService: UsuarioService,
    private unidadeService: UnidadeService
  ){}

  ngOnInit(): void {
    this.usuarioService.getAtual().subscribe({
      next: (usuario) => {
        this.unidadeService.get().subscribe({
          next: (unidades) => {
            const unidadeId = typeof usuario.unidade === 'number'
              ? usuario.unidade
              : usuario.unidade?.id;
            this.unidade.set(unidades.find(item => item.id === unidadeId) ?? null);
          },
          error: (erro) => console.error('erro ao buscar unidades', erro)
        });
      },
      error: (erro) => console.error('erro ao buscar usuario atual', erro)
    });

    this.dashboardService.getResumoUnidade().subscribe({
      next: (dados)=>{
        this.resumo.set(dados);
      },
      error: (erro) => {
        console.error('erro ao buscar resumo da unidade', erro);
      }
    })
  }
}
