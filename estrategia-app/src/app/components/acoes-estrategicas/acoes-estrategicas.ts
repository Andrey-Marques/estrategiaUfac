import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HeaderPublico } from '../utils/header-publico/header-publico';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Rodape } from '../utils/rodape/rodape';
import {
  AcaoEstrategicaPublica,
  AcoesEstrategicasPublicas,
  AcoesEstrategicasService,
  TipoAcaoEstrategica,
} from '../../service/acoes-estrategicas.service';

interface AbaEstrategica {
  id: TipoAcaoEstrategica;
  label: string;
}

interface FiltroAtivo {
  tipo: 'pesquisa' | 'unidade' | 'objetivo';
  id?: number;
  label: string;
}

interface Filtros {
  pesquisa: string;
  unidades: number[];
  objetivos: number[];
}

type Ordenacao = 'titulo-az' | 'titulo-za' | 'data-recente' | 'data-antiga';

@Component({
  selector: 'app-acoes-estrategicas',
  imports: [CommonModule, HeaderPublico, RouterModule, FormsModule, Rodape],
  templateUrl: './acoes-estrategicas.html',
  styleUrl: './acoes-estrategicas.scss',
})
export class AcoesEstrategicas implements OnInit {
  private readonly service = inject(AcoesEstrategicasService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly chaveAba = 'estrategia-ufac:acoes:aba';
  readonly unidadeDoPainel = signal<number | null>(null);

  readonly abas: AbaEstrategica[] = [
    { id: 'projetos', label: 'Projetos Estratégicos' },
    { id: 'indicadores', label: 'Indicadores Estratégicos' },
    { id: 'iniciativas', label: 'Iniciativas Estratégicas' },
  ];

  readonly abaAtiva = signal<TipoAcaoEstrategica>('indicadores');
  readonly dados = signal<AcoesEstrategicasPublicas>({
    registros: [],
    unidades: [],
    objetivos: [],
  });
  readonly carregando = signal(true);
  readonly erro = signal('');
  readonly pesquisa = signal('');
  readonly unidadesSelecionadas = signal<number[]>([]);
  readonly objetivosSelecionados = signal<number[]>([]);
  readonly ordenacao = signal<Ordenacao>('titulo-az');
  readonly paginaAtual = signal(1);
  readonly tamanhoPagina = 10;
  readonly filtrosAplicados = signal<Filtros>({ pesquisa: '', unidades: [], objetivos: [] });

  readonly filtrosAtivos = computed<FiltroAtivo[]>(() => {
    const filtros = this.filtrosAplicados();
    const tags: FiltroAtivo[] = [];

    if (filtros.pesquisa) {
      tags.push({ tipo: 'pesquisa', label: `Pesquisa: ${filtros.pesquisa}` });
    }
    for (const unidade of this.dados().unidades) {
      if (filtros.unidades.includes(unidade.id)) {
        tags.push({ tipo: 'unidade', id: unidade.id, label: `Unidade: ${unidade.sigla}` });
      }
    }
    for (const objetivo of this.dados().objetivos) {
      if (filtros.objetivos.includes(objetivo.id)) {
        tags.push({ tipo: 'objetivo', id: objetivo.id, label: `Objetivo: ${objetivo.codigo}` });
      }
    }
    return tags;
  });

  readonly registrosFiltrados = computed(() => {
    const filtros = this.filtrosAplicados();
    const pesquisa = this.normalizar(filtros.pesquisa);
    const registros = this.dados().registros.filter(
      (registro) =>
        registro.tipo === this.abaAtiva() &&
        (this.unidadeDoPainel() === null || registro.unidade_id === this.unidadeDoPainel()) &&
        (!pesquisa ||
          this.normalizar(
            `${registro.titulo} ${registro.objetivos.map((objetivo) => objetivo.codigo).join(' ')}`,
          ).includes(pesquisa)) &&
        (!filtros.unidades.length || filtros.unidades.includes(registro.unidade_id)) &&
        (!filtros.objetivos.length ||
          registro.objetivos.some((objetivo) => filtros.objetivos.includes(objetivo.id))),
    );

    const ordem = this.ordenacao();
    return registros.sort((a, b) => {
      const titulo = a.titulo.localeCompare(b.titulo, 'pt-BR', {
        sensitivity: 'base',
        numeric: true,
      });
      if (ordem === 'titulo-az') return titulo || a.id - b.id;
      if (ordem === 'titulo-za') return -titulo || a.id - b.id;
      const dataA = this.dataRegistro(a);
      const dataB = this.dataRegistro(b);
      if (!dataA && dataB) return 1;
      if (dataA && !dataB) return -1;
      const diferenca = (dataA ? Date.parse(dataA) : 0) - (dataB ? Date.parse(dataB) : 0);
      return (ordem === 'data-recente' ? -diferenca : diferenca) || titulo || a.id - b.id;
    });
  });

  readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.registrosFiltrados().length / this.tamanhoPagina)),
  );
  readonly registrosPagina = computed(() => {
    const inicio = (this.paginaAtual() - 1) * this.tamanhoPagina;
    return this.registrosFiltrados().slice(inicio, inicio + this.tamanhoPagina);
  });

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const unidade = Number(params.get('unidade'));
      const unidadeAtual = Number.isSafeInteger(unidade) && unidade > 0 ? unidade : null;
      if (this.unidadeDoPainel() !== unidadeAtual) {
        this.unidadeDoPainel.set(unidadeAtual);
        this.limparFiltros();
      }

      const aba = params.get('aba');
      const abaRestaurada = this.abaValida(aba) ? aba : this.lerAbaSalva();
      if (this.abaAtiva() !== abaRestaurada) {
        this.abaAtiva.set(abaRestaurada);
        this.paginaAtual.set(1);
      }
      this.salvarAba(abaRestaurada);
    });
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set('');
    this.service
      .listar()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (dados) => {
          this.dados.set(dados);
          this.paginaAtual.set(1);
          this.carregando.set(false);
        },
        error: () => {
          this.erro.set('Não foi possível carregar as ações estratégicas. Tente novamente.');
          this.carregando.set(false);
        },
      });
  }

  selecionarAba(id: TipoAcaoEstrategica): void {
    this.abaAtiva.set(id);
    this.paginaAtual.set(1);
    this.salvarAba(id);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { aba: id },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private abaValida(valor: string | null): valor is TipoAcaoEstrategica {
    return this.abas.some((aba) => aba.id === valor);
  }

  private lerAbaSalva(): TipoAcaoEstrategica {
    try {
      const aba = sessionStorage.getItem(this.chaveAba);
      return this.abaValida(aba) ? aba : 'indicadores';
    } catch {
      return 'indicadores';
    }
  }

  private salvarAba(aba: TipoAcaoEstrategica): void {
    try {
      sessionStorage.setItem(this.chaveAba, aba);
    } catch {
      // A URL mantém a seleção mesmo quando o armazenamento está indisponível.
    }
  }

  alternarUnidade(id: number): void {
    this.unidadesSelecionadas.update((ids) => this.alternarSelecao(ids, id));
  }

  alternarObjetivo(id: number): void {
    this.objetivosSelecionados.update((ids) => this.alternarSelecao(ids, id));
  }

  filtrar(): void {
    this.filtrosAplicados.set({
      pesquisa: this.pesquisa().trim(),
      unidades: [...this.unidadesSelecionadas()],
      objetivos: [...this.objetivosSelecionados()],
    });
    this.paginaAtual.set(1);
  }

  removerFiltro(filtro: FiltroAtivo): void {
    if (filtro.tipo === 'pesquisa') {
      this.pesquisa.set('');
      this.filtrosAplicados.update((atual) => ({ ...atual, pesquisa: '' }));
    } else if (filtro.tipo === 'unidade') {
      this.unidadesSelecionadas.update((ids) => ids.filter((id) => id !== filtro.id));
      this.filtrosAplicados.update((atual) => ({
        ...atual,
        unidades: atual.unidades.filter((id) => id !== filtro.id),
      }));
    } else {
      this.objetivosSelecionados.update((ids) => ids.filter((id) => id !== filtro.id));
      this.filtrosAplicados.update((atual) => ({
        ...atual,
        objetivos: atual.objetivos.filter((id) => id !== filtro.id),
      }));
    }
    this.paginaAtual.set(1);
  }

  limparFiltros(): void {
    this.pesquisa.set('');
    this.unidadesSelecionadas.set([]);
    this.objetivosSelecionados.set([]);
    this.filtrar();
  }

  ordenar(valor: Ordenacao): void {
    this.ordenacao.set(valor);
    this.paginaAtual.set(1);
  }

  mudarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas()) this.paginaAtual.set(pagina);
  }

  codigos(registro: AcaoEstrategicaPublica): string {
    return (
      registro.objetivos
        .slice(0, 2)
        .map((objetivo) => objetivo.codigo)
        .join(', ') || '—'
    );
  }

  dataRegistro(registro: AcaoEstrategicaPublica): string | null {
    return registro.data_atualizacao ?? registro.data_cadastro;
  }

  identificarRegistro(_: number, registro: AcaoEstrategicaPublica): string {
    return `${registro.tipo}-${registro.id}`;
  }

  private alternarSelecao(ids: number[], id: number): number[] {
    return ids.includes(id) ? ids.filter((valor) => valor !== id) : [...ids, id];
  }

  private normalizar(texto: string): string {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('pt-BR');
  }
  abrirRegistro(registro: AcaoEstrategicaPublica): void {
    const rotas = {
      projetos: '/visualizacao-projeto',
      indicadores: '/visualizacao-indicador',
      iniciativas: '/visualizacao-iniciativa',
    };
    this.salvarAba(this.abaAtiva());
    this.router.navigate([rotas[registro.tipo], registro.id]);
  }
}
