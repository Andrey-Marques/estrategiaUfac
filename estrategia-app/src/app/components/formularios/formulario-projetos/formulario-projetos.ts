import { validarStatusAcao } from '../../../model/validacao-status-acao';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, signal, output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ObjetivoEstrategico } from '../../../model/objetivoEstrategico';
import { ProjetoEstrategico } from '../../../model/projetoEstrategico';
import { Unidade } from '../../../model/unidade';
import { Usuario } from '../../../model/usuario';
import { ObjetivoService } from '../../../service/objetivo.service';
import { ProjetoService } from '../../../service/projeto.service';
import { UnidadeService } from '../../../service/unidade.service';
import { UsuarioService } from '../../../service/usuario.service';
import { AcaoProjeto } from '../../../model/projetoEstrategico';
import { MascaraReais } from '../../../directives/mascara-reais';

@Component({
  selector: 'app-formulario-projetos',
  imports: [CommonModule, ReactiveFormsModule, MascaraReais],
  templateUrl: './formulario-projetos.html',
  styleUrl: './formulario-projetos.scss',
  host: { class: 'formulario-estrategico' },
})
export class FormularioProjetos {
  constructor(
    private projetoService: ProjetoService,
    private construtorFormulario: FormBuilder,
    private usuarioService: UsuarioService,
    private unidadeService: UnidadeService,
    private objetivoService: ObjetivoService,
  ) {
    this.formularioAcaoInterno = this.construtorFormulario.group({
      descricaoAcao: ['', [Validators.required, Validators.maxLength(255)]],
      prazoInicio: ['', Validators.required],
      prazoFim: ['', Validators.required],
      custoEstimado: [0, [Validators.required, Validators.min(0)]],
      custoRealizado: [0, [Validators.required, Validators.min(0)]],
      inicioEfetivo: [''],
      fimEfetivo: [''],
      statusAtual: ['PLANEJAMENTO', Validators.required],
    });
    this.formularioProjeto = this.construtorFormulario.group({
      tituloProjeto: ['', Validators.required],
      liderProjeto: ['', Validators.required],
      unidadeResponsavel: ['', Validators.required],
      descricao: [''],
      tempoEstimado: ['', Validators.required],

      statusExecucao: ['ANDAMENTO', Validators.required],
      justificativaDescontinuacao: ['', Validators.maxLength(2000)],
      percentualProgresso: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      objetivos: [[], Validators.required],
    });
    this.formularioProjeto
      .get('statusExecucao')
      ?.valueChanges.subscribe(() => this.atualizarValidacaoJustificativa());
  }
  acoesProjeto = signal<AcaoProjeto[]>([]);

  statusRegistroEditado = '';

  acoesAntesDaEdicao: AcaoProjeto[] = [];

  formularioAcaoInterno: FormGroup;

  submodalAcaoAberto = false;

  acaoEmEdicaoIndice: number | null = null;

  usuarios = signal<Usuario[]>([]);

  unidades = signal<Unidade[]>([]);

  objetivos = signal<ObjetivoEstrategico[]>([]);

  isAdmin = signal(false);

  usuarioAtual = signal<Usuario | null>(null);

  formularioProjeto: FormGroup;

  etapaAtual = 1;

  visualizando = false;

  modoEdicaoProjeto = false;

  editandoProjetoRejeitado = false;

  projetoSelecionadoId: number | null = null;

  realizacoesConcluidas = signal<string[]>([]);

  proximosPassos = signal<string[]>([]);

  realizacoesAntesDaEdicao: string[] = [];

  proximosPassosAntesDaEdicao: string[] = [];

  dadosFormularioAntesDaEdicao: any = null;

  private readonly changeDetector = inject(ChangeDetectorRef);

  atualizarValidacaoJustificativa(): void {
    const campo = this.formularioProjeto.get('justificativaDescontinuacao');
    const descontinuado = this.formularioProjeto.get('statusExecucao')?.value === 'DESCONTINUADO';
    campo?.setValidators(
      descontinuado
        ? [Validators.required, Validators.pattern(/\S/), Validators.maxLength(2000)]
        : [Validators.maxLength(2000)],
    );
    campo?.updateValueAndValidity({ emitEvent: false });
  }

