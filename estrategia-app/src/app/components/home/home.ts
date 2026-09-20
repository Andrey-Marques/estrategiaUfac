import { Component, Signal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjetoEstrategico } from '../../model/projetoEstrategico';
import { ProjetoService } from '../../service/projeto.service';
import { UsuarioService } from '../../service/usuario.service';
import {AvaliacaoProjeto,DecisaoProjeto} from '../avaliacao-projeto/avaliacao-projeto';
import { IniciativaEstrategica } from '../../model/iniciativaEstrategica';
import { IniciativaService } from '../../service/iniciativa.service';
import {AvaliacaoIniciativa, DecisaoIniciativa} from '../avaliacao-iniciativa/avaliacao-iniciativa';
import { IndicadorEstrategico } from '../../model/indicadorEstrategico';
import { IndicadorService } from '../../service/indicador.service';
import { AvaliacaoIndicador, DecisaoIndicador } from '../avaliacao-indicador/avaliacao-indicador';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, AvaliacaoProjeto, AvaliacaoIniciativa, AvaliacaoIndicador],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  listaProjetos = signal<ProjetoEstrategico[]>([]);
  isAdmin = signal(false);
  projetoEmAnalise = signal<
  (ProjetoEstrategico & {responsavel_nome?: string;unidade_sigla?: string;}) | null>(null);


  abaAtiva: number = 1;
  usuarioAtual = signal<any | null>(null);
  listaIniciativas = signal<IniciativaEstrategica[]>([]);
  iniciativaEmAnalise = signal<IniciativaEstrategica | null>(null);
  listaIndicadores: any[] = [];


  indicadorService: IndicadorService;

  constructor(
    private projetoService: ProjetoService,
    private iniciativaService: IniciativaService,
    private usuarioService: UsuarioService,
    indicadorService: IndicadorService
  ) {
    this.indicadorService = indicadorService;
  }


  ngOnInit(): void {
    this.buscarProjetosEmEspera();
    this.buscarIniciativasEmEspera();
    this.buscarIndicadoresEmEspera();
    this.buscarUsuarioAtual();
  }

  // Função disparada ao clicar no botão da aba
  mudarAba(numeroDaAba: number): void {
    this.abaAtiva = numeroDaAba;
  }

  buscarProjetosEmEspera(): void {

    this.projetoService.get().subscribe({
      next: projetos => {

        const pendentes = projetos.filter(
          projeto => projeto.status === 'EM_ESPERA'
        );

        this.listaProjetos.set(pendentes);
      },

      error: erro => {
        console.error(
          'Erro ao buscar projetos em espera:',
          erro
        );
      }
    });
  }
  abrirAvaliacao(projeto: ProjetoEstrategico): void {
    this.projetoService
      .getById(projeto.id)
      .subscribe({
        next: projetoDetalhado => {

          this.projetoEmAnalise.set(
            projetoDetalhado
          );

        },

        error: erro => {
          console.error(
            'Erro ao carregar projeto:',
            erro
          );
        }
      });
  }

  fecharAvaliacao(): void {
    this.projetoEmAnalise.set(null);
  }
  aprovarProjeto(
    decisao: DecisaoProjeto
  ): void {

    this.projetoService
      .aprovarProjeto(
        decisao.projeto.id,
        decisao.observacao
      )
      .subscribe({

        next: () => {

          this.projetoEmAnalise.set(null);

          this.buscarProjetosEmEspera();
        },

        error: erro => {

          console.error(
            'Erro ao aprovar projeto:',
            erro
          );

          window.alert(
            erro.error?.detail ??
            'Não foi possível aprovar o projeto.'
          );
        }

      });
  }

  rejeitarProjeto(
    decisao: DecisaoProjeto
  ): void {

    this.projetoService
      .rejeitarProjeto(
        decisao.projeto.id,
        decisao.observacao
      )
      .subscribe({

        next: () => {

          this.projetoEmAnalise.set(null);

          this.buscarProjetosEmEspera();
        },

        error: erro => {

          console.error(
            'Erro ao rejeitar projeto:',
            erro
          );

          window.alert(
            erro.error?.detail ??
            erro.error?.observacao ??
            'Não foi possível rejeitar o projeto.'
          );
        }

      });
  }

  buscarIniciativasEmEspera(): void {

    this.iniciativaService.get().subscribe({
      next: iniciativas => {
        const pendentes = iniciativas.filter(iniciativa => iniciativa.status === 'EM_ESPERA');
        this.listaIniciativas.set(pendentes);
      },
      error: erro => {
        console.error('Erro ao buscar iniciativas em espera:',erro);
      }

    });
  }

  buscarUsuarioAtual(): void {
    this.usuarioService.getAtual().subscribe({
      next: (usuario) => {

        this.usuarioAtual.set(usuario);
        this.isAdmin.set(usuario.papel === 'ADMIN');
      },

      error: (erro) => {
        console.error('Erro ao buscar usuário atual:', erro);
      }
    });
  }
  formatarPapel(papel: string): string {

  switch (papel) {

    case 'ADMIN':
      return 'ADMINISTRADOR';

    case 'SERVIDOR':
      return 'SERVIDOR';

    default:
      return papel;
  }

}

  abrirAvaliacaoIniciativa(iniciativa: IniciativaEstrategica): void {
    this.iniciativaService.getById(iniciativa.id).subscribe({
        next: iniciativaDetalhada => {
          this.iniciativaEmAnalise.set(iniciativaDetalhada);
        },
        error: erro => {
          console.error('Erro ao carregar iniciativa:', erro);
        }
      });
  }
  fecharAvaliacaoIniciativa(): void {
    this.iniciativaEmAnalise.set(
      null
    );
  }

  aprovarIniciativa(decisao: DecisaoIniciativa): void {
    this.iniciativaService
      .aprovar(decisao.iniciativa.id,decisao.observacao)
      .subscribe({
        next: () => {
          this.iniciativaEmAnalise.set(null);
          this.buscarIniciativasEmEspera();
        },
        error: erro => {
          console.error('Erro ao aprovar iniciativa:', erro);
          window.alert(erro.error?.detail ?? 'Não foi possível aprovar a iniciativa.');
        }
      });
  }

  rejeitarIniciativa(decisao: DecisaoIniciativa): void {
    this.iniciativaService.rejeitar(decisao.iniciativa.id, decisao.observacao)
      .subscribe({
        next: () => {
          this.iniciativaEmAnalise.set(null);
          this.buscarIniciativasEmEspera();
        },
        error: erro => {
          console.error('Erro ao rejeitar iniciativa:', erro);
          window.alert(erro.error?.detail ?? erro.error?.observacao ?? 'Não foi possível rejeitar a iniciativa.');
        }
      });
  }

  buscarIndicadoresEmEspera(): void {
    this.indicadorService.get().subscribe({
      next: indicadores => {
        this.listaIndicadores = indicadores.filter(indicador => indicador.status === 'EM_ESPERA');
      },
      error: erro => console.error('Erro ao buscar indicadores em espera:', erro),
    });
  }

  indicadorEmAnalise: IndicadorEstrategico | null = null;

  abrirAvaliacaoIndicador(indicador: IndicadorEstrategico): void {
    this.indicadorService.getById(indicador.id).subscribe({
      next: indicadorDetalhado => this.indicadorEmAnalise = indicadorDetalhado,
      error: erro => console.error('Erro ao carregar indicador:', erro),
    });
  }

  fecharAvaliacaoIndicador(): void {
    this.indicadorEmAnalise = null;
  }

  avaliarIndicador(decisao: DecisaoIndicador, status: 'APROVADO' | 'REJEITADO'): void {
    this.indicadorService.atualizarIndicador(decisao.indicador.id, {
      status,
      observacao_analise: decisao.observacao,
    }).subscribe({
      next: () => {
        this.indicadorEmAnalise = null;
        this.buscarIndicadoresEmEspera();
      },
      error: erro => {
        console.error(`Erro ao ${status === 'APROVADO' ? 'aprovar' : 'rejeitar'} indicador:`, erro);
        window.alert(erro.error?.detail ?? 'Não foi possível atualizar o indicador.');
      },
    });
  }

  aprovarIndicador(decisao: DecisaoIndicador): void {
    this.avaliarIndicador(decisao, 'APROVADO');
  }

  rejeitarIndicador(decisao: DecisaoIndicador): void {
    this.avaliarIndicador(decisao, 'REJEITADO');
  }
}
