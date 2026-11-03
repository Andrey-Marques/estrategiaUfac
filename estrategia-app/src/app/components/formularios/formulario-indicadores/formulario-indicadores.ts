import { Component, signal, output, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IndicadorEstrategico } from '../../../model/indicadorEstrategico';
import { IndicadorService } from '../../../service/indicador.service';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ObjetivoEstrategico } from '../../../model/objetivoEstrategico';
import { UsuarioService } from '../../../service/usuario.service';
import { UnidadeService } from '../../../service/unidade.service';
import { ObjetivoService } from '../../../service/objetivo.service';
import { Usuario } from '../../../model/usuario';
import { Unidade } from '../../../model/unidade';
import * as katex from 'katex';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RevisaoEdicao } from '../../../model/revisaoEdicao';

@Component({
  selector: 'app-formulario-indicadores',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './formulario-indicadores.html',
  styleUrl: './formulario-indicadores.scss',
  host: { class: 'formulario-estrategico' },
})
export class FormularioIndicadores {
  constructor(
    private indicadorService: IndicadorService,
    private usuarioService: UsuarioService,
    private unidade: UnidadeService,
    private objetivoService: ObjetivoService,
    private fb: FormBuilder,
    private sanitizer: DomSanitizer,
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
  formularioIndicador: FormGroup;

  usuarios = signal<Usuario[]>([]);

  unidades = signal<Unidade[]>([]);

  objetivos = signal<ObjetivoEstrategico[]>([]);

  usuarioAtual = signal<Usuario | null>(null);

  isAdmin = signal(false);

  objetivoSelecionado: number | null = null;

  formulaRenderizada: SafeHtml | null = null;

  readonly revisoes = input<RevisaoEdicao[]>([]);

  indicadorEmEdicao: number | null = null;

  edicaoRestrita = false;

  statusIndicadorEmEdicao: string | null = null;

  ngOnInit(): void {
    this.buscarUsuarioAtual();
    this.buscarUsuarios();
    this.buscarUnidades();
    this.buscarObjetivos();
    this.observarResponsavelSelecionado();
  }

  etapaAtual = 1;

  metas: {
    id?: number;
    ano: string;
    prevista: string;
    alcancada: string;
    justificativaMetaAlcancada: string;
  }[] = [];

  indiceMetaJustificativa: number | null = null;
  justificativaMetaEmEdicao = '';

  editarIndicador(indicador: IndicadorEstrategico): void {
    this.formularioIndicador.enable();
    this.indicadorEmEdicao = indicador.id;
    this.statusIndicadorEmEdicao = indicador.status;
    this.atualizarRestricaoEdicao();
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
      id: meta.id,
      ano: String(meta.ano ?? ''),
      prevista: String(meta.meta_prevista ?? ''),
      alcancada: String(meta.meta_alcancada ?? ''),
      justificativaMetaAlcancada: meta.justificativa_meta_alcancada ?? '',
    }));
    if (this.ehGestor() && indicador.status === 'APROVADO') {
      this.formularioIndicador.disable();
    }

    this.etapaAtual = this.edicaoRestrita ? 4 : 1;
  }

  ehGestor(): boolean {
    return this.usuarioAtual()?.papel === 'GESTOR';
  }

  editarIndicadorEmAnalise(indicador: IndicadorEstrategico): void {
    this.editarIndicador(indicador);

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

  avancar(): void {
    if (this.etapaAtual < 4 && !this.edicaoRestrita) {
      this.etapaAtual++;
    }
  }

  voltar(): void {
    if (this.etapaAtual > (this.edicaoRestrita ? 4 : 1)) {
      this.etapaAtual--;
    }
  }

  irParaEtapa(etapa: number): void {
    if (etapa >= 1 && etapa <= 4 && (!this.edicaoRestrita || etapa === 4)) {
      this.etapaAtual = etapa;
    }
  }

  adicionarMeta(): void {
    this.metas.push({
      ano: '',
      prevista: '',
      alcancada: '',
      justificativaMetaAlcancada: '',
    });
  }

  removerMeta(indice: number): void {
    if (this.metadadosBloqueados()) {
      return;
    }
    const meta = this.metas[indice];

    const confirmar = window.confirm(
      `Tem certeza que deseja excluir a meta do ano ${meta.ano ?? ''}?`,
    );

    if (!confirmar) {
      return;
    }

    this.metas.splice(indice, 1);
  }

  metadadosBloqueados(): boolean {
    return this.statusIndicadorEmEdicao === 'APROVADO' && !this.isAdmin();
  }

  podeAlterarJustificativa(): boolean {
    // A justificativa acompanha a meta alcançada e permanece editável para
    // qualquer perfil, inclusive quando o indicador já foi aprovado.
    return true;
  }

  abrirJustificativa(indice: number): void {
    this.indiceMetaJustificativa = indice;
    this.justificativaMetaEmEdicao = this.metas[indice].justificativaMetaAlcancada;
  }

  fecharJustificativa(): void {
    this.indiceMetaJustificativa = null;
    this.justificativaMetaEmEdicao = '';
  }

  salvarJustificativa(): void {
    if (this.indiceMetaJustificativa === null) {
      return;
    }
    this.metas[this.indiceMetaJustificativa].justificativaMetaAlcancada =
      this.justificativaMetaEmEdicao.trim();
    this.fecharJustificativa();
  }

  validarMetas(): boolean {
    const anos = new Set<string>();
    for (const meta of this.metas) {
      const ano = meta.ano.trim();
      const prevista = meta.prevista.trim();
      const alcancada = meta.alcancada.trim();
      const justificativa = meta.justificativaMetaAlcancada.trim();

      if (!ano || !prevista) {
        window.alert('Informe o ano e a meta prevista de cada linha.');
        return false;
      }
      if (anos.has(ano)) {
        window.alert('Cada ano pode ser informado apenas uma vez.');
        return false;
      }
      if (alcancada && !justificativa) {
        window.alert(`Informe a justificativa da meta alcançada no ano ${ano}.`);
        return false;
      }
      anos.add(ano);
    }
    return true;
  }

  buscarUsuarioAtual(): void {
    this.usuarioService.getAtual().subscribe({
      next: (usuario) => {
        this.usuarioAtual.set(usuario);
        this.isAdmin.set(usuario.papel === 'ADMIN');
        this.atualizarRestricaoEdicao();
        const campoResponsavel = this.formularioIndicador.get('responsavel');

        if (usuario.papel === 'ADMIN') {
          campoResponsavel?.clearValidators();
        } else {
          campoResponsavel?.setValidators(Validators.required);
        }

        campoResponsavel?.updateValueAndValidity();

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

  private atualizarRestricaoEdicao(): void {
    this.edicaoRestrita =
      this.statusIndicadorEmEdicao === 'APROVADO' && !this.isAdmin();
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
      if (this.isAdmin()) {
        return;
      }

      if (!responsavelId) {
        return;
      }

      const responsavel = this.usuarios().find(
        (usuario) => Number(usuario.id) === Number(responsavelId),
      );

      if (!responsavel) {
        return;
      }

      const unidadeId = this.obterIdUnidadeUsuario(responsavel);

      this.formularioIndicador.patchValue({ unidade: unidadeId }, { emitEvent: false });
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
    if (this.ehGestor() && this.edicaoRestrita) {
      return;
    }
    this.objetivoSelecionado = objetivoId;
  }

  buscarUsuarios(): void {
    this.usuarioService.getResponsaveis().subscribe({
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

  salvarIndicador(status: 'EM_ESPERA' | 'APROVADO'): void {
    if (this.formularioIndicador.invalid) {
      this.formularioIndicador.markAllAsTouched();
      alert('Preencha os campos obrigatórios.');
      return;
    }

    if (!this.objetivoSelecionado) {
      alert('Selecione um objetivo estratégico.');
      this.etapaAtual = 1;
      return;
    }

    if (!this.validarMetas()) {
      this.etapaAtual = 4;
      return;
    }

    const formulario = this.formularioIndicador.getRawValue();
    const dados: any = {
      nome: formulario.nome,
      responsavel: formulario.responsavel || null,
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
        ano: meta.ano.trim(),
        meta_prevista: meta.prevista.trim(),
        meta_alcancada: meta.alcancada.trim(),
        justificativa_meta_alcancada: meta.justificativaMetaAlcancada.trim(),
      })),
    };

    const indicadorPublicadoParaUsuario =
      !this.isAdmin() &&
      this.indicadorEmEdicao !== null &&
      this.statusIndicadorEmEdicao === 'APROVADO';
    const dadosParaSalvar = indicadorPublicadoParaUsuario
      ? { evolucao_indicador: dados.evolucao_indicador }
      : dados;

    const operacao =
      this.indicadorEmEdicao === null
        ? this.indicadorService.criarIndicador(dados)
        : indicadorPublicadoParaUsuario
          ? this.indicadorService.submeterAtualizacao(this.indicadorEmEdicao, {
              evolucao_indicador: dadosParaSalvar.evolucao_indicador,
            })
          : this.indicadorService.atualizarIndicador(this.indicadorEmEdicao, dadosParaSalvar);

    operacao.subscribe({
      next: (indicador) => {
        this.salvo.emit();
        this.fecharFormulario();
      },
      error: (erro) => {
        window.alert(
          'Não foi possível salvar o indicador. ' +
            JSON.stringify(erro.error ?? 'Tente novamente.'),
        );
      },
    });
  }

  responsaveisDisponiveis(): Usuario[] {
    const unidadeId = Number(this.formularioIndicador.get('unidade')?.value);

    if (!unidadeId) {
      return [];
    }

    return this.usuarios().filter((usuario) => this.obterIdUnidadeUsuario(usuario) === unidadeId);
  }

  aoSelecionarUnidade(): void {
    if (!this.isAdmin()) {
      return;
    }

    const unidadeId = Number(this.formularioIndicador.get('unidade')?.value);

    const responsavel = this.obterResponsavelSelecionado();

    if (!responsavel) {
      return;
    }

    const unidadeResponsavel = this.obterIdUnidadeUsuario(responsavel);

    if (unidadeResponsavel !== unidadeId) {
      this.formularioIndicador.patchValue({ responsavel: null });
    }
  }

  fecharFormulario(): void {
    const modal = document.getElementById('modalIndicador');

    if (!modal) {
      return;
    }
    (window as any).bootstrap?.Modal.getOrCreateInstance(modal).hide();

    // Limpa o formulário
    this.formularioIndicador.enable();
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

  readonly salvo = output<void>();
}