  ngOnInit(): void {
    this.buscarUsuarioAtual();
    this.buscarUsuarios();
    this.buscarUnidades();
    this.buscarObjetivosEstrategicos();
  }

  buscarUsuarioAtual(): void {
    this.usuarioService.getAtual().subscribe({
      next: (usuario) => {
        this.usuarioAtual.set(usuario);
        this.isAdmin.set(usuario.papel === 'ADMIN');

        const campoResponsavel = this.formularioProjeto.get('liderProjeto');
        if (usuario.papel !== 'ADMIN') {
          const unidadeId = this.obterIdUnidadeUsuario(usuario);

          this.formularioProjeto.patchValue({
            unidadeResponsavel: unidadeId,
          });
        }

        if (usuario.papel === 'ADMIN') {
          campoResponsavel?.clearValidators();
        } else {
          campoResponsavel?.setValidators(Validators.required);
        }

        campoResponsavel?.updateValueAndValidity();
      },

      error: (erro) => {
        console.error('Erro ao buscar usuário atual:', erro);
      },
    });
  }

  editarProjetoRejeitado(projeto: ProjetoEstrategico): void {
    this.projetoSelecionadoId = projeto.id;

    this.visualizando = false;

    this.editandoProjetoRejeitado = projeto.status === 'REJEITADO';

    this.modoEdicaoProjeto = false;

    this.projetoService.getById(projeto.id).subscribe({
      next: (projetoDetalhado) => {
        this.carregarEvolucoesProjeto(projetoDetalhado);
        this.formularioProjeto.enable();

        this.formularioProjeto.patchValue({
          tituloProjeto: projetoDetalhado.nome,

          liderProjeto: projetoDetalhado.responsavel,

          unidadeResponsavel: projetoDetalhado.unidade,

          descricao: projetoDetalhado.descricao,

          tempoEstimado: projetoDetalhado.tempo_estimado,

          statusExecucao: projetoDetalhado.status_execucao ?? 'ANDAMENTO',
          justificativaDescontinuacao: projetoDetalhado.justificativa_descontinuacao ?? '',
          percentualProgresso: projetoDetalhado.percentual_progresso,

          objetivos: this.normalizarIds(projetoDetalhado.objetivos ?? []),
        });

        this.etapaAtual = 1;
        this.changeDetector.markForCheck();
        const modal = document.getElementById('modalProjeto');
        if (modal) (window as any).bootstrap?.Modal.getOrCreateInstance(modal).show();
      },
      error: (erro) => {
        console.error('Erro ao carregar projeto rejeitado:', erro);

        window.alert('Não foi possível carregar o projeto para edição.');
      },
    });
  }

  reenviarProjetoRejeitado(): void {
    if (!this.projetoSelecionadoId) {
      return;
    }

    if (this.formularioProjeto.invalid) {
      this.formularioProjeto.markAllAsTouched();

      window.alert('Preencha corretamente os campos obrigatórios.');

      return;
    }

    const formulario = this.formularioProjeto.getRawValue();

    const dadosAtualizacao = {
      nome: formulario.tituloProjeto,

      descricao: formulario.descricao,

      tempo_estimado: formulario.tempoEstimado,

      status_execucao: formulario.statusExecucao,
      justificativa_descontinuacao:
        formulario.statusExecucao === 'DESCONTINUADO'
          ? String(formulario.justificativaDescontinuacao ?? '').trim()
          : '',
      percentual_progresso: Number(formulario.percentualProgresso ?? 0),

      responsavel: formulario.liderProjeto || null,

      unidade: formulario.unidadeResponsavel,

      objetivos: formulario.objetivos ?? [],

      evolucoes: this.montarEvolucoes(),

      acoes: this.montarAcoesProjeto(),

      status: 'EM_ESPERA',
    };

    const envio = this.projetoService.atualizarProjeto(this.projetoSelecionadoId, dadosAtualizacao);

    envio.subscribe({
      next: () => {
        window.alert('Projeto reenviado para análise com sucesso.');

        this.editandoProjetoRejeitado = false;
        this.projetoSelecionadoId = null;

        this.fecharModal();
        this.salvo.emit();

        this.formularioProjeto.reset();
        this.limparEvolucoesProjeto();

        this.etapaAtual = 1;
      },

      error: (erro) => {
        console.error('Erro ao reenviar projeto:', erro);

        window.alert('Não foi possível reenviar o projeto.');
      },
    });
  }

