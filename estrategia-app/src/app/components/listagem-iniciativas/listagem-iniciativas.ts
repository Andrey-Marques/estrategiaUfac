import { Paginacao } from '../utils/paginacao/paginacao';
import { AtrasosService } from '../../service/atrasos.service';
import { AvisoAtrasos } from '../utils/aviso-atrasos/aviso-atrasos';
import { Component, computed, inject, signal } from '@angular/core';
import { IniciativaEstrategica } from '../../model/iniciativaEstrategica';
import { IniciativaService } from '../../service/iniciativa.service';
import { CommonModule } from '@angular/common';
import { UsuarioService } from '../../service/usuario.service';
import { Usuario } from '../../model/usuario';
import { UnidadeService } from '../../service/unidade.service';
import { Unidade } from '../../model/unidade';
import {
  AvaliacaoIniciativa,
  DecisaoIniciativa,
} from '../avaliacao-iniciativa/avaliacao-iniciativa';
import { RevisaoEdicao } from '../../model/revisaoEdicao';
import { RevisaoService } from '../../service/revisao.service';
import { FormularioIniciativas } from '../formularios/formulario-iniciativas/formulario-iniciativas';

export interface AcaoIniciativa {
  id?: number;
  descricaoAcao: string;
  prazoInicio: string;
  prazoFim: string;
  custoEstimado: number | string;
  custoRealizado: number | string;
  inicioEfetivo: string;
  fimEfetivo: string;
  statusAtual: string;
}
@Component({
  selector: 'app-listagem-iniciativas',
  imports: [Paginacao, CommonModule, AvaliacaoIniciativa, FormularioIniciativas, AvisoAtrasos],
  templateUrl: './listagem-iniciativas.html',
  styleUrl: './listagem-iniciativas.scss',
})
export class ListagemIniciativas {
  constructor(
    private iniciativaService: IniciativaService,
    private usuarioService: UsuarioService,
    private unidadeService: UnidadeService,
    private revisaoService: RevisaoService,
  ) {}
  atrasos = inject(AtrasosService);

  obterPercentual(iniciativa: IniciativaEstrategica): number {
    const percentual = Number(iniciativa.percentual_evolucao) || 0;
    return Math.min(Math.max(percentual, 0), 100);
  }

  iniciativas = signal<IniciativaEstrategica[]>([]);

  isAdmin = signal(false);

  usuarioAtual = signal<Usuario | null>(null);

  unidades = signal<Unidade[]>([]);

  iniciativaEmAnalise = signal<IniciativaEstrategica | null>(null);

  revisoes = signal<RevisaoEdicao[]>([]);

  revisaoEmAnalise = signal<RevisaoEdicao | null>(null);

  filtroStatus = signal<string>('TODOS');

  termoPesquisa = signal<string>('');

  unidadesSelecionadas = signal<number[]>([]);

  menuUnidadesAberto = signal(false);

  paginaSelecionada = signal(1);
  itensPorPagina = signal(10);
  paginaAtual = computed(() =>
    Math.min(
      this.paginaSelecionada(),
      Math.max(1, Math.ceil(this.iniciativasFiltradas().length / this.itensPorPagina())),
    ),
  );
  iniciativasPaginadas = computed(() => {
    const inicio = (this.paginaAtual() - 1) * this.itensPorPagina();
    return this.iniciativasFiltradas().slice(inicio, inicio + this.itensPorPagina());
  });

  alterarItensPorPagina(quantidade: number): void {
    this.itensPorPagina.set(quantidade);
    this.paginaSelecionada.set(1);
  }

  ngOnInit(): void {
    this.buscarIniciativa();
    this.buscarUsuarioAtual();
    this.buscarUnidade();
  }

  buscarUsuarioAtual(): void {
    this.usuarioService.getAtual().subscribe({
      next: (usuario) => {
        this.usuarioAtual.set(usuario);
        this.isAdmin.set(usuario.papel === 'ADMIN');
        this.buscarRevisoes();
      },
      error: (erro) => console.error('Erro ao buscar usuário atual:', erro),
    });
  }

  buscarIniciativa(): void {
    this.iniciativaService.get().subscribe({
      next: (iniciativa) => {
        this.iniciativas.set(iniciativa);
        this.atrasos.atualizar();
        console.log(iniciativa);
      },
      error: (erro) => {
        console.error('erro ao buscar iniciativas:', erro);
      },
    });
  }

  alterarFiltroStatus(status: string): void {
    this.paginaSelecionada.set(1);
    this.filtroStatus.set(status);
  }

  pesquisarIniciativa(evento: Event): void {
    this.paginaSelecionada.set(1);
    const input = evento.target as HTMLInputElement;
    this.termoPesquisa.set(input.value.trim().toLowerCase());
  }

  alternarUnidade(unidadeId: number): void {
    this.paginaSelecionada.set(1);
    const selecionadas = this.unidadesSelecionadas();
    this.unidadesSelecionadas.set(
      selecionadas.includes(unidadeId)
        ? selecionadas.filter((id) => id !== unidadeId)
        : [...selecionadas, unidadeId],
    );
  }

