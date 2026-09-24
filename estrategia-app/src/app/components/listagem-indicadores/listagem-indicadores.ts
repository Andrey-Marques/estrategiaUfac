import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IndicadorEstrategico } from '../../model/indicadorEstrategico';
import { IndicadorService } from '../../service/indicador.service';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ObjetivoEstrategico } from '../../model/objetivoEstrategico';
import { UsuarioService } from '../../service/usuario.service';
import { UnidadeService } from '../../service/unidade.service';
import { ObjetivoService } from '../../service/objetivo.service';
import { Usuario } from '../../model/usuario';
import { Unidade } from '../../model/unidade';
import * as katex from 'katex';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AvaliacaoIndicador, DecisaoIndicador } from '../avaliacao-indicador/avaliacao-indicador';
import { RevisaoEdicao } from '../../model/revisaoEdicao';
import { RevisaoService } from '../../service/revisao.service';

@Component({
  selector: 'app-listagem-indicadores',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, AvaliacaoIndicador],
  templateUrl: './listagem-indicadores.html',
  styleUrl: './listagem-indicadores.scss',
})
export class ListagemIndicadores {
  formularioIndicador: FormGroup;
  usuarios = signal<Usuario[]>([]);
  unidades = signal<Unidade[]>([]);
  objetivos = signal<ObjetivoEstrategico[]>([]);
  usuarioAtual = signal<Usuario | null>(null);
  isAdmin = signal(false);
  objetivoSelecionado: number | null = null;
  formulaRenderizada: SafeHtml | null = null;
  indicadores = signal<IndicadorEstrategico[]>([]);
  indicadorSelecionado: IndicadorEstrategico | null = null;
  revisoes = signal<RevisaoEdicao[]>([]);
  revisaoEmAnalise = signal<RevisaoEdicao | null>(null);
  indicadorEmEdicao: number | null = null;
  edicaoRestrita = false;
  statusIndicadorEmEdicao: string | null = null;
  filtroStatus = signal<string>('TODOS');
  termoPesquisa = signal<string>('');
  unidadesSelecionadas = signal<number[]>([]);
  menuUnidadesAberto = signal(false);

  constructor(
    private indicadorService: IndicadorService,
    private usuarioService: UsuarioService,
    private unidade: UnidadeService,
    private objetivoService: ObjetivoService,
    private fb: FormBuilder,
    private sanitizer: DomSanitizer,
    private revisaoService: RevisaoService,
  ) {
    this.formularioIndicador = this.fb.group({
      nome: ['', Validators.required],
      responsavel: [null, Validators.required],
      unidade: [null, Validators.required],
      finalidade: ['', Validators.required],
      unidadeMedida: [''],
      polaridade: ['', Validators.required],
      metodoCalculo: ['', Validators.required],
      formula: [''],
      observacao: [''],
    });
  }

  ngOnInit(): void {
    this.buscarIndicador();
    this.buscarUsuarioAtual();
    this.buscarUsuarios();
    this.buscarUnidades();
    this.buscarObjetivos();
    this.observarResponsavelSelecionado();
  }

  buscarIndicador(): void {
    this.indicadorService.get().subscribe({
      next: (indicadores) => this.indicadores.set(indicadores),
      error: (erro) => console.error('erro ao buscar indicadores', erro),
    });
  }

  alterarFiltroStatus(status: string): void {
    this.filtroStatus.set(status);
  }

  pesquisarIndicador(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    this.termoPesquisa.set(input.value.trim().toLowerCase());
  }