  cancelarEdicaoProjetoRejeitado(): void {
    this.editandoProjetoRejeitado = false;

    this.projetoSelecionadoId = null;
    this.formularioProjeto.reset();
    this.formularioProjeto.enable();
    this.limparEvolucoesProjeto();
    this.etapaAtual = 1;
    this.fecharModal();
  }

  abrirEdicaoPeloModal(projeto: ProjetoEstrategico): void {
    this.editandoProjetoRejeitado = false;

    if (projeto.status === 'REJEITADO' && !this.isAdmin()) {
      this.editarProjetoRejeitado(projeto);
      return;
    }

    this.visualizando = true;

    this.projetoService.getById(projeto.id).subscribe({
      next: (projetoDetalhado) => {
        this.projetoSelecionadoId = projetoDetalhado.id;

        this.formularioProjeto.patchValue({
          tituloProjeto: projetoDetalhado.nome,

          liderProjeto: projetoDetalhado.responsavel,

          unidadeResponsavel: projetoDetalhado.unidade,

          descricao: projetoDetalhado.descricao,

          tempoEstimado: projetoDetalhado.tempo_estimado,

          statusExecucao: projetoDetalhado.status_execucao ?? 'ANDAMENTO',
          justificativaDescontinuacao: projetoDetalhado.justificativa_descontinuacao ?? '',
          percentualProgresso: projetoDetalhado.percentual_progresso,

          objetivos: this.normalizarIds(projetoDetalhado.objetivos ?? []),
        });

        this.carregarEvolucoesProjeto(projetoDetalhado);

        this.etapaAtual = 2;

        this.editarProjeto();
        this.changeDetector.markForCheck();
        const modal = document.getElementById('modalProjeto');
        if (modal) (window as any).bootstrap?.Modal.getOrCreateInstance(modal).show();
      },

      error: (erro) => {
        console.error('Erro ao carregar projeto para edição:', erro);
      },
    });
  }

  editarProjeto(): void {
    this.acoesAntesDaEdicao = this.acoesProjeto().map((acao) => ({ ...acao }));
    this.realizacoesAntesDaEdicao = [...this.realizacoesConcluidas()];

    this.proximosPassosAntesDaEdicao = [...this.proximosPassos()];

    this.dadosFormularioAntesDaEdicao = this.formularioProjeto.getRawValue();

    this.modoEdicaoProjeto = true;

    const papel = this.usuarioAtual()?.papel;

    if (papel === 'ADMIN') {
      // ADMIN pode editar tudo
      this.formularioProjeto.enable();
      this.etapaAtual = 1;
    } else {
      // SERVIDOR: primeiro bloqueia tudo
      this.formularioProjeto.disable();

      // Depois libera somente os campos
      // relacionados à atualização do projeto
      this.formularioProjeto.get('percentualProgresso')?.enable();
      this.formularioProjeto.get('statusExecucao')?.enable();
      this.formularioProjeto.get('justificativaDescontinuacao')?.enable();

      if (papel === 'GESTOR') {
        this.formularioProjeto.get('liderProjeto')?.enable();
        this.etapaAtual = 1;
      } else {
        this.etapaAtual = 2;
      }
    }
  }

