import { validarStatusAcao } from '../../../model/validacao-status-acao';
import { MascaraReais } from '../../../directives/mascara-reais';
import { Component, signal, output } from '@angular/core';
import { IniciativaEstrategica } from '../../../model/iniciativaEstrategica';
import { IniciativaService } from '../../../service/iniciativa.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ObjetivoService } from '../../../service/objetivo.service';
import { ObjetivoEstrategico } from '../../../model/objetivoEstrategico';
import { UsuarioService } from '../../../service/usuario.service';
import { Usuario } from '../../../model/usuario';
import { UnidadeService } from '../../../service/unidade.service';
import { Unidade } from '../../../model/unidade';

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
  selector: 'app-formulario-iniciativas',
  imports: [CommonModule, ReactiveFormsModule, MascaraReais],
  templateUrl: './formulario-iniciativas.html',
  styleUrl: './formulario-iniciativas.scss',
  host: { class: 'formulario-estrategico' },
})
export class FormularioIniciativas {
  constructor(
    private iniciativaService: IniciativaService,
    private usuarioService: UsuarioService,
    private unidadeService: UnidadeService,
    private objetivoService: ObjetivoService,
    private construtorFormulario: FormBuilder,
  ) {
    this.formularioIniciativa = this.construtorFormulario.group({
      tituloIniciativa: ['', Validators.required],
      responsavelPreenchimento: [null, Validators.required],
      unidadeResponsavel: [null, Validators.required],
      objetivosEstrategicos: [[], Validators.required],
      evolucaoPercentual: [50, [Validators.required, Validators.min(0), Validators.max(100)]],
      observacoes: [''],
    });

    this.formularioAcaoInterno = this.construtorFormulario.group({
      descricaoAcao: ['', Validators.required],
      prazoInicio: ['', Validators.required],
      prazoFim: ['', Validators.required],
      custoEstimado: [0, [Validators.required, Validators.min(0)]],
      custoRealizado: [0, [Validators.required, Validators.min(0)]],
      inicioEfetivo: [''],
      fimEfetivo: [''],
      statusAtual: ['nao-iniciada', Validators.required],
    });
  }

  isAdmin = signal(false);

  usuarioAtual = signal<Usuario | null>(null);

  usuarios = signal<Usuario[]>([]);

  unidades = signal<Unidade[]>([]);

  objetivos = signal<ObjetivoEstrategico[]>([]);

  acoesIniciativa = signal<AcaoIniciativa[]>([]);

  formularioIniciativa: FormGroup;

  formularioAcaoInterno: FormGroup;

  etapaAtual = 1;

  submodalAcaoAberto = false;

  visualizando = false;

  modoEdicao = false;

  editandoIniciativaRejeitada = false;

  editandoRascunho = false;

  iniciativaSelecionadaId: number | null = null;

  statusRegistroEditado = '';

  acaoEmEdicaoIndice: number | null = null;

  ngOnInit(): void {
    this.buscarUsuarioAtual();
    this.buscarUsuarios();
    this.buscarUnidade();
    this.buscarObjetivosEstrategicos();
    this.observarResponsavelSelecionado();
  }

  buscarUsuarioAtual(): void {
    this.usuarioService.getAtual().subscribe({
      next: (usuario) => {
        this.usuarioAtual.set(usuario);
        this.isAdmin.set(usuario.papel === 'ADMIN');

        const campoResponsavel = this.formularioIniciativa.get('responsavelPreenchimento');

        if (usuario.papel === 'ADMIN') {
          campoResponsavel?.clearValidators();
        } else {
          campoResponsavel?.setValidators(Validators.required);
        }

        campoResponsavel?.updateValueAndValidity();
      },
      error: (erro) => console.error('Erro ao buscar usuário atual:', erro),
    });
  }

  responsaveisDisponiveis(): Usuario[] {
    const unidadeId = Number(this.formularioIniciativa.get('unidadeResponsavel')?.value);

    if (!unidadeId) {
      return [];
    }

    return this.usuarios().filter((usuario) => {
      const unidadeUsuario =
        typeof usuario.unidade === 'number' ? usuario.unidade : usuario.unidade?.id;

      return unidadeUsuario === unidadeId;
    });
  }

