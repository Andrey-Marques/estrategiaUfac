import { Paginacao } from '../utils/paginacao/paginacao';
import { AtrasosService } from '../../service/atrasos.service';
import { AvisoAtrasos } from '../utils/aviso-atrasos/aviso-atrasos';
import { StatusProjeto } from '../utils/status-projeto/status-projeto';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild, computed, inject, signal } from '@angular/core';
import { ObjetivoEstrategico } from '../../model/objetivoEstrategico';
import { ProjetoEstrategico } from '../../model/projetoEstrategico';
import { Unidade } from '../../model/unidade';
import { Usuario } from '../../model/usuario';
import { ObjetivoService } from '../../service/objetivo.service';
import { ProjetoService } from '../../service/projeto.service';
import { UnidadeService } from '../../service/unidade.service';
import { UsuarioService } from '../../service/usuario.service';
import { AvaliacaoProjeto, DecisaoProjeto } from '../avaliacao-projeto/avaliacao-projeto';
import { RevisaoEdicao } from '../../model/revisaoEdicao';
import { RevisaoService } from '../../service/revisao.service';
import { FormularioProjetos } from '../formularios/formulario-projetos/formulario-projetos';

@Component({
  selector: 'app-listagem-projetos',
  imports: [
    Paginacao,
    CommonModule,
    AvaliacaoProjeto,
    FormularioProjetos,
    AvisoAtrasos,
    StatusProjeto,
  ],
  templateUrl: './listagem-projetos.html',
  styleUrl: './listagem-projetos.scss',
})
export class ListagemProjetos {
  @ViewChild('dropdownUnidades') private dropdownUnidades?: ElementRef<HTMLElement>;

  @HostListener('document:click', ['$event'])
  fecharFiltroAoClicarFora(evento: MouseEvent): void {
    const dropdown = this.dropdownUnidades?.nativeElement;
    if (this.menuUnidadesAberto() && (!dropdown || !evento.composedPath().includes(dropdown))) {
      this.menuUnidadesAberto.set(false);
    }
  }

  constructor(
    private projetoService: ProjetoService,
    private usuarioService: UsuarioService,
    private unidadeService: UnidadeService,
    private objetivoService: ObjetivoService,
    private revisaoService: RevisaoService,
  ) {}
  atrasos = inject(AtrasosService);

  projetos = signal<ProjetoEstrategico[]>([]);

  unidades = signal<Unidade[]>([]);

  objetivos = signal<ObjetivoEstrategico[]>([]);

  isAdmin = signal(false);

  usuarioAtual = signal<Usuario | null>(null);

  filtroStatus = signal<string>('TODOS');

  filtroExecucao = signal<string>('TODOS');

  termoPesquisa = signal<string>('');

  unidadeSelecionadas = signal<number[]>([]);

  menuUnidadesAberto = signal(false);

  projetoEmAnalise = signal<ProjetoEstrategico | null>(null);

  revisoes = signal<RevisaoEdicao[]>([]);

  revisaoEmAnalise = signal<RevisaoEdicao | null>(null);

  alterarFiltroExecucao(evento: Event): void {
    this.paginaSelecionada.set(1);
    this.filtroExecucao.set((evento.target as HTMLSelectElement).value);
  }

  paginaSelecionada = signal(1);
  itensPorPagina = signal(10);
  paginaAtual = computed(() =>
    Math.min(
      this.paginaSelecionada(),
      Math.max(1, Math.ceil(this.projetosFiltrados().length / this.itensPorPagina())),
    ),
  );
  projetosPaginados = computed(() => {
    const inicio = (this.paginaAtual() - 1) * this.itensPorPagina();
    return this.projetosFiltrados().slice(inicio, inicio + this.itensPorPagina());
  });

  alterarItensPorPagina(quantidade: number): void {
    this.itensPorPagina.set(quantidade);
    this.paginaSelecionada.set(1);
  }

  ngOnInit(): void {
    this.buscarProjeto();
    this.buscarUsuarioAtual();
    this.buscarUnidades();
    this.buscarObjetivosEstrategicos();
  }

  buscarProjeto(): void {
    this.projetoService.get().subscribe({
      next: (projeto) => {
        this.projetos.set(projeto);
        this.atrasos.atualizar();
      },
      error: (erro) => console.error('erro ao buscar projetos', erro),
    });
  }

