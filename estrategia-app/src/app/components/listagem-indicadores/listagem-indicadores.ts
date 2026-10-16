import { Paginacao } from '../utils/paginacao/paginacao';
import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IndicadorEstrategico } from '../../model/indicadorEstrategico';
import { IndicadorService } from '../../service/indicador.service';
import { UsuarioService } from '../../service/usuario.service';
import { UnidadeService } from '../../service/unidade.service';
import { Usuario } from '../../model/usuario';
import { Unidade } from '../../model/unidade';
import * as katex from 'katex';
import { AvaliacaoIndicador, DecisaoIndicador } from '../avaliacao-indicador/avaliacao-indicador';
import { RevisaoEdicao } from '../../model/revisaoEdicao';
import { RevisaoService } from '../../service/revisao.service';
import { FormularioIndicadores } from '../formularios/formulario-indicadores/formulario-indicadores';

@Component({
  selector: 'app-listagem-indicadores',
  imports: [Paginacao, CommonModule, AvaliacaoIndicador, FormularioIndicadores],
  templateUrl: './listagem-indicadores.html',
  styleUrl: './listagem-indicadores.scss',
})
export class ListagemIndicadores {
  constructor(
    private indicadorService: IndicadorService,
    private usuarioService: UsuarioService,
    private unidade: UnidadeService,
    private revisaoService: RevisaoService,
  ) {}
  unidades = signal<Unidade[]>([]);

  usuarioAtual = signal<Usuario | null>(null);

  isAdmin = signal(false);

  indicadores = signal<IndicadorEstrategico[]>([]);

  indicadorSelecionado: IndicadorEstrategico | null = null;

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
      Math.max(1, Math.ceil(this.indicadoresFiltrados().length / this.itensPorPagina())),
    ),
  );
  indicadoresPaginados = computed(() => {
    const inicio = (this.paginaAtual() - 1) * this.itensPorPagina();
    return this.indicadoresFiltrados().slice(inicio, inicio + this.itensPorPagina());
  });

  alterarItensPorPagina(quantidade: number): void {
    this.itensPorPagina.set(quantidade);
    this.paginaSelecionada.set(1);
  }

  ngOnInit(): void {
    this.buscarIndicador();
    this.buscarUsuarioAtual();
    this.buscarUnidades();
  }

  buscarIndicador(): void {
    this.indicadorService.get().subscribe({
      next: (indicadores) => this.indicadores.set(indicadores),
      error: (erro) => console.error('erro ao buscar indicadores', erro),
    });
  }

  alterarFiltroStatus(status: string): void {
    this.paginaSelecionada.set(1);
    this.filtroStatus.set(status);
  }

  pesquisarIndicador(evento: Event): void {
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

  indicadoresFiltrados(): IndicadorEstrategico[] {
    const status = this.filtroStatus();
    const pesquisa = this.termoPesquisa();
    const unidadesSelecionadas = this.unidadesSelecionadas();

    return this.indicadores().filter((indicador) => {
      const atendeStatus = status === 'TODOS' || indicador.status === status;
      const atendePesquisa = !pesquisa || indicador.nome.toLowerCase().includes(pesquisa);
      const atendeUnidade =
        !this.isAdmin() ||
        unidadesSelecionadas.length === 0 ||
        unidadesSelecionadas.includes(Number(indicador.unidade));

      return atendeStatus && atendePesquisa && atendeUnidade;
    });
  }

  obterUnidadeIndicador(indicador: IndicadorEstrategico): Unidade | undefined {
    return this.unidades().find((unidade) => unidade.id === Number(indicador.unidade));
  }

  abrirIndicador(indicador: IndicadorEstrategico): void {
    this.revisaoEmAnalise.set(this.obterRevisao(indicador.id));
    this.indicadorSelecionado = indicador;
  }

  fecharIndicador(): void {
    this.indicadorSelecionado = null;
    this.revisaoEmAnalise.set(null);
  }

  aprovarRevisao(revisao: RevisaoEdicao): void {
    this.revisaoService.aprovar(revisao.id).subscribe({
      next: () => {
        this.fecharIndicador();
        this.buscarRevisoes();
        this.buscarIndicador();
      },
      error: (erro) => window.alert(erro.error?.detail ?? 'Não foi possível aprovar a alteração.'),
    });
  }

  rejeitarRevisao(evento: { revisao: RevisaoEdicao; observacao: string }): void {
    this.revisaoService.rejeitar(evento.revisao.id, evento.observacao).subscribe({
      next: () => {
        this.fecharIndicador();
        this.buscarRevisoes();
        this.buscarIndicador();
      },
      error: (erro) => window.alert(erro.error?.detail ?? 'Não foi possível rejeitar a alteração.'),
    });
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

  buscarRevisoes(): void {
    this.revisaoService.listar().subscribe({
      next: (revisoes) => this.revisoes.set(revisoes),
      error: (erro) => console.error('Erro ao buscar revisões:', erro),
    });
  }

  obterRevisao(id: number): RevisaoEdicao | null {
    return (
      this.revisoes()
        .filter((revisao) => revisao.entidade === 'INDICADOR' && revisao.entidade_id === id)
        .sort((a, b) => {
          if (a.status === 'PENDENTE' && b.status !== 'PENDENTE') return -1;
          if (a.status !== 'PENDENTE' && b.status === 'PENDENTE') return 1;
          return new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime();
        })[0] ?? null
    );
  }

  buscarUnidades(): void {
    this.unidade.get().subscribe({
      next: (unidades) => this.unidades.set(unidades),

      error: (erro) => console.error('Erro ao buscar unidades:', erro),
    });
  }

  aprovarIndicador(decisao: DecisaoIndicador): void {
    const dados = {
      status: 'APROVADO',
      observacao_analise: decisao.observacao,
    };

    this.indicadorService.atualizarIndicador(decisao.indicador.id, dados).subscribe({
      next: () => {
        this.fecharIndicador();
        this.buscarIndicador();
      },
      error: (erro) => {
        console.error('Erro ao aprovar indicador:', erro);
        console.error(erro.error);
      },
    });
  }

  rejeitarIndicador(decisao: DecisaoIndicador): void {
    const dados = { status: 'REJEITADO', observacao_analise: decisao.observacao };

    this.indicadorService.atualizarIndicador(decisao.indicador.id, dados).subscribe({
      next: () => {
        this.fecharIndicador();
        this.buscarIndicador();
      },
      error: (erro) => {
        console.error('Erro ao rejeitar indicador:', erro);
        console.error(erro.error);
      },
    });
  }

  formatarDataEnvio(data?: string): string {
    if (!data) {
      return 'Sem data informada';
    }

    return new Intl.DateTimeFormat('pt-BR').format(new Date(data));
  }

  obterRotuloStatus(status: string): string {
    const rotulos: Record<string, string> = {
      APROVADO: 'Aprovado/Público',
      REJEITADO: 'Rejeitado',
      RASCUNHO: 'Rascunho',
      EM_ESPERA: 'Em espera',
    };

    return rotulos[status] ?? status;
  }

  obterClasseStatus(status: string): string {
    const classes: Record<string, string> = {
      APROVADO: 'status-aprovado',
      REJEITADO: 'status-rejeitado',
      RASCUNHO: 'status-rascunho',
      EM_ESPERA: 'status-em-espera',
    };

    return classes[status] ?? 'status-rascunho';
  }
}