  criarNovaIniciativa(): void {
    this.editandoRascunho = false;
    this.visualizando = false;
    this.modoEdicao = false;
    this.editandoIniciativaRejeitada = false;
    this.iniciativaSelecionadaId = null;
    this.formularioIniciativa.enable();

    const usuario = this.usuarioAtual();
    const unidadeUsuario =
      typeof usuario?.unidade === 'number' ? usuario.unidade : usuario?.unidade?.id;

    this.formularioIniciativa.reset({
      tituloIniciativa: '',
      responsavelPreenchimento: null,
      unidadeResponsavel: this.isAdmin() ? null : unidadeUsuario,
      objetivosEstrategicos: [],
      evolucaoPercentual: 0,
      observacoes: '',
    });

    if (!this.isAdmin()) {
      this.formularioIniciativa.get('unidadeResponsavel')?.disable();
    }
    this.acoesIniciativa.set([]);
    this.etapaAtual = 1;
  }

  fecharFormulario(): void {
    this.editandoRascunho = false;
    this.visualizando = false;
    this.modoEdicao = false;
    this.editandoIniciativaRejeitada = false;
    this.iniciativaSelecionadaId = null;
    this.formularioIniciativa.enable();
    this.acoesIniciativa.set([]);
    this.etapaAtual = 1;
  }

  fecharModal(): void {
    const modal = document.getElementById('exampleModalToggle');
    if (!modal) return;

    (window as any).bootstrap?.Modal.getOrCreateInstance(modal).hide();
  }

  buscarUsuarios(): void {
    this.usuarioService.getResponsaveis().subscribe({
      next: (dados) => this.usuarios.set(dados),
      error: (erro) => console.error('erro ao buscar usuarios', erro),
    });
  }