  alternarUnidade(unidadeId: number): void {
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

  etapaAtual = 1;

  previewFormula: string | null = null;

  metas: {
    ano: number | null;
    prevista: number | null;
    alcancada: number | null;
  }[] = [];

  abrirIndicador(indicador: IndicadorEstrategico): void {
    this.revisaoEmAnalise.set(this.obterRevisao(indicador.id));
    this.indicadorSelecionado = indicador;
  }

  editarIndicador(indicador: IndicadorEstrategico): void {
    this.indicadorEmEdicao = indicador.id;
    this.edicaoRestrita = !this.isAdmin() && indicador.status === 'APROVADO';
    this.statusIndicadorEmEdicao = indicador.status;
    this.objetivoSelecionado = indicador.objetivo;
    this.formularioIndicador.patchValue({
      nome: indicador.nome,
      responsavel: indicador.responsavel,
      unidade: indicador.unidade,
      finalidade: indicador.finalidade,
      unidadeMedida: indicador.unidade_medida,
      polaridade: indicador.polaridade,
      metodoCalculo: indicador.metodo_calculo,
      formula: indicador.formula,
      observacao: indicador.observacao || '',
    });
    this.renderizarFormula();
    this.metas = (indicador.evolucao_indicador || []).map((meta) => ({
      ano: Number(meta.ano),
      prevista: Number(meta.meta_prevista) || null,
      alcancada: Number(meta.meta_alcancada) || null,
    }));
    this.etapaAtual = this.edicaoRestrita ? 3 : 1;
  }

  editarIndicadorEmAnalise(indicador: IndicadorEstrategico): void {
    this.editarIndicador(indicador);
    this.fecharIndicador();

    requestAnimationFrame(() => {
      const modal = document.getElementById('modalIndicador');
      const bootstrap = (window as any).bootstrap;

      if (!modal || !bootstrap?.Modal) {
        return;
      }

      const instancia = bootstrap.Modal.getOrCreateInstance(modal);
      instancia.show();
    });
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

  /* =========================
    NAVEGAÇÃO
    ========================= */

  avancar(): void {
    if (this.etapaAtual < 4 && (!this.edicaoRestrita || this.etapaAtual >= 3)) {
      this.etapaAtual++;
    }
  }

  voltar(): void {
    if (this.etapaAtual > (this.edicaoRestrita ? 3 : 1)) {
      this.etapaAtual--;
    }
  }

  irParaEtapa(etapa: number): void {
    if (etapa >= 1 && etapa <= 4 && (!this.edicaoRestrita || etapa >= 3)) {
      this.etapaAtual = etapa;
    }
  }

  adicionarMeta(): void {
    const anosPreenchidos = this.metas
      .map((meta) => Number(meta.ano))
      .filter((ano) => Number.isFinite(ano));
    const ultimoAno =
      anosPreenchidos.length > 0 ? anosPreenchidos[anosPreenchidos.length - 1] : null;

    this.metas.push({
      ano: ultimoAno === null ? null : ultimoAno + 1,
      prevista: null,
      alcancada: null,
    });
  }

  removerMeta(indice: number): void {
    const meta = this.metas[indice];

    const confirmar = window.confirm(
      `Tem certeza que deseja excluir a meta do ano ${meta.ano ?? ''}?`,
    );

    if (!confirmar) {
      return;
    }

    this.metas.splice(indice, 1);
  }

  buscarUsuarioAtual(): void {
    this.usuarioService.getAtual().subscribe({
      next: (usuario) => {
        this.usuarioAtual.set(usuario);
        this.isAdmin.set(usuario.papel === 'ADMIN');
        this.buscarRevisoes();
        this.atualizarUsuariosDaUnidade();
        if (usuario.papel !== 'ADMIN') {
          this.formularioIndicador.patchValue(
            { unidade: this.obterIdUnidadeUsuario(usuario) },
            { emitEvent: false },
          );
        }
      },
      error: (erro) => console.error('Erro ao buscar usuário:', erro),
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

  obterRotuloRevisao(status: string): string {
    return (
      (
        {
          PENDENTE: 'Alteração pendente',
          APROVADA: 'Alteração aprovada',
          REJEITADA: 'Alteração rejeitada',
        } as Record<string, string>
      )[status] ?? status
    );
  }
  private observarResponsavelSelecionado(): void {
    this.formularioIndicador.get('responsavel')?.valueChanges.subscribe((responsavelId) => {
      if (!responsavelId) {
        this.formularioIndicador.patchValue({ unidade: null }, { emitEvent: false });
        return;
      }

      const responsavel = this.usuarios().find(
        (usuario) => Number(usuario.id) === Number(responsavelId),
      );

      if (!responsavel) {
        return;
      }

      const unidadeId =
        typeof responsavel.unidade === 'number' ? responsavel.unidade : responsavel.unidade?.id;
      this.formularioIndicador.patchValue({ unidade: unidadeId ?? null }, { emitEvent: false });
    });
  }

  private obterIdUnidadeUsuario(usuario: Usuario): number | null {
    if (!usuario.unidade) {
      return null;
    }

    // Caso a API retorne somente o ID
    if (typeof usuario.unidade === 'number') {
      return usuario.unidade;
    }

    // Caso futuramente a API retorne o objeto completo
    return usuario.unidade.id;
  }

  obterResponsavelSelecionado(): Usuario | null {
    const id = Number(this.formularioIndicador.get('responsavel')?.value);

    return this.usuarios().find((usuario) => usuario.id === id) ?? null;
  }

  selecionarObjetivo(objetivoId: number): void {
    this.objetivoSelecionado = objetivoId;
  }
  buscarUsuarios(): void {
    this.usuarioService.get().subscribe({
      next: (usuarios) => {
        this.usuarios.set(usuarios);
        this.atualizarUsuariosDaUnidade();
      },
      error: (erro) => console.error('Erro ao buscar usuários:', erro),
    });
  }

  private atualizarUsuariosDaUnidade(): void {
    const usuarioAtual = this.usuarioAtual();
    const usuarios = this.usuarios();

    if (!usuarioAtual || usuarioAtual.papel === 'ADMIN') {
      return;
    }

    const unidadeId = this.obterIdUnidadeUsuario(usuarioAtual);
    this.usuarios.set(
      usuarios.filter((usuario) => this.obterIdUnidadeUsuario(usuario) === unidadeId),
    );
  }

  buscarUnidades(): void {
    this.unidade.get().subscribe({
      next: (unidades) => this.unidades.set(unidades),

      error: (erro) => console.error('Erro ao buscar unidades:', erro),
    });
  }
  obterSiglaUnidadeUsuario(usuario: Usuario): string {
    return this.obterUnidadeUsuario(usuario)?.sigla ?? '';
  }

  obterUnidadeUsuario(usuario: Usuario): Unidade | undefined {
    const unidadeId = this.obterIdUnidadeUsuario(usuario);

    if (unidadeId === null) {
      return undefined;
    }

    return this.unidades().find((unidade) => unidade.id === unidadeId);
  }

  buscarObjetivos(): void {
    this.objetivoService.get().subscribe({
      next: (objetivos) => this.objetivos.set(objetivos),
      error: (erro) => console.error('Erro ao buscar objetivos:', erro),
    });
  }

  salvarIndicador(status: 'RASCUNHO' | 'EM_ESPERA' | 'APROVADO'): void {
    if (status !== 'RASCUNHO' && this.formularioIndicador.invalid) {
      this.formularioIndicador.markAllAsTouched();
      alert('Preencha os campos obrigatórios.');
      return;
    }

    if (status !== 'RASCUNHO' && !this.objetivoSelecionado) {
      alert('Selecione um objetivo estratégico.');
      this.etapaAtual = 1;
      return;
    }

    const formulario = this.formularioIndicador.getRawValue();
    const dados: any = {
      nome: formulario.nome,
      responsavel: formulario.responsavel,
      unidade: formulario.unidade,
      objetivo: this.objetivoSelecionado,
      finalidade: formulario.finalidade,
      unidade_medida: formulario.unidadeMedida || '',
      polaridade: formulario.polaridade,
      metodo_calculo: formulario.metodoCalculo,
      formula: formulario.formula || '',
      observacao: formulario.observacao || '',
      status,
      evolucao_indicador: this.metas.map((meta) => ({
        ano: String(meta.ano ?? ''),
        meta_prevista: String(meta.prevista ?? ''),
        meta_alcancada: String(meta.alcancada ?? ''),
      })),
    };

    if (
      this.indicadorEmEdicao !== null &&
      !this.isAdmin() &&
      this.statusIndicadorEmEdicao === 'APROVADO'
    ) {
      Object.assign(dados, {
        evolucao_indicador: dados.evolucao_indicador,
        observacao: formulario.observacao || '',
      });
      delete dados.nome;
      delete dados.responsavel;
      delete dados.unidade;
      delete dados.objetivo;
      delete dados.finalidade;
      delete dados.unidade_medida;
      delete dados.polaridade;
      delete dados.metodo_calculo;
      delete dados.formula;
      delete dados.status;
    }

    const operacao =
      this.indicadorEmEdicao === null
        ? this.indicadorService.criarIndicador(dados)
        : !this.isAdmin() && this.statusIndicadorEmEdicao === 'APROVADO'
          ? this.indicadorService.submeterAtualizacao(this.indicadorEmEdicao, {
              evolucao_indicador: dados.evolucao_indicador,
              observacao: dados.observacao,
            })
          : this.indicadorService.atualizarIndicador(this.indicadorEmEdicao, dados);

    operacao.subscribe({
      next: (indicador) => {
        this.buscarIndicador();
        this.fecharFormulario();
      },
      error: (erro) => {
        console.error('Erro ao criar indicador:', erro);
      },
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

  fecharFormulario(): void {
    const modal = document.getElementById('modalIndicador');

    if (!modal) {
      return;
    }
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    modal.style.display = 'none';

    const backdrop = document.querySelector('.modal-backdrop');

    if (backdrop) {
      backdrop.remove();
    }

    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('padding-right');

    // Limpa o formulário
    this.formularioIndicador.reset({
      nome: '',
      responsavel: null,
      unidade: null,
      finalidade: '',
      unidadeMedida: '',
      polaridade: '',
      metodoCalculo: '',
      formula: '',
      observacao: '',
    });

    this.objetivoSelecionado = null;
    this.indicadorEmEdicao = null;
    this.edicaoRestrita = false;
    this.statusIndicadorEmEdicao = null;
    this.formulaRenderizada = '';
    this.metas = [];
    this.etapaAtual = 1;
  }

  renderizarFormula(): void {
    const formula = this.formularioIndicador.get('formula')?.value;
    if (!formula) {
      this.formulaRenderizada = null;
      return;
    }
    try {
      const htmlFormula = katex.renderToString(formula, {
        throwOnError: false,
        displayMode: true,
      });
      this.formulaRenderizada = this.sanitizer.bypassSecurityTrustHtml(htmlFormula);
    } catch (erro) {
      console.error('Erro ao renderizar fórmula:', erro);
      this.formulaRenderizada = null;
    }
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
