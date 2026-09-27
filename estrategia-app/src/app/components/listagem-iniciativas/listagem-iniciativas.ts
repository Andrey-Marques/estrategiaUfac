import { Component, inject, signal } from '@angular/core';
import { IniciativaEstrategica } from '../../model/iniciativaEstrategica';
import { IniciativaService } from '../../service/iniciativa.service';
import { CommonModule, NgForOf } from '@angular/common';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ObjetivoService } from '../../service/objetivo.service';
import { ObjetivoEstrategico } from '../../model/objetivoEstrategico';
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

export interface AcaoIniciativa {
  descricaoAcao: string;
  prazoInicio: string;
  prazoFim: string;
  custoEstimado: string;
  statusAtual: string;
}

@Component({
  selector: 'app-listagem-iniciativas',
  imports: [NgForOf, DatePipe, CommonModule, ReactiveFormsModule, AvaliacaoIniciativa],
  templateUrl: './listagem-iniciativas.html',
  styleUrl: './listagem-iniciativas.scss',
  providers: [DatePipe],
})
export class ListagemIniciativas {
  iniciativas = signal<IniciativaEstrategica[]>([]);
  isAdmin = signal(false);
  usuarioAtual = signal<Usuario | null>(null);
  private datePipe = inject(DatePipe);

  // variaveis para modal de criar iniciativa
  usuarios = signal<Usuario[]>([]);
  unidades = signal<Unidade[]>([]);
  objetivos = signal<ObjetivoEstrategico[]>([]);
  acoesIniciativa = signal<AcaoIniciativa[]>([]);
  formularioIniciativa: FormGroup;
  formularioAcaoInterno: FormGroup;
  etapaAtual = 1;
  submodalAcaoAberto = false;
  visualizando = false;
  objetivosSelecionados: number[] = [];
  //----------------------------
  iniciativaEmAnalise = signal<IniciativaEstrategica | null>(null);
  revisoes = signal<RevisaoEdicao[]>([]);
  revisaoEmAnalise = signal<RevisaoEdicao | null>(null);
  modoEdicao = false;
  editandoIniciativaRejeitada = false;
  iniciativaSelecionadaId: number | null = null;
  acaoEmEdicaoIndice: number | null = null;
  filtroStatus = signal<string>('TODOS');
  termoPesquisa = signal<string>('');
  unidadesSelecionadas = signal<number[]>([]);
  menuUnidadesAberto = signal(false);