  buscarUnidade(): void {
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

  salvarIniciativa(statusSolicitado: 'RASCUNHO' | 'EM_ESPERA' | 'APROVADO'): void {
    if (statusSolicitado !== 'RASCUNHO' && !this.validarDadosObrigatorios()) {
      return;
    }
    const formulario = this.formularioIniciativa.getRawValue();
    const dados = {
      nome: formulario.tituloIniciativa,
      responsavel: formulario.responsavelPreenchimento || null,
      unidade: formulario.unidadeResponsavel,
      objetivos: formulario.objetivosEstrategicos,
      percentual_evolucao: formulario.evolucaoPercentual,
      observacao: formulario.observacoes || '',
      status: statusSolicitado,
      acoes: this.acoesIniciativa().map((acao) => ({
        nome: acao.descricaoAcao,
        prazo_inicio: this.converterDataParaApi(acao.prazoInicio),
        prazo_fim: this.converterDataParaApi(acao.prazoFim),
        custo: acao.custoEstimado,
        custo_realizado: acao.custoRealizado,
        data_inicio_efetivo: acao.inicioEfetivo || null,
        data_fim_efetivo: acao.fimEfetivo || null,
        status: this.converterStatusParaApi(acao.statusAtual),
      })),
    };

    this.iniciativaService.criarIniciativa(dados).subscribe({
      next: (resposta) => {
        console.log('Iniciativa criada', resposta);
        this.fecharFormulario();
        this.fecharModal();
        this.salvo.emit();
      },
      error: (erro) => {
        console.error('Erro ao criar iniciativa', erro);
      },
    });
  }

  selecionarObjetivo(objetivo: ObjetivoEstrategico, evento: Event): void {
    if (this.formularioIniciativa.get('objetivosEstrategicos')?.disabled) {
      return;
    }
    const caixaSelecao = evento.target as HTMLInputElement;
    const selecionados = this.formularioIniciativa.get('objetivosEstrategicos')?.value || [];
    const novos = caixaSelecao.checked
      ? [...selecionados, objetivo.id]
      : selecionados.filter((id: number) => id !== objetivo.id);
    this.formularioIniciativa.patchValue({ objetivosEstrategicos: novos });
    this.formularioIniciativa.get('objetivosEstrategicos')?.markAsTouched();
  }

  objetivoEstaSelecionado(objetivo: ObjetivoEstrategico): boolean {
    return (this.formularioIniciativa.get('objetivosEstrategicos')?.value || []).includes(
      objetivo.id,
    );
  }

  somenteExecucaoAcao(): boolean {
    return (
      !this.isAdmin() &&
      this.iniciativaSelecionadaId !== null &&
      this.statusRegistroEditado === 'APROVADO'
    );
  }

  acaoExistenteAprovada(): boolean {
    return (
      this.somenteExecucaoAcao() &&
      this.acaoEmEdicaoIndice !== null &&
      this.acoesIniciativa()[this.acaoEmEdicaoIndice]?.id !== undefined
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
    this.acaoEmEdicaoIndice = null;
    this.formularioAcaoInterno.reset({
      descricaoAcao: '',
      prazoInicio: '',
      prazoFim: '',
      custoEstimado: 0,
      custoRealizado: 0,
      inicioEfetivo: '',
      fimEfetivo: '',
      statusAtual: 'nao-iniciada',
    });
    this.configurarCamposAcao();
    this.submodalAcaoAberto = true;
  }

  fecharSubmodalAcao(): void {
    this.submodalAcaoAberto = false;
    this.acaoEmEdicaoIndice = null;
    this.formularioAcaoInterno.reset({
      descricaoAcao: '',
      prazoInicio: '',
      prazoFim: '',
      custoEstimado: 0,
      custoRealizado: 0,
      inicioEfetivo: '',
      fimEfetivo: '',
      statusAtual: 'nao-iniciada',
    });
  }

  adicionarAcaoIniciativa(): void {
    if (this.formularioAcaoInterno.invalid) {
      this.formularioAcaoInterno.markAllAsTouched();
      alert('Preencha todos os campos da ação.');
      return;
    }

    const dadosAcao = this.formularioAcaoInterno.getRawValue();
    const erroStatus = validarStatusAcao(
      this.converterStatusParaApi(dadosAcao.statusAtual),
      dadosAcao.inicioEfetivo,
      dadosAcao.fimEfetivo,
    );
    if (erroStatus) {
      window.alert(erroStatus);
      return;
    }
    if (
      dadosAcao.prazoFim < dadosAcao.prazoInicio ||
      (dadosAcao.inicioEfetivo &&
        dadosAcao.fimEfetivo &&
        dadosAcao.fimEfetivo < dadosAcao.inicioEfetivo)
    ) {
      window.alert(
        'As datas de fim devem ser iguais ou posteriores às respectivas datas de início.',
      );
      return;
    }

    if (this.acaoEmEdicaoIndice !== null) {
      this.acoesIniciativa.update((lista) => {
        const novaLista = [...lista];
        const anterior = novaLista[this.acaoEmEdicaoIndice!];
        novaLista[this.acaoEmEdicaoIndice!] = this.acaoExistenteAprovada()
          ? {
              ...anterior,
              custoRealizado: dadosAcao.custoRealizado,
              inicioEfetivo: dadosAcao.inicioEfetivo,
              fimEfetivo: dadosAcao.fimEfetivo,
              statusAtual: dadosAcao.statusAtual,
            }
          : { ...dadosAcao, id: anterior.id };
        return novaLista;
      });
    } else {
      this.acoesIniciativa.update((lista) => [...lista, dadosAcao]);
    }
    this.acaoEmEdicaoIndice = null;
    this.fecharSubmodalAcao();
  }

  removerAcaoIniciativa(indiceAcao: number): void {
    if (this.somenteExecucaoAcao() && this.acoesIniciativa()[indiceAcao]?.id !== undefined) return;
    this.acoesIniciativa.update((lista) => lista.filter((_, i) => i !== indiceAcao));
  }

  aoSelecionarUnidade(): void {
    if (!this.isAdmin()) {
      return;
    }

    const unidadeId = Number(this.formularioIniciativa.get('unidadeResponsavel')?.value);

    const responsavelId = this.formularioIniciativa.get('responsavelPreenchimento')?.value;

    if (!responsavelId) {
      return;
    }

    const responsavel = this.usuarios().find(
      (usuario) => Number(usuario.id) === Number(responsavelId),
    );

    if (!responsavel) {
      return;
    }

    const unidadeResponsavel =
      typeof responsavel.unidade === 'number' ? responsavel.unidade : responsavel.unidade?.id;

    if (unidadeResponsavel !== unidadeId) {
      this.formularioIniciativa.patchValue({
        responsavelPreenchimento: null,
      });
    }
  }

  validarEvolucaoPercentual(evento: Event): void {
    const valor = Math.min(100, Math.max(0, Number((evento.target as HTMLInputElement).value)));
    this.formularioIniciativa.patchValue({ evolucaoPercentual: valor });
  }

  private converterDataParaApi(data: string): string {
    const partes = data.split('/');
    return partes.length === 3 ? `${partes[2]}-${partes[1]}-${partes[0]}` : data;
  }

  private converterStatusParaApi(status: string): string {
    const mapa: Record<string, string> = {
      'nao-iniciada': 'PLANEJAMENTO',
      'em-execucao': 'ANDAMENTO',
      concluida: 'CONCLUIDA',
    };
    return mapa[status] || status;
  }

  private converterStatusParaFormulario(status: string): string {
    const mapa: Record<string, string> = {
      PLANEJAMENTO: 'nao-iniciada',
      ANDAMENTO: 'em-execucao',
      CONCLUIDA: 'concluida',
    };
    return mapa[status] || status;
  }

  private observarResponsavelSelecionado(): void {
    this.formularioIniciativa
      .get('responsavelPreenchimento')
      ?.valueChanges.subscribe((responsavelId) => {
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

        const unidadeId =
          typeof responsavel.unidade === 'number' ? responsavel.unidade : responsavel.unidade?.id;

        this.formularioIniciativa.patchValue(
          {
            unidadeResponsavel: unidadeId ?? null,
          },
          {
            emitEvent: false,
          },
        );
      });
  }

  obterRotuloStatus(status: string): string {
    const mapa: Record<string, string> = {
      'nao-iniciada': 'Não iniciada',
      'em-execucao': 'Em execução',
      concluida: 'Concluída',
    };
    return mapa[status] || status;
  }

  irParaEtapa(numeroEtapa: number): void {
    if (numeroEtapa < 1 || numeroEtapa > 3) {
      return;
    }
    this.etapaAtual = numeroEtapa;
  }

  private validarDadosObrigatorios(): boolean {
    const formulario = this.formularioIniciativa.getRawValue();
    if (!formulario.tituloIniciativa?.trim()) {
      window.alert('Informe o título da iniciativa.');
      this.etapaAtual = 1;
      return false;
    }

    if (!this.isAdmin() && !formulario.responsavelPreenchimento) {
      window.alert('Selecione um responsável pela iniciativa.');
      return false;
    }

    if (!formulario.unidadeResponsavel) {
      window.alert('Não foi possível identificar a unidade do responsável.');
      this.etapaAtual = 1;
      return false;
    }

    if (!formulario.objetivosEstrategicos || formulario.objetivosEstrategicos.length === 0) {
      window.alert('Selecione pelo menos um objetivo estratégico.');
      this.etapaAtual = 1;
      return false;
    }
    return true;
  }

  avancar(): void {
    if (this.etapaAtual < 3) {
      this.etapaAtual++;
    }
  }

  voltar(): void {
    if (this.etapaAtual > 1) this.etapaAtual--;
  }

  carregarIniciativaFormulario(dados: IniciativaEstrategica): void {
    this.statusRegistroEditado = dados.status;
    this.formularioIniciativa.enable();

    this.formularioIniciativa.patchValue({
      tituloIniciativa: dados.nome,
      responsavelPreenchimento: dados.responsavel,
      unidadeResponsavel: dados.unidade,
      objetivosEstrategicos: dados.objetivos || [],
      evolucaoPercentual: Number(dados.percentual_evolucao),
      observacoes: dados.observacao || '',
    });

    this.acoesIniciativa.set(
      (dados.acoes_realizadas || []).map((acao) => ({
        id: acao.id,
        descricaoAcao: acao.nome,
        prazoInicio: acao.prazo_inicio,
        prazoFim: acao.prazo_fim,
        custoEstimado: String(acao.custo),
        custoRealizado: acao.custo_realizado ?? 0,
        inicioEfetivo: acao.data_inicio_efetivo ?? '',
        fimEfetivo: acao.data_fim_efetivo ?? '',
        statusAtual: this.converterStatusParaFormulario(acao.status),
      })),
    );
  }

  abrirEdicaoPeloModal(iniciativa: IniciativaEstrategica): void {
    this.editandoIniciativaRejeitada = false;
    this.editandoRascunho = iniciativa.status === 'RASCUNHO';
    this.iniciativaSelecionadaId = iniciativa.id;

    this.iniciativaService.getById(iniciativa.id).subscribe({
      next: (dados) => {
        this.carregarIniciativaFormulario(dados);

        if (this.isAdmin()) {
          this.modoEdicao = true;
          this.visualizando = false;
          this.formularioIniciativa.enable();
          this.etapaAtual = 1;
          return;
        }

        if (dados.status === 'REJEITADO' || dados.status === 'RASCUNHO') {
          this.editandoIniciativaRejeitada = dados.status === 'REJEITADO';
          this.modoEdicao = true;
          this.visualizando = false;
          this.formularioIniciativa.enable();
          this.etapaAtual = 1;
          return;
        }

        this.modoEdicao = true;
        this.visualizando = false;
        this.formularioIniciativa.disable();
        this.formularioIniciativa.get('evolucaoPercentual')?.enable();
        this.formularioIniciativa.get('observacoes')?.enable();
        if (this.usuarioAtual()?.papel === 'GESTOR') {
          this.formularioIniciativa.get('responsavelPreenchimento')?.enable();
          this.etapaAtual = 1;
        } else {
          this.etapaAtual = 2;
        }
      },
      error: (erro) => {
        console.error('Erro ao carregar iniciativa para edição:', erro);
      },
    });
  }

  salvarResponsavelIniciativa(): void {
    if (this.usuarioAtual()?.papel !== 'GESTOR' || !this.iniciativaSelecionadaId) {
      return;
    }

    const responsavel = this.formularioIniciativa.get('responsavelPreenchimento')?.value;

    this.iniciativaService
      .atualizarIniciativa(this.iniciativaSelecionadaId, { responsavel })
      .subscribe({
        next: () => {
          window.alert('Responsável alterado com sucesso.');
          this.salvo.emit();
        },
        error: (erro) => {
          window.alert(erro.error?.detail ?? 'Não foi possível alterar o responsável.');
        },
      });
  }

  montarAcoesApi() {
    return this.acoesIniciativa().map((acao) => ({
      nome: acao.descricaoAcao,
      prazo_inicio: this.converterDataParaApi(acao.prazoInicio),
      prazo_fim: this.converterDataParaApi(acao.prazoFim),
      custo: acao.custoEstimado,
      custo_realizado: acao.custoRealizado,
      data_inicio_efetivo: acao.inicioEfetivo || null,
      data_fim_efetivo: acao.fimEfetivo || null,
      status: this.converterStatusParaApi(acao.statusAtual),
    }));
  }

  salvarEdicaoIniciativa(
    statusSolicitado: 'RASCUNHO' | 'EM_ESPERA' | 'APROVADO' = this.isAdmin()
      ? 'APROVADO'
      : 'EM_ESPERA',
  ): void {
    if (!this.iniciativaSelecionadaId) {
      return;
    }
    if (statusSolicitado !== 'RASCUNHO' && !this.validarDadosObrigatorios()) {
      return;
    }
    const formulario = this.formularioIniciativa.getRawValue();

    let dados: any;

    if (this.isAdmin() || this.editandoIniciativaRejeitada || this.editandoRascunho) {
      dados = {
        nome: formulario.tituloIniciativa,
        responsavel: formulario.responsavelPreenchimento,
        unidade: formulario.unidadeResponsavel,
        objetivos: formulario.objetivosEstrategicos,
        percentual_evolucao: Number(formulario.evolucaoPercentual),
        observacao: formulario.observacoes,
        acoes: this.montarAcoesApi(),
      };
    } else {
      dados = {
        percentual_evolucao: Number(formulario.evolucaoPercentual),
        observacao: formulario.observacoes,
        acoes: this.montarAcoesApi(),
      };
    }

    if (this.editandoRascunho) dados.status = statusSolicitado;

    const operacao =
      this.isAdmin() || this.editandoIniciativaRejeitada || this.editandoRascunho
        ? this.iniciativaService.atualizarIniciativa(this.iniciativaSelecionadaId, dados)
        : this.iniciativaService.submeterAtualizacao(this.iniciativaSelecionadaId, dados);

    operacao.subscribe({
      next: () => {
        this.fecharModal();
        this.salvo.emit();
        this.modoEdicao = false;
        this.editandoIniciativaRejeitada = false;
        this.editandoRascunho = false;
        this.iniciativaSelecionadaId = null;
      },
      error: (erro) =>
        window.alert(
          erro.error?.detail ??
            'Não foi possível salvar a iniciativa. Verifique os campos e tente novamente.',
        ),
    });
  }

  obterSiglaUnidadeUsuario(usuario: Usuario): string {
    if (usuario.unidade && typeof usuario.unidade === 'object') {
      return usuario.unidade.sigla;
    }

    const unidadeId = Number(usuario.unidade);

    const unidade = this.unidades().find((item) => Number(item.id) === unidadeId);

    return unidade?.sigla ?? '';
  }

  editarAcaoIniciativa(acao: AcaoIniciativa, indice: number): void {
    this.acaoEmEdicaoIndice = indice;
    this.formularioAcaoInterno.patchValue({
      descricaoAcao: acao.descricaoAcao,
      prazoInicio: acao.prazoInicio,
      prazoFim: acao.prazoFim,
      custoEstimado: acao.custoEstimado,
      custoRealizado: acao.custoRealizado,
      inicioEfetivo: acao.inicioEfetivo,
      fimEfetivo: acao.fimEfetivo,
      statusAtual: acao.statusAtual,
    });
    this.configurarCamposAcao();
    this.submodalAcaoAberto = true;
  }

  readonly salvo = output<void>();
}