  salvarResponsavelProjeto(): void {
    if (this.usuarioAtual()?.papel !== 'GESTOR' || !this.projetoSelecionadoId) {
      return;
    }

    const responsavel = this.formularioProjeto.get('liderProjeto')?.value;

    this.projetoService.atualizarProjeto(this.projetoSelecionadoId, { responsavel }).subscribe({
      next: () => {
        window.alert('Responsável alterado com sucesso.');
        this.salvo.emit();
      },
      error: (erro) => {
        window.alert(
          erro.error?.responsavel ??
            erro.error?.detail ??
            'Não foi possível alterar o responsável.',
        );
      },
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

  private carregarEvolucoesProjeto(projeto: ProjetoEstrategico): void {
    this.statusRegistroEditado = projeto.status;
    this.acoesProjeto.set((projeto.acoes ?? []).map((acao) => ({ ...acao })));
    const realizacoes = (projeto.evolucoes ?? [])
      .filter((evolucao) => evolucao.tipo === 'REALIZACAO')
      .map((evolucao) => evolucao.descricao.trim());
    const passos = (projeto.evolucoes ?? [])
      .filter((evolucao) => evolucao.tipo === 'PROXIMO_PASSO')
      .map((evolucao) => evolucao.descricao.trim());

    this.realizacoesConcluidas.set(realizacoes);
    this.proximosPassos.set(passos);
  }

  salvarProjeto(status: 'EM_ESPERA' | 'APROVADO'): void {
    if (this.formularioProjeto.invalid) {
      this.formularioProjeto.markAllAsTouched();
      return;
    }

    const formulario = this.formularioProjeto.getRawValue();

    if (formulario.liderProjeto) {
      const responsavel = this.usuarios().find(
        (usuario) => usuario.id === Number(formulario.liderProjeto),
      );

      if (!responsavel?.unidade) {
        window.alert('O responsável não possui uma unidade vinculada.');

        return;
      }

      const unidadeIdResponsavel = this.obterIdUnidadeUsuario(responsavel);

      if (unidadeIdResponsavel !== Number(formulario.unidadeResponsavel)) {
        window.alert('O responsável não pertence à unidade selecionada.');

        return;
      }
    }

    const projeto = {
      nome: formulario.tituloProjeto,
      descricao: formulario.descricao,
      tempo_estimado: formulario.tempoEstimado,
      status_execucao: formulario.statusExecucao,
      justificativa_descontinuacao:
        formulario.statusExecucao === 'DESCONTINUADO'
          ? String(formulario.justificativaDescontinuacao ?? '').trim()
          : '',
      percentual_progresso: Number(formulario.percentualProgresso ?? 0),
      acoes: this.montarAcoesProjeto(),
      status: status,
      responsavel: formulario.liderProjeto || null,
      unidade: formulario.unidadeResponsavel,
      objetivos: formulario.objetivos ?? [],
      evolucoes: this.montarEvolucoes(),
    };

    const operacao = this.projetoService.CriarProjeto(projeto);
    operacao.subscribe({
      next: (projetoCriado) => {
        this.limparEvolucoesProjeto();
        this.projetoSelecionadoId = null;

        this.dadosFormularioAntesDaEdicao = null;
        this.modoEdicaoProjeto = false;
        this.fecharModal();
        this.salvo.emit();
        this.formularioProjeto.reset();
        this.etapaAtual = 1;
      },
      error: (erro) => {
        console.error('erro ao criar projeto:', erro.error);
        window.alert(
          erro.error?.detail ??
            'Não foi possível salvar o projeto. Verifique os campos e tente novamente.',
        );
      },
    });
  }

  criarNovoProjeto(): void {
    this.editandoProjetoRejeitado = false;

    this.visualizando = false;
    this.modoEdicaoProjeto = false;
    this.projetoSelecionadoId = null;
    this.formularioProjeto.enable();
    this.formularioProjeto.reset({
      tituloProjeto: '',
      liderProjeto: '',
      unidadeResponsavel: '',
      descricao: '',
      tempoEstimado: '',
      statusExecucao: 'ANDAMENTO',
      justificativaDescontinuacao: '',
      percentualProgresso: 0,
      objetivos: [],
    });
    this.limparEvolucoesProjeto();
    this.dadosFormularioAntesDaEdicao = null;
    this.etapaAtual = 1;
  }

  private limparEvolucoesProjeto(): void {
    this.realizacoesConcluidas.set([]);
    this.proximosPassos.set([]);
    this.realizacoesAntesDaEdicao = [];
    this.proximosPassosAntesDaEdicao = [];
    this.acoesProjeto.set([]);
    this.acoesAntesDaEdicao = [];
    this.fecharSubmodalAcao();
  }

  fecharFormulario(): void {
    this.fecharSubmodalAcao();

    this.visualizando = false;
    this.modoEdicaoProjeto = false;
    this.projetoSelecionadoId = null;
    this.formularioProjeto.enable();
  }

  fecharModal(): void {
    const modal = document.getElementById('modalProjeto');
    if (!modal) return;

    (window as any).bootstrap?.Modal.getOrCreateInstance(modal).hide();
  }

  irParaEtapa(numeroEtapa: number): void {
    if (numeroEtapa === this.etapaAtual) return;
    if (numeroEtapa < 1 || numeroEtapa > 3) return;

    if (!this.visualizando && this.etapaAtual === 1 && numeroEtapa > 1) {
      this.validarEtapaUm();
    }

    this.etapaAtual = numeroEtapa;
  }

  avancar(): void {
    if (this.etapaAtual >= 3) return;

    if (!this.visualizando && this.etapaAtual === 1) {
      this.validarEtapaUm();
    }

    this.etapaAtual++;
  }

  voltar(): void {
    if (this.etapaAtual > 1) this.etapaAtual--;
  }

  private validarEtapaUm(): boolean {
    const titulo = this.formularioProjeto.get('tituloProjeto');
    const lider = this.formularioProjeto.get('liderProjeto');
    const unidade = this.formularioProjeto.get('unidadeResponsavel');

    if (titulo?.invalid) titulo.markAsTouched();
    if (lider?.invalid) lider.markAsTouched();
    if (unidade?.invalid) unidade.markAsTouched();

    return !titulo?.invalid && !lider?.invalid && !unidade?.invalid;
  }

  buscarUsuarios(): void {
    this.usuarioService.getResponsaveis().subscribe({
      next: (usuarios) => {
        this.usuarios.set(usuarios);
      },

      error: (erro) => {
        console.error('Erro ao buscar responsáveis:', erro);
      },
    });
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

  selecionarObjetivo(objetivo: ObjetivoEstrategico, evento: Event): void {
    if (this.visualizando && (!this.modoEdicaoProjeto || !this.isAdmin())) {
      return;
    }

    const checkbox = evento.target as HTMLInputElement;
    const selecionados = this.normalizarIds(this.formularioProjeto.get('objetivos')?.value || []);
    const novos = checkbox.checked
      ? [...selecionados, objetivo.id]
      : selecionados.filter((id: number) => id !== objetivo.id);

    this.formularioProjeto.patchValue({ objetivos: novos });
    this.formularioProjeto.get('objetivos')?.markAsTouched();
  }

  objetivoEstaSelecionado(objetivo: ObjetivoEstrategico): boolean {
    return this.normalizarIds(this.formularioProjeto.get('objetivos')?.value || []).includes(
      objetivo.id,
    );
  }

  adicionarRealizacaoDireta(): void {
    if (this.visualizando && !this.modoEdicaoProjeto) {
      return;
    }
    const texto = window.prompt('Digite a realização concluída:');
    if (!texto || !texto.trim()) {
      return;
    }

    this.realizacoesConcluidas.update((lista) => [...lista, texto.trim()]);
  }

  adicionarProximoPasso(): void {
    if (this.visualizando && !this.modoEdicaoProjeto) {
      return;
    }
    const texto = window.prompt('Digite um proximo passo:');

    if (!texto || !texto.trim()) {
      return;
    }
    this.proximosPassos.update((lista) => [...lista, texto.trim()]);
  }

  concluirProximoPasso(indice: number): void {
    if (!this.modoEdicaoProjeto) {
      return;
    }
    const passo = this.proximosPassos()[indice];
    if (!passo) {
      return;
    }

    this.proximosPassos.update((lista) => lista.filter((_, i) => i !== indice));
    this.realizacoesConcluidas.update((lista) => [...lista, passo]);
  }

  removerRealizacao(indice: number): void {
    if (this.visualizando && !this.modoEdicaoProjeto) {
      return;
    }
    this.realizacoesConcluidas.update((lista) => lista.filter((_, i) => i !== indice));
  }

  removerProximoPasso(indice: number): void {
    if (this.visualizando && !this.modoEdicaoProjeto) {
      return;
    }

    this.proximosPassos.update((lista) => lista.filter((_, i) => i !== indice));
  }

  voltarRealizacaoParaProximoPasso(indice: number): void {
    if (!this.modoEdicaoProjeto) {
      return;
    }
    const realizacao = this.realizacoesConcluidas()[indice];

    if (!realizacao) {
      return;
    }

    this.realizacoesConcluidas.update((lista) => lista.filter((_, i) => i !== indice));
    this.proximosPassos.update((lista) => [...lista, realizacao]);
  }

  cancelarEdicaoProjeto(): void {
    this.acoesProjeto.set(this.acoesAntesDaEdicao.map((acao) => ({ ...acao })));
    this.fecharSubmodalAcao();
    this.realizacoesConcluidas.set([...this.realizacoesAntesDaEdicao]);
    this.proximosPassos.set([...this.proximosPassosAntesDaEdicao]);

    if (this.dadosFormularioAntesDaEdicao) {
      this.formularioProjeto.patchValue(this.dadosFormularioAntesDaEdicao);
    }

    this.formularioProjeto.disable();
    this.modoEdicaoProjeto = false;
    this.dadosFormularioAntesDaEdicao = null;
  }

  private montarEvolucoes(): Array<{ descricao: string; tipo: 'REALIZACAO' | 'PROXIMO_PASSO' }> {
    const realizacoes = this.realizacoesConcluidas()
      .filter((valor) => !!valor?.trim())
      .map((valor) => ({ descricao: valor.trim(), tipo: 'REALIZACAO' as const }));

    const proximos = this.proximosPassos()
      .filter((valor) => !!valor?.trim())
      .map((valor) => ({ descricao: valor.trim(), tipo: 'PROXIMO_PASSO' as const }));

    return [...realizacoes, ...proximos];
  }

  confirmarEdicaoProjeto(): void {
    if (!this.projetoSelecionadoId) {
      return;
    }

    if (this.formularioProjeto.invalid) {
      this.formularioProjeto.markAllAsTouched();
      window.alert('Preencha corretamente os campos obrigatórios.');
      return;
    }
    const formulario = this.formularioProjeto.getRawValue();

    const dadosAtualizacao = {
      ...(this.isAdmin()
        ? {
            nome: formulario.tituloProjeto,
            descricao: formulario.descricao,
            tempo_estimado: formulario.tempoEstimado,
            responsavel: formulario.liderProjeto || null,
            unidade: formulario.unidadeResponsavel,
            objetivos: formulario.objetivos ?? [],
          }
        : {}),
      status_execucao: formulario.statusExecucao,
      justificativa_descontinuacao:
        formulario.statusExecucao === 'DESCONTINUADO'
          ? String(formulario.justificativaDescontinuacao ?? '').trim()
          : '',
      percentual_progresso: Number(this.formularioProjeto.get('percentualProgresso')?.value ?? 0),

      evolucoes: this.montarEvolucoes(),

      acoes: this.montarAcoesProjeto(),
    };

    const envio = this.isAdmin()
      ? this.projetoService.atualizarProjeto(this.projetoSelecionadoId, dadosAtualizacao)
      : this.projetoService.submeterAtualizacao(this.projetoSelecionadoId, dadosAtualizacao);

    envio.subscribe({
      next: () => {
        if (this.isAdmin()) {
          window.alert('Projeto atualizado com sucesso.');
        } else {
          window.alert('Atualizações enviadas para análise com sucesso.');
        }

        this.modoEdicaoProjeto = false;
        this.fecharModal();
        this.salvo.emit();
      },

      error: (erro) => {
        window.alert(
          'Não foi possível salvar a atualização. ' +
            JSON.stringify(erro.error ?? 'Tente novamente.'),
        );
      },
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

  obterUnidadeUsuario(usuario: Usuario): Unidade | undefined {
    const unidadeId = this.obterIdUnidadeUsuario(usuario);

    if (unidadeId === null) {
      return undefined;
    }

    return this.unidades().find((unidade) => unidade.id === unidadeId);
  }

  aoSelecionarUnidade(): void {
    const responsavel = this.obterResponsavelSelecionado();
    if (!responsavel) {
      return;
    }

    const unidadeSelecionada = Number(this.formularioProjeto.get('unidadeResponsavel')?.value);
    const unidadeResponsavel = this.obterIdUnidadeUsuario(responsavel);

    if (unidadeResponsavel !== unidadeSelecionada) {
      this.formularioProjeto.patchValue({ liderProjeto: '' });
    }
  }

  obterResponsavelSelecionado(): Usuario | null {
    const id = Number(this.formularioProjeto.get('liderProjeto')?.value);

    return this.usuarios().find((usuario) => usuario.id === id) ?? null;
  }

  obterSiglaUnidadeUsuario(usuario: Usuario): string {
    return this.obterUnidadeUsuario(usuario)?.sigla ?? '';
  }

  validarPercentualProgresso(evento: Event): void {
    const input = evento.target as HTMLInputElement;

    let valor = Number(input.value);

    if (Number.isNaN(valor)) {
      valor = 0;
    }

    valor = Math.max(0, Math.min(100, valor));

    this.formularioProjeto.patchValue({
      percentualProgresso: valor,
    });

    input.value = String(valor);
  }

  responsaveisDisponiveis(): Usuario[] {
    const unidadeId = Number(this.formularioProjeto.get('unidadeResponsavel')?.value);

    if (!unidadeId) {
      return [];
    }

    return this.usuarios().filter((usuario) => this.obterIdUnidadeUsuario(usuario) === unidadeId);
  }

  unidadesDisponiveisProjeto(): Unidade[] {
    const usuario = this.usuarioAtual();
    if (!usuario) {
      return [];
    }
    if (usuario.papel === 'ADMIN') {
      return this.unidades();
    }
    const unidadeId = this.obterIdUnidadeUsuario(usuario);

    return this.unidades().filter((unidade) => unidade.id === unidadeId);
  }

  totalCustoEstimado(): number {
    return this.acoesProjeto().reduce((total, acao) => total + Number(acao.custo_estimado), 0);
  }

  totalCustoRealizado(): number {
    return this.acoesProjeto().reduce((total, acao) => total + Number(acao.custo_realizado), 0);
  }

  somenteExecucaoAcao(): boolean {
    return (
      !this.isAdmin() &&
      this.projetoSelecionadoId !== null &&
      this.statusRegistroEditado === 'APROVADO'
    );
  }

  acaoExistenteAprovada(): boolean {
    return (
      this.somenteExecucaoAcao() &&
      this.acaoEmEdicaoIndice !== null &&
      this.acoesProjeto()[this.acaoEmEdicaoIndice]?.id !== undefined
    );
  }

  configurarCamposAcao(): void {
    this.formularioAcaoInterno.enable();
    if (this.acaoExistenteAprovada()) {
      for (const campo of ['descricaoAcao', 'prazoInicio', 'prazoFim', 'custoEstimado']) {
        this.formularioAcaoInterno.get(campo)?.disable();
      }
    }
  }

  abrirSubmodalAcao(): void {
    if (this.visualizando && !this.modoEdicaoProjeto) return;
    this.acaoEmEdicaoIndice = null;
    this.formularioAcaoInterno.reset({
      descricaoAcao: '',
      prazoInicio: '',
      prazoFim: '',
      custoEstimado: 0,
      custoRealizado: 0,
      inicioEfetivo: '',
      fimEfetivo: '',
      statusAtual: 'PLANEJAMENTO',
    });
    this.configurarCamposAcao();
    this.submodalAcaoAberto = true;
  }

  fecharSubmodalAcao(): void {
    this.submodalAcaoAberto = false;
    this.acaoEmEdicaoIndice = null;
  }

  editarAcaoProjeto(acao: AcaoProjeto, indice: number): void {
    if (this.visualizando && !this.modoEdicaoProjeto) return;
    this.acaoEmEdicaoIndice = indice;
    this.formularioAcaoInterno.reset({
      descricaoAcao: acao.nome,
      prazoInicio: acao.prazo_inicio,
      prazoFim: acao.prazo_fim,
      custoEstimado: acao.custo_estimado,
      custoRealizado: acao.custo_realizado,
      inicioEfetivo: acao.data_inicio_efetivo ?? '',
      fimEfetivo: acao.data_fim_efetivo ?? '',
      statusAtual: acao.status,
    });
    this.configurarCamposAcao();
    this.submodalAcaoAberto = true;
  }

  adicionarAcaoProjeto(): void {
    if (this.visualizando && !this.modoEdicaoProjeto) return;
    if (this.formularioAcaoInterno.invalid) {
      this.formularioAcaoInterno.markAllAsTouched();
      return;
    }
    const dados = this.formularioAcaoInterno.getRawValue();
    const erroStatus = validarStatusAcao(dados.statusAtual, dados.inicioEfetivo, dados.fimEfetivo);
    if (erroStatus) {
      window.alert(erroStatus);
      return;
    }
    if (!dados.descricaoAcao.trim()) {
      window.alert('Informe a descrição da ação.');
      return;
    }
    if (
      dados.prazoFim < dados.prazoInicio ||
      (dados.inicioEfetivo && dados.fimEfetivo && dados.fimEfetivo < dados.inicioEfetivo)
    ) {
      window.alert('A data de fim não pode ser anterior à data de início.');
      return;
    }
    const acao: AcaoProjeto = {
      nome: dados.descricaoAcao.trim(),
      prazo_inicio: dados.prazoInicio,
      prazo_fim: dados.prazoFim,
      custo_estimado: Number(dados.custoEstimado),
      custo_realizado: Number(dados.custoRealizado),
      data_inicio_efetivo: dados.inicioEfetivo || null,
      data_fim_efetivo: dados.fimEfetivo || null,
      status: dados.statusAtual,
    };
    this.acoesProjeto.update((lista) =>
      this.acaoEmEdicaoIndice === null
        ? [...lista, acao]
        : lista.map((item, indice) =>
            indice === this.acaoEmEdicaoIndice
              ? this.acaoExistenteAprovada()
                ? {
                    ...item,
                    custo_realizado: acao.custo_realizado,
                    data_inicio_efetivo: acao.data_inicio_efetivo,
                    data_fim_efetivo: acao.data_fim_efetivo,
                    status: acao.status,
                  }
                : { ...acao, id: item.id }
              : item,
          ),
    );
    this.fecharSubmodalAcao();
  }

  removerAcaoProjeto(indice: number): void {
    if (this.somenteExecucaoAcao() && this.acoesProjeto()[indice]?.id !== undefined) return;
    if (this.visualizando && !this.modoEdicaoProjeto) return;
    this.acoesProjeto.update((lista) => lista.filter((_, i) => i !== indice));
  }

  private montarAcoesProjeto(): Omit<AcaoProjeto, 'id'>[] {
    return this.acoesProjeto().map(({ id, ...acao }) => ({
      ...acao,
      custo_estimado: Number(acao.custo_estimado),
      custo_realizado: Number(acao.custo_realizado),
    }));
  }

  rotuloStatusAcao(status: string): string {
    return (
      (
        {
          PLANEJAMENTO: 'Não iniciada',
          ANDAMENTO: 'Em execução',
          CONCLUIDA: 'Concluída',
          CANCELADA: 'Cancelada',
        } as Record<string, string>
      )[status] ?? status
    );
  }

  readonly salvo = output<void>();
}