  buscarRevisoes(): void {
    this.revisaoService.listar().subscribe({
      next: (revisoes) => {
        this.revisoes.set(revisoes);
        this.buscarProjeto();
      },
      error: (erro) => console.error('Erro ao buscar revisões de edição:', erro),
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

  alterarFiltroStatus(status: string): void {
    this.paginaSelecionada.set(1);
    this.filtroStatus.set(status);
  }

  pesquisarProjeto(evento: Event): void {
    this.paginaSelecionada.set(1);
    const input = evento.target as HTMLInputElement;

    this.termoPesquisa.set(input.value.trim().toLowerCase());
  }

  alternarUnidade(unidadeId: number): void {
    this.paginaSelecionada.set(1);
    const selecionadas = this.unidadeSelecionadas();

    if (selecionadas.includes(unidadeId)) {
      this.unidadeSelecionadas.set(selecionadas.filter((id) => id !== unidadeId));
    } else {
      this.unidadeSelecionadas.set([...selecionadas, unidadeId]);
    }
  }

  unidadeEstaSelecionada(unidadeId: number): boolean {
    return this.unidadeSelecionadas().includes(unidadeId);
  }

  alternarMenuUnidades(): void {
    this.menuUnidadesAberto.update((aberto) => !aberto);
  }

  limparFiltroUnidades(): void {
    this.paginaSelecionada.set(1);
    this.unidadeSelecionadas.set([]);
  }

  projetosFiltrados(): ProjetoEstrategico[] {
    const status = this.filtroStatus();

    const pesquisa = this.termoPesquisa();

    const unidadeSelecionadas = this.unidadeSelecionadas();

    return this.projetos().filter((projeto) => {
      // ========================
      // FILTRO DE STATUS
      // ========================

      const atendeStatus = status === 'TODOS' || projeto.status === status;

      // ========================
      // PESQUISA PELO NOME
      // ========================

      const nomeProjeto = projeto.nome?.toLowerCase() ?? '';

      const atendePesquisa = !pesquisa || nomeProjeto.includes(pesquisa);

      // ========================
      // FILTRO DE UNIDADE
      // ========================

      const atendeUnidade =
        unidadeSelecionadas.length === 0 || unidadeSelecionadas.includes(Number(projeto.unidade));

      const atendeExecucao =
        this.filtroExecucao() === 'TODOS' ||
        (projeto.status_execucao ?? 'ANDAMENTO') === this.filtroExecucao();
      return atendeStatus && atendeExecucao && atendePesquisa && atendeUnidade;
    });
  }

  abrirAvaliacao(projeto: ProjetoEstrategico): void {
    this.revisaoEmAnalise.set(this.obterRevisaoProjeto(projeto.id));
    this.projetoService.getById(projeto.id).subscribe({
      next: (projetoDetalhado) => {
        this.projetoEmAnalise.set(projetoDetalhado);
      },

      error: (erro) => {
        console.error('Erro ao carregar projeto:', erro);
      },
    });
  }

  fecharAvaliacao(): void {
    this.projetoEmAnalise.set(null);
    this.revisaoEmAnalise.set(null);
  }

  aprovarProjeto(decisao: DecisaoProjeto): void {
    this.projetoService.aprovarProjeto(decisao.projeto.id, decisao.observacao).subscribe({
      next: () => {
        this.fecharAvaliacao();
        this.buscarProjeto();
      },
      error: (erro) => window.alert(erro.error?.detail ?? 'Não foi possível aprovar o projeto.'),
    });
  }

  rejeitarProjeto(decisao: DecisaoProjeto): void {
    this.projetoService.rejeitarProjeto(decisao.projeto.id, decisao.observacao).subscribe({
      next: () => {
        this.fecharAvaliacao();
        this.buscarProjeto();
      },
      error: (erro) => window.alert(erro.error?.detail ?? 'Não foi possível rejeitar o projeto.'),
    });
  }

  obterRevisaoProjeto(projetoId: number): RevisaoEdicao | null {
    return (
      this.revisoes()
        .filter((revisao) => revisao.entidade === 'PROJETO' && revisao.entidade_id === projetoId)
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
        window.alert('Alteração aprovada e publicada com sucesso.');
        this.fecharAvaliacao();
        this.buscarRevisoes();
        this.buscarProjeto();
      },
      error: (erro) => window.alert(erro.error?.detail ?? 'Não foi possível aprovar a revisão.'),
    });
  }

  rejeitarRevisao(evento: { revisao: RevisaoEdicao; observacao: string }): void {
    this.revisaoService.rejeitar(evento.revisao.id, evento.observacao).subscribe({
      next: () => {
        window.alert('Alteração rejeitada.');
        this.fecharAvaliacao();
        this.buscarRevisoes();
        this.buscarProjeto();
      },
      error: (erro) => window.alert(erro.error?.detail ?? 'Não foi possível rejeitar a revisão.'),
    });
  }

  private normalizarIds(
    valores: Array<
      number | { id?: number; objetivo?: number; objetivo_id?: number } | null | undefined
    >,
  ): number[] {
    return (valores ?? [])
      .map((item) => {
        if (typeof item === 'number') return item;
        return item?.id ?? item?.objetivo ?? item?.objetivo_id ?? null;
      })
      .filter((valor): valor is number => valor !== null && valor !== undefined);
  }

  buscarUnidades(): void {
    this.unidadeService.get().subscribe({
      next: (dados) => this.unidades.set(dados),
      error: (erro) => console.error('erro ao buscar unidades', erro),
    });
  }

  buscarObjetivosEstrategicos(): void {
    this.objetivoService.get().subscribe({
      next: (dados) => this.objetivos.set(dados),
      error: (erro) => console.error('Erro ao buscar objetivos estratégicos:', erro),
    });
  }

  obterClasseStatus(status: string): string {
    const classes: Record<string, string> = {
      APROVADO: 'status-aprovado',
      EM_ESPERA: 'status-em-espera',

      REJEITADO: 'status-rejeitado',
    };

    return classes[status] ?? 'status-desconhecido';
  }

  obterRotuloStatus(status: string): string {
    const rotulos: Record<string, string> = {
      APROVADO: 'Aprovado/Público',
      EM_ESPERA: 'Em Espera',

      REJEITADO: 'Rejeitado',
    };

    return rotulos[status] ?? status;
  }

  obterUnidadeProjeto(projeto: ProjetoEstrategico): Unidade | undefined {
    return this.unidades().find((unidade) => unidade.id === projeto.unidade);
  }

  obterPercentual(projeto: ProjetoEstrategico): number {
    const percentual = Number(projeto.percentual_progresso) || 0;

    return Math.min(Math.max(percentual, 0), 100);
  }

  obterObjetivosProjeto(projeto: ProjetoEstrategico): ObjetivoEstrategico[] {
    const idsObjetivos = this.normalizarIds(projeto.objetivos ?? []);

    return idsObjetivos
      .map((idObjetivo) => this.objetivos().find((objetivo) => objetivo.id === idObjetivo))
      .filter((objetivo): objetivo is ObjetivoEstrategico => !!objetivo)
      .slice(0, 2);
  }
}