  unidadeEstaSelecionada(unidadeId: number): boolean {
    return this.unidadesSelecionadas().includes(unidadeId);
  }

  alternarMenuUnidades(): void {
    this.menuUnidadesAberto.update((aberto) => !aberto);
  }

  limparFiltroUnidades(): void {
    this.paginaSelecionada.set(1);
    this.unidadesSelecionadas.set([]);
  }

  iniciativasFiltradas(): IniciativaEstrategica[] {
    const status = this.filtroStatus();
    const pesquisa = this.termoPesquisa();
    const unidadesSelecionadas = this.unidadesSelecionadas();

    return this.iniciativas().filter((iniciativa) => {
      const atendeStatus = status === 'TODOS' || iniciativa.status === status;
      const atendePesquisa = !pesquisa || iniciativa.nome.toLowerCase().includes(pesquisa);
      const atendeUnidade =
        !this.isAdmin() ||
        unidadesSelecionadas.length === 0 ||
        unidadesSelecionadas.includes(Number(iniciativa.unidade));

      return atendeStatus && atendePesquisa && atendeUnidade;
    });
  }

  obterUnidadeIniciativa(iniciativa: IniciativaEstrategica): Unidade | undefined {
    return this.unidades().find((unidade) => unidade.id === Number(iniciativa.unidade));
  }

  buscarUnidade(): void {
    this.unidadeService.get().subscribe({
      next: (dados) => this.unidades.set(dados),
      error: (erro) => console.error('erro ao buscar unidades', erro),
    });
  }

  abrirAvaliacao(iniciativa: IniciativaEstrategica): void {
    this.revisaoEmAnalise.set(this.obterRevisao(iniciativa.id));
    this.iniciativaService.getById(iniciativa.id).subscribe({
      next: (dados) => {
        this.iniciativaEmAnalise.set(dados);
      },
      error: (erro) => console.error('Erro ao carregar iniciativa:', erro),
    });
  }

  fecharAvaliacao(): void {
    this.iniciativaEmAnalise.set(null);
    this.revisaoEmAnalise.set(null);
  }

  buscarRevisoes(): void {
    this.revisaoService.listar().subscribe({
      next: (revisoes) => this.revisoes.set(revisoes),
      error: (erro) => console.error('Erro ao buscar revisões:', erro),
    });
  }

  obterRevisao(id: number): RevisaoEdicao | null {
    return (
      this.revisoes()
        .filter((revisao) => revisao.entidade === 'INICIATIVA' && revisao.entidade_id === id)
        .sort((a, b) => {
          if (a.status === 'PENDENTE' && b.status !== 'PENDENTE') return -1;
          if (a.status !== 'PENDENTE' && b.status === 'PENDENTE') return 1;
          return new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime();
        })[0] ?? null
    );
  }

  aprovarRevisao(revisao: RevisaoEdicao): void {
    this.revisaoService.aprovar(revisao.id).subscribe({
      next: () => {
        this.fecharAvaliacao();
        this.buscarRevisoes();
        this.buscarIniciativa();
      },
      error: (erro) => window.alert(erro.error?.detail ?? 'Não foi possível aprovar a alteração.'),
    });
  }

  rejeitarRevisao(evento: { revisao: RevisaoEdicao; observacao: string }): void {
    this.revisaoService.rejeitar(evento.revisao.id, evento.observacao).subscribe({
      next: () => {
        this.fecharAvaliacao();
        this.buscarRevisoes();
        this.buscarIniciativa();
      },
      error: (erro) => window.alert(erro.error?.detail ?? 'Não foi possível rejeitar a alteração.'),
    });
  }

  aprovarIniciativa(decisao: DecisaoIniciativa): void {
    this.iniciativaService.aprovar(decisao.iniciativa.id, decisao.observacao).subscribe({
      next: () => {
        this.fecharAvaliacao();
        this.buscarIniciativa();
      },
      error: (erro) => console.error('Erro ao aprovar iniciativa:', erro),
    });
  }

  rejeitarIniciativa(decisao: DecisaoIniciativa): void {
    this.iniciativaService.rejeitar(decisao.iniciativa.id, decisao.observacao).subscribe({
      next: () => {
        this.fecharAvaliacao();
        this.buscarIniciativa();
      },
      error: (erro) => console.error('Erro ao rejeitar iniciativa:', erro),
    });
  }

  obterRotuloStatusIniciativa(status: string): string {
    const mapa: Record<string, string> = {
      APROVADO: 'Aprovado/Público',
      REJEITADO: 'Rejeitado',
      RASCUNHO: 'Rascunho',
      EM_ESPERA: 'Em Espera',
    };
    return mapa[status] ?? status;
  }

  obterClasseStatusIniciativa(status: string): string {
    const mapa: Record<string, string> = {
      APROVADO: 'status-aprovado',
      REJEITADO: 'status-rejeitado',
      RASCUNHO: 'status-rascunho',
      EM_ESPERA: 'status-espera',
    };
    return mapa[status] ?? 'status-rascunho';
  }
}