  constructor(
    private iniciativaService: IniciativaService,
    private usuarioService: UsuarioService,
    private unidadeService: UnidadeService,
    private objetivoService: ObjetivoService,
    private construtorFormulario: FormBuilder,
    private revisaoService: RevisaoService,
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
      custoEstimado: ['', Validators.required],
      statusAtual: ['nao-iniciada', Validators.required],
    });
  }

  ngOnInit(): void {
    this.buscarIniciativa();
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
        this.buscarRevisoes();

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

    const unidadeId = Number(
      this.formularioIniciativa.get('unidadeResponsavel') ?.value
    );

    if (!unidadeId) {
      return [];
    }

    return this.usuarios().filter(usuario => {

      const unidadeUsuario =
        typeof usuario.unidade === 'number'
          ? usuario.unidade
          : usuario.unidade?.id;

      return unidadeUsuario === unidadeId;
    });
  }

  buscarIniciativa(): void {
    this.iniciativaService.get().subscribe({
      next: (iniciativa) => {
        this.iniciativas.set(iniciativa);
        console.log(iniciativa);
      },
      error: (erro) => {
        console.error('erro ao buscar iniciativas:', erro);
      },
    });
  }

  alterarFiltroStatus(status: string): void {
    this.filtroStatus.set(status);
  }

  pesquisarIniciativa(evento: Event): void {
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

  CriarNovaIniciativa(): void {
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

    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    modal.style.display = 'none';

    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) backdrop.remove();

    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('padding-right');
  }

  //--------logica para o modal------------

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
        status: this.converterStatusParaApi(acao.statusAtual),
      })),
    };

    this.iniciativaService.criarIniciativa(dados).subscribe({
      next: (resposta) => {
        console.log('Iniciativa criada', resposta);
        this.fecharFormulario();
        this.fecharModal();
        this.buscarIniciativa();
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

  abrirSubmodalAcao(): void {
    this.acaoEmEdicaoIndice = null;
    this.formularioAcaoInterno.reset({
      descricaoAcao: '',
      prazoInicio: '',
      prazoFim: '',
      custoEstimado: '',
      statusAtual: 'nao-iniciada',
    });
    this.submodalAcaoAberto = true;
  }
  fecharSubmodalAcao(): void {
    this.submodalAcaoAberto = false;
    this.acaoEmEdicaoIndice = null;
    this.formularioAcaoInterno.reset({
      descricaoAcao: '',
      prazoInicio: '',
      prazoFim: '',
      custoEstimado: '',
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

    if (this.acaoEmEdicaoIndice !== null) {
      this.acoesIniciativa.update((lista) => {
        const novaLista = [...lista];
        novaLista[this.acaoEmEdicaoIndice!] = dadosAcao;
        return novaLista;
      });
    } else {
      this.acoesIniciativa.update((lista) => [...lista, dadosAcao]);
    }
    this.acaoEmEdicaoIndice = null;
    this.fecharSubmodalAcao();
  }

  removerAcaoIniciativa(indiceAcao: number): void {
    this.acoesIniciativa.update((lista) => lista.filter((_, i) => i !== indiceAcao));
  }

  aoSelecionarUnidade(): void {
    if (!this.isAdmin()) {
      return;
    }

    const unidadeId = Number(this.formularioIniciativa.get('unidadeResponsavel') ?.value);

    const responsavelId = this.formularioIniciativa.get('responsavelPreenchimento')  ?.value;

    if (!responsavelId) {
      return;
    }

    const responsavel = this.usuarios().find(usuario => Number(usuario.id) === Number(responsavelId));

    if (!responsavel) {
      return;
    }

    const unidadeResponsavel =
      typeof responsavel.unidade === 'number'
        ? responsavel.unidade
        : responsavel.unidade?.id;

    if (unidadeResponsavel !== unidadeId) {

      this.formularioIniciativa.patchValue({
        responsavelPreenchimento: null
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
   this.formularioIniciativa.get('responsavelPreenchimento') ?.valueChanges.subscribe((responsavelId) => {

      if (this.isAdmin()) {
        return;
      }

      if (!responsavelId) {
        return;
      }

      const responsavel = this.usuarios().find(
        usuario => Number(usuario.id) === Number(responsavelId)
      );

      if (!responsavel) {
        return;
      }

      const unidadeId = typeof responsavel.unidade === 'number' ? responsavel.unidade : responsavel.unidade?.id;

      this.formularioIniciativa.patchValue(
        {
          unidadeResponsavel: unidadeId ?? null
        },
        {
          emitEvent: false
        }
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
      window.alert(
        'Selecione um responsável pela iniciativa.'
      );
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
    this.revisaoService
      .listar()
      .subscribe({
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

  carregarIniciativaFormulario(dados: IniciativaEstrategica): void {
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
        descricaoAcao: acao.nome,
        prazoInicio: acao.prazo_inicio,
        prazoFim: acao.prazo_fim,
        custoEstimado: String(acao.custo),
        statusAtual: this.converterStatusParaFormulario(acao.status),
      })),
    );
  }

  abrirEdicaoPeloModal(iniciativa: IniciativaEstrategica): void {
    this.fecharAvaliacao();
    this.editandoIniciativaRejeitada = false;
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

        if (dados.status === 'REJEITADO') {
          this.editandoIniciativaRejeitada = true;
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
    if (
      this.usuarioAtual()?.papel !== 'GESTOR' ||
      !this.iniciativaSelecionadaId
    ) {
      return;
    }

    const responsavel = this.formularioIniciativa
      .get('responsavelPreenchimento')?.value;

    this.iniciativaService
      .atualizarIniciativa(this.iniciativaSelecionadaId, { responsavel })
      .subscribe({
        next: () => {
          window.alert('Responsável alterado com sucesso.');
          this.buscarIniciativa();
        },
        error: erro => {
          window.alert(
            erro.error?.detail ??
            'Não foi possível alterar o responsável.'
          );
        },
      });
  }

  montarAcoesApi() {
    return this.acoesIniciativa().map((acao) => ({
      nome: acao.descricaoAcao,
      prazo_inicio: this.converterDataParaApi(acao.prazoInicio),
      prazo_fim: this.converterDataParaApi(acao.prazoFim),
      custo: acao.custoEstimado,
      status: this.converterStatusParaApi(acao.statusAtual),
    }));
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

  salvarEdicaoIniciativa(): void {
    if (!this.iniciativaSelecionadaId) {
      return;
    }
    const formulario = this.formularioIniciativa.getRawValue();

    let dados: any;

    if (this.isAdmin() || this.editandoIniciativaRejeitada) {
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

    const operacao =
      this.isAdmin() || this.editandoIniciativaRejeitada
        ? this.iniciativaService.atualizarIniciativa(this.iniciativaSelecionadaId, dados)
        : this.iniciativaService.submeterAtualizacao(this.iniciativaSelecionadaId, dados);

    operacao.subscribe({
      next: () => {
        this.fecharModal();
        this.buscarIniciativa();
        this.modoEdicao = false;
        this.editandoIniciativaRejeitada = false;
        this.iniciativaSelecionadaId = null;
      },
      error: (erro) => console.error('Erro ao atualizar iniciativa:', erro),
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
      statusAtual: acao.statusAtual,
    });
    this.submodalAcaoAberto = true;
  }
}
