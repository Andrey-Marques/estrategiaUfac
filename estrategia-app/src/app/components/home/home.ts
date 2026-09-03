import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BarraLateral } from '../utils/barra-lateral/barra-lateral';
import { HeaderPrincipal } from '../utils/header-principal/header-principal';
import { InfoBar } from '../utils/info-bar/info-bar';
import { ProjetoEstrategico } from '../../model/projetoEstrategico';
import { ProjetoService } from '../../service/projeto.service';
import { UsuarioService } from '../../service/usuario.service';
import {AvaliacaoProjeto,DecisaoProjeto} from '../avaliacao-projeto/avaliacao-projeto';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, BarraLateral, HeaderPrincipal, InfoBar, AvaliacaoProjeto],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  listaProjetos = signal<ProjetoEstrategico[]>([]);
  isAdmin = signal(false);
  projetoEmAnalise:
    (ProjetoEstrategico & {
      responsavel_nome?: string;
      unidade_sigla?: string;
    }) | null = null;


  abaAtiva: number = 1;

  listaIniciativas: any[] = [];
  listaIndicadores: any[] = [];


  constructor(private projetoService: ProjetoService, private usuarioService: UsuarioService) {}


  ngOnInit(): void {
    this.buscarProjetosEmEspera();
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
          this.projetoEmAnalise =
            projetoDetalhado;
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
    this.projetoEmAnalise = null;
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

          this.projetoEmAnalise = null;

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

          this.projetoEmAnalise = null;

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

  buscarUsuarioAtual(): void{
    this.usuarioService.getAtual().subscribe({
      next: (usuario) => {
        this.isAdmin.set(usuario.papel === 'ADMIN');
      },
      error: (erro) => {
        console.error('Erro ao buscar usuário atual:' ,erro)
      }
    })
  }
}
