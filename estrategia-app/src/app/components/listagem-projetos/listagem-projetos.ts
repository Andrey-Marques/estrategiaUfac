import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ObjetivoEstrategico } from '../../model/objetivoEstrategico';
import { AcaoProjeto, ProjetoEstrategico } from '../../model/projetoEstrategico';
import { Unidade } from '../../model/unidade';
import { Usuario } from '../../model/usuario';
import { ObjetivoService } from '../../service/objetivo.service';
import { ProjetoService } from '../../service/projeto.service';
import { UnidadeService } from '../../service/unidade.service';
import { UsuarioService } from '../../service/usuario.service';
import { AvaliacaoProjeto, DecisaoProjeto } from '../avaliacao-projeto/avaliacao-projeto';
import { RevisaoEdicao } from '../../model/revisaoEdicao';
import { RevisaoService } from '../../service/revisao.service';

@Component({
  selector: 'app-listagem-projetos',
  imports: [CommonModule, ReactiveFormsModule, AvaliacaoProjeto],
  templateUrl: './listagem-projetos.html',
  styleUrl: './listagem-projetos.scss',
  providers: [DatePipe],
})
export class ListagemProjetos {
  projetos = signal<ProjetoEstrategico[]>([]);
  acoesProjeto = signal<AcaoProjeto[]>([]);
  readonly custoEstimadoTotal = computed(() =>
    this.acoesProjeto().reduce((total, acao) => total + Number(acao.custo_estimado || 0), 0),
  );
  readonly custoRealizadoTotal = computed(() =>
    this.acoesProjeto().reduce((total, acao) => total + Number(acao.custo_realizado || 0), 0),
  );
  usuarios = signal<Usuario[]>([]);
  unidades = signal<Unidade[]>([]);
  objetivos = signal<ObjetivoEstrategico[]>([]);
  isAdmin = signal(false);
  usuarioAtual = signal<Usuario | null>(null);
  formularioProjeto: FormGroup;
  formularioAcao: FormGroup;
  acaoEmEdicaoIndice: number | null = null;
  etapaAtual = 1;
  visualizando = false;
  modoEdicaoEtapa3 = false;
  editandoProjetoRejeitado = false;
  editandoRascunho = false;
  projetoSelecionadoId: number | null = null;

  filtroStatus = signal<string>('TODOS');
  termoPesquisa = signal<string>('');
  unidadeSelecionadas = signal<number[]>([]);
  menuUnidadesAberto = signal(false);

  realizacoesConcluidas = signal<string[]>([]);
  proximosPassos = signal<string[]>([]);

  realizacoesAntesDaEdicao: string[] = [];
  proximosPassosAntesDaEdicao: string[] = [];
  acoesAntesDaEdicao: AcaoProjeto[] = [];
  dadosFormularioAntesDaEdicao: any = null;

  projetoEmAnalise = signal<ProjetoEstrategico | null>(null);
  revisoes = signal<RevisaoEdicao[]>([]);
  revisaoEmAnalise = signal<RevisaoEdicao | null>(null);

  private datePipe = inject(DatePipe);
  private readonly changeDetector = inject(ChangeDetectorRef);

  constructor(
    private projetoService: ProjetoService,
    private construtorFormulario: FormBuilder,
    private usuarioService: UsuarioService,
    private unidadeService: UnidadeService,
    private objetivoService: ObjetivoService,
    private revisaoService: RevisaoService,
  ) {
    this.formularioProjeto = this.construtorFormulario.group({
      tituloProjeto: ['', Validators.required],
      liderProjeto: ['', Validators.required],
      unidadeResponsavel: ['', Validators.required],
      descricao: [''],
      tempoEstimado: ['', Validators.required],

      percentualProgresso: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      objetivos: [[], Validators.required],
    });
    this.formularioAcao = this.construtorFormulario.group({
      nome: ['', Validators.required],
      prazo_inicio: ['', Validators.required],
      prazo_fim: ['', Validators.required],
      custo_estimado: [0, [Validators.required, Validators.min(0)]],
      custo_realizado: [0, [Validators.required, Validators.min(0)]],
      data_inicio_efetivo: [''],
      data_fim_efetivo: [''],
      status: ['PLANEJAMENTO', Validators.required],
    });
  }

  ngOnInit(): void {
    this.buscarProjeto();
    this.buscarUsuarioAtual();
    this.buscarUsuarios();
    this.buscarUnidades();
    this.buscarObjetivosEstrategicos();
  }

  buscarProjeto(): void {
    this.projetoService.get().subscribe({
      next: (projeto) => this.projetos.set(projeto),
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
        const campoResponsavel = this.formularioProjeto.get('liderProjeto');
        if (usuario.papel !== 'ADMIN') {

          const unidadeId =
            this.obterIdUnidadeUsuario(usuario);

          this.formularioProjeto.patchValue({
            unidadeResponsavel: unidadeId
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

  alterarFiltroStatus(status: string): void {
    this.filtroStatus.set(status);
  }

  pesquisarProjeto(evento: Event): void {
    const input = evento.target as HTMLInputElement;

    this.termoPesquisa.set(input.value.trim().toLowerCase());
  }

  alternarUnidade(unidadeId: number): void {
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

      return atendeStatus && atendePesquisa && atendeUnidade;
    });
  }

  visualizarProjeto(projeto: ProjetoEstrategico): void {
    this.visualizando = true;
    this.modoEdicaoEtapa3 = false;
    this.projetoSelecionadoId = projeto.id;
    this.formularioProjeto.enable();

    this.projetoService.getById(projeto.id).subscribe({
      next: (projetoDetalhado) => {
        this.carregarEvolucoesProjeto(projetoDetalhado);
        this.carregarAcoesProjeto(projetoDetalhado);

        this.formularioProjeto.patchValue({
          tituloProjeto: projetoDetalhado.nome,
          liderProjeto: projetoDetalhado.responsavel,
          unidadeResponsavel: projetoDetalhado.unidade,
          descricao: projetoDetalhado.descricao,
          tempoEstimado: projetoDetalhado.tempo_estimado,
          percentualProgresso: projetoDetalhado.percentual_progresso,

          objetivos: this.normalizarIds(projetoDetalhado.objetivos ?? []),
        });
        this.formularioProjeto.disable();
        this.etapaAtual = 1;
      },
      error: (erro) => {
        console.error('Erro ao buscar projeto para visualização:', erro);
        this.carregarEvolucoesProjeto(projeto);
        this.carregarAcoesProjeto(projeto);
        this.formularioProjeto.patchValue({
          tituloProjeto: projeto.nome,
          liderProjeto: projeto.responsavel,
          unidadeResponsavel: projeto.unidade,
          descricao: projeto.descricao,
          tempoEstimado: projeto.tempo_estimado,
          percentualProgresso: projeto.percentual_progresso,
          objetivos: this.normalizarIds(projeto.objetivos ?? []),
        });
        this.formularioProjeto.disable();
        this.etapaAtual = 1;
      },
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
      error: erro => window.alert(erro.error?.detail ?? 'Não foi possível aprovar o projeto.'),
    });
  }

  rejeitarProjeto(decisao: DecisaoProjeto): void {
    this.projetoService.rejeitarProjeto(decisao.projeto.id, decisao.observacao).subscribe({
      next: () => {
        this.fecharAvaliacao();
        this.buscarProjeto();
      },
      error: erro => window.alert(erro.error?.detail ?? 'Não foi possível rejeitar o projeto.'),
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

  obterRotuloStatusRevisao(status: string): string {
    const rotulos: Record<string, string> = {
      PENDENTE: 'Alteração pendente',
      APROVADA: 'Alteração aprovada',
      REJEITADA: 'Alteração rejeitada',
    };
    return rotulos[status] ?? status;
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

  editarProjetoRejeitado(projeto: ProjetoEstrategico): void {
    this.fecharAvaliacao();

    this.projetoSelecionadoId = projeto.id;

    this.visualizando = false;

    this.editandoProjetoRejeitado = projeto.status === 'REJEITADO';
    this.editandoRascunho = projeto.status === 'RASCUNHO';

    this.modoEdicaoEtapa3 = false;

    this.projetoService.getById(projeto.id).subscribe({
      next: (projetoDetalhado) => {
        this.carregarEvolucoesProjeto(projetoDetalhado);
        this.carregarAcoesProjeto(projetoDetalhado);
        this.formularioProjeto.enable();

        this.formularioProjeto.patchValue({
          tituloProjeto: projetoDetalhado.nome,

          liderProjeto: projetoDetalhado.responsavel,

          unidadeResponsavel: projetoDetalhado.unidade,

          descricao: projetoDetalhado.descricao,

          tempoEstimado: projetoDetalhado.tempo_estimado,

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

      percentual_progresso: Number(formulario.percentualProgresso ?? 0),

      responsavel: formulario.liderProjeto || null,

      unidade: formulario.unidadeResponsavel,

      acoes: this.montarAcoesProjeto(),

      objetivos: formulario.objetivos ?? [],

      evolucoes: this.montarEvolucoes(),

      status: 'EM_ESPERA',
    };

    const envio = this.projetoService.atualizarProjeto(this.projetoSelecionadoId, dadosAtualizacao);

    envio.subscribe({
      next: () => {
        window.alert('Projeto reenviado para análise com sucesso.');

        this.editandoProjetoRejeitado = false;
        this.projetoSelecionadoId = null;

        this.fecharModal();
        this.buscarProjeto();

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
    this.editandoRascunho = false;
    this.projetoSelecionadoId = null;
    this.formularioProjeto.reset();
    this.formularioProjeto.enable();
    this.limparEvolucoesProjeto();
    this.etapaAtual = 1;
    this.fecharModal();
  }
  abrirEdicaoPeloModal(projeto: ProjetoEstrategico): void {
    this.fecharAvaliacao();

    this.editandoProjetoRejeitado = false;

    this.editandoRascunho = false;
    if (projeto.status === 'RASCUNHO' || (projeto.status === 'REJEITADO' && !this.isAdmin())) {
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

          percentualProgresso: projetoDetalhado.percentual_progresso,

          objetivos: this.normalizarIds(projetoDetalhado.objetivos ?? []),
        });

        this.carregarEvolucoesProjeto(projetoDetalhado);
        this.carregarAcoesProjeto(projetoDetalhado);

        this.etapaAtual = 3;

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
    this.realizacoesAntesDaEdicao = [...this.realizacoesConcluidas()];

    this.proximosPassosAntesDaEdicao = [...this.proximosPassos()];
    this.acoesAntesDaEdicao = this.acoesProjeto().map((acao) => ({ ...acao }));

    this.dadosFormularioAntesDaEdicao = this.formularioProjeto.getRawValue();

    this.modoEdicaoEtapa3 = true;

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

      if (papel === 'GESTOR') {
        this.formularioProjeto.get('liderProjeto')?.enable();
        this.etapaAtual = 1;
      } else {
        this.etapaAtual = 2;
      }
    }
  }

  salvarResponsavelProjeto(): void {
    if (
      this.usuarioAtual()?.papel !== 'GESTOR' ||
      !this.projetoSelecionadoId
    ) {
      return;
    }

    const responsavel = this.formularioProjeto.get('liderProjeto')?.value;

    this.projetoService
      .atualizarProjeto(this.projetoSelecionadoId, { responsavel })
      .subscribe({
        next: () => {
          window.alert('Responsável alterado com sucesso.');
          this.buscarProjeto();
        },
        error: erro => {
          window.alert(
            erro.error?.responsavel ??
            erro.error?.detail ??
            'Não foi possível alterar o responsável.'
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
    const realizacoes = (projeto.evolucoes ?? [])
      .filter((evolucao) => evolucao.tipo === 'REALIZACAO')
      .map((evolucao) => evolucao.descricao.trim());
    const passos = (projeto.evolucoes ?? [])
      .filter((evolucao) => evolucao.tipo === 'PROXIMO_PASSO')
      .map((evolucao) => evolucao.descricao.trim());

    this.realizacoesConcluidas.set(realizacoes);
    this.proximosPassos.set(passos);
  }

  private carregarAcoesProjeto(projeto: ProjetoEstrategico): void {
    this.acoesProjeto.set(
      (projeto.acoes ?? []).map((acao) => ({
        ...acao,
        prazo_inicio: acao.prazo_inicio?.slice(0, 10) ?? '',
        prazo_fim: acao.prazo_fim?.slice(0, 10) ?? '',
        data_inicio_efetivo: acao.data_inicio_efetivo?.slice(0, 10) || null,
        data_fim_efetivo: acao.data_fim_efetivo?.slice(0, 10) || null,
      })),
    );
  }

  private montarAcoesProjeto(): Array<Omit<AcaoProjeto, 'id'>> {
    return this.acoesProjeto().map((acao) => ({
      nome: acao.nome.trim(),
      prazo_inicio: acao.prazo_inicio,
      prazo_fim: acao.prazo_fim,
      custo_estimado: Number(acao.custo_estimado),
      custo_realizado: Number(acao.custo_realizado),
      data_inicio_efetivo: acao.data_inicio_efetivo || null,
      data_fim_efetivo: acao.data_fim_efetivo || null,
      status: acao.status,
    }));
  }

  abrirFormularioAcao(): void {
    this.acaoEmEdicaoIndice = null;
    this.formularioAcao.reset({
      nome: '',
      prazo_inicio: '',
      prazo_fim: '',
      custo_estimado: 0,
      custo_realizado: 0,
      data_inicio_efetivo: '',
      data_fim_efetivo: '',
      status: 'PLANEJAMENTO',
    });
  }

  editarAcaoProjeto(indice: number): void {
    const acao = this.acoesProjeto()[indice];
    if (!acao) return;
    this.acaoEmEdicaoIndice = indice;
    this.formularioAcao.reset({
      ...acao,
      data_inicio_efetivo: acao.data_inicio_efetivo ?? '',
      data_fim_efetivo: acao.data_fim_efetivo ?? '',
    });
  }

  salvarAcaoProjeto(): void {
    if (this.formularioAcao.invalid) {
      this.formularioAcao.markAllAsTouched();
      window.alert('Preencha os campos obrigatórios da ação com valores válidos.');
      return;
    }

    const dados = this.formularioAcao.getRawValue();
    if (dados.prazo_fim < dados.prazo_inicio) {
      window.alert('A data de fim prevista não pode ser anterior à data de início prevista.');
      return;
    }
    if (dados.data_inicio_efetivo && dados.data_fim_efetivo &&
        dados.data_fim_efetivo < dados.data_inicio_efetivo) {
      window.alert('A data de fim efetiva não pode ser anterior à data de início efetiva.');
      return;
    }

    const acao: AcaoProjeto = {
      nome: dados.nome.trim(),
      prazo_inicio: dados.prazo_inicio,
      prazo_fim: dados.prazo_fim,
      custo_estimado: Number(dados.custo_estimado),
      custo_realizado: Number(dados.custo_realizado),
      data_inicio_efetivo: dados.data_inicio_efetivo || null,
      data_fim_efetivo: dados.data_fim_efetivo || null,
      status: dados.status,
    };

    this.acoesProjeto.update((lista) => {
      if (this.acaoEmEdicaoIndice === null) return [...lista, acao];
      return lista.map((item, indice) => indice === this.acaoEmEdicaoIndice ? { ...acao, id: item.id } : item);
    });
    this.abrirFormularioAcao();
  }

  removerAcaoProjeto(indice: number): void {
    this.acoesProjeto.update((lista) => lista.filter((_, itemIndice) => itemIndice !== indice));
    if (this.acaoEmEdicaoIndice === indice) this.abrirFormularioAcao();
  }

  salvarProjeto(status: string): void {
    if (this.formularioProjeto.invalid) {
      this.formularioProjeto.markAllAsTouched();
      return;
    }

    const formulario = this.formularioProjeto.getRawValue();

    if (formulario.liderProjeto) {

      const responsavel = this.usuarios().find(
        usuario =>
          usuario.id ===
          Number(formulario.liderProjeto)
      );

      if (!responsavel?.unidade) {

        window.alert(
          'O responsável não possui uma unidade vinculada.'
        );

        return;
      }

      const unidadeIdResponsavel =
        this.obterIdUnidadeUsuario(responsavel);

      if (
        unidadeIdResponsavel !==
        Number(formulario.unidadeResponsavel)
      ) {

        window.alert(
          'O responsável não pertence à unidade selecionada.'
        );

        return;
      }
    }

    const projeto = {
      nome: formulario.tituloProjeto,
      descricao: formulario.descricao,
      tempo_estimado: formulario.tempoEstimado,
      percentual_progresso: Number(formulario.percentualProgresso ?? 0),
      status: status,
      responsavel: formulario.liderProjeto || null,
      unidade: formulario.unidadeResponsavel,
      acoes: this.montarAcoesProjeto(),
      objetivos: formulario.objetivos ?? [],
      evolucoes: this.montarEvolucoes(),
    };

    const operacao = this.editandoRascunho && this.projetoSelecionadoId !== null
      ? this.projetoService.atualizarProjeto(this.projetoSelecionadoId, projeto)
      : this.projetoService.CriarProjeto(projeto);
    operacao.subscribe({
      next: (projetoCriado) => {
        console.log('Projeto criado:', projetoCriado);
        this.limparEvolucoesProjeto();
        this.projetoSelecionadoId = null;
        this.editandoRascunho = false;
        this.dadosFormularioAntesDaEdicao = null;
        this.modoEdicaoEtapa3 = false;
        this.fecharModal();
        this.buscarProjeto();
        this.formularioProjeto.reset();
        this.etapaAtual = 1;
      },
      error: (erro) => {
        console.error('erro ao criar projeto:', erro.error);
        window.alert(erro.error?.detail ?? 'Não foi possível salvar o projeto. Verifique os campos e tente novamente.');
      },
    });
  }

  criarNovoProjeto(): void {
    this.editandoProjetoRejeitado = false;
    this.editandoRascunho = false;

    this.visualizando = false;
    this.modoEdicaoEtapa3 = false;
    this.projetoSelecionadoId = null;
    this.formularioProjeto.enable();
    this.formularioProjeto.reset({
      tituloProjeto: '',
      liderProjeto: '',
      unidadeResponsavel: '',
      descricao: '',
      tempoEstimado: '',
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
    this.abrirFormularioAcao();
  }

  fecharFormulario(): void {
    this.editandoRascunho = false;
    this.visualizando = false;
    this.modoEdicaoEtapa3 = false;
    this.projetoSelecionadoId = null;
    this.formularioProjeto.enable();
    this.limparEvolucoesProjeto();
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
        console.error(
          'Erro ao buscar responsáveis:',
          erro
        );
      }
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
    if (this.visualizando && (!this.modoEdicaoEtapa3 || !this.isAdmin())) {
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
    if (this.visualizando && !this.modoEdicaoEtapa3) {
      return;
    }
    const texto = window.prompt('Digite a realização concluída:');
    if (!texto || !texto.trim()) {
      return;
    }

    this.realizacoesConcluidas.update((lista) => [...lista, texto.trim()]);
  }

  adicionarProximoPasso(): void {
    if (this.visualizando && !this.modoEdicaoEtapa3) {
      return;
    }
    const texto = window.prompt('Digite um proximo passo:');

    if (!texto || !texto.trim()) {
      return;
    }
    this.proximosPassos.update((lista) => [...lista, texto.trim()]);
  }

  concluirProximoPasso(indice: number): void {
    if (!this.modoEdicaoEtapa3) {
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
    if (this.visualizando && !this.modoEdicaoEtapa3) {
      return;
    }
    this.realizacoesConcluidas.update((lista) => lista.filter((_, i) => i !== indice));
  }

  removerProximoPasso(indice: number): void {
    if (this.visualizando && !this.modoEdicaoEtapa3) {
      return;
    }

    this.proximosPassos.update((lista) => lista.filter((_, i) => i !== indice));
  }

  voltarRealizacaoParaProximoPasso(indice: number): void {
    if (!this.modoEdicaoEtapa3) {
      return;
    }
    const realizacao = this.realizacoesConcluidas()[indice];

    if (!realizacao) {
      return;
    }

    this.realizacoesConcluidas.update((lista) => lista.filter((_, i) => i !== indice));
    this.proximosPassos.update((lista) => [...lista, realizacao]);
  }

  cancelarEdicaoEtapa3(): void {
    this.realizacoesConcluidas.set([...this.realizacoesAntesDaEdicao]);
    this.proximosPassos.set([...this.proximosPassosAntesDaEdicao]);
    this.acoesProjeto.set(this.acoesAntesDaEdicao.map((acao) => ({ ...acao })));
    this.abrirFormularioAcao();

    if (this.dadosFormularioAntesDaEdicao) {
      this.formularioProjeto.patchValue(this.dadosFormularioAntesDaEdicao);
    }

    this.formularioProjeto.disable();
    this.modoEdicaoEtapa3 = false;
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

  confirmarEdicaoEtapa3(): void {
    if (!this.projetoSelecionadoId) {
      return;
    }

    if (this.isAdmin() && this.formularioProjeto.invalid) {
      this.formularioProjeto.markAllAsTouched();
      window.alert('Preencha corretamente os campos obrigatórios.');
      return;
    }
    const formulario = this.formularioProjeto.getRawValue();

    const dadosAtualizacao = {
      ...(this.isAdmin() ? {
        nome: formulario.tituloProjeto,
        descricao: formulario.descricao,
        tempo_estimado: formulario.tempoEstimado,
        responsavel: formulario.liderProjeto || null,
        unidade: formulario.unidadeResponsavel,
        objetivos: formulario.objetivos ?? [],
      } : {}),
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

        this.modoEdicaoEtapa3 = false;
        this.fecharModal();
        this.buscarProjeto();
      },

      error: (erro) => {
        window.alert('Não foi possível salvar a atualização. ' + JSON.stringify(erro.error ?? 'Tente novamente.'));
      },
    });
  }

  obterClasseStatus(status: string): string {
    const classes: Record<string, string> = {
      APROVADO: 'status-aprovado',
      EM_ESPERA: 'status-em-espera',
      RASCUNHO: 'status-rascunho',
      REJEITADO: 'status-rejeitado',
    };

    return classes[status] ?? 'status-rascunho';
  }

  obterRotuloStatus(status: string): string {
    const rotulos: Record<string, string> = {
      APROVADO: 'Aprovado/Público',
      EM_ESPERA: 'Em Espera',
      RASCUNHO: 'Rascunho',
      REJEITADO: 'Rejeitado',
    };

    return rotulos[status] ?? status;
  }

  rotuloStatusAcao(status: AcaoProjeto['status']): string {
    const rotulos: Record<AcaoProjeto['status'], string> = {
      PLANEJAMENTO: 'Planejamento',
      ANDAMENTO: 'Em andamento',
      CONCLUIDA: 'Concluída',
      CANCELADA: 'Cancelada',
    };
    return rotulos[status];
  }

  obterUnidadeProjeto(projeto: ProjetoEstrategico): Unidade | undefined {
    return this.unidades().find((unidade) => unidade.id === projeto.unidade);
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

    const responsavel =
      this.obterResponsavelSelecionado();
    if (!responsavel) {
      return;
    }

    const unidadeSelecionada = Number(this.formularioProjeto.get('unidadeResponsavel') ?.value);
    const unidadeResponsavel = this.obterIdUnidadeUsuario(responsavel);

    if (
      unidadeResponsavel !== unidadeSelecionada
    ) {

      this.formularioProjeto.patchValue({liderProjeto: ''});
    }
  }

  obterResponsavelSelecionado(): Usuario | null {
    const id = Number(this.formularioProjeto.get('liderProjeto')?.value);

    return this.usuarios().find((usuario) => usuario.id === id) ?? null;
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

  obterSiglaUnidadeUsuario(usuario: Usuario): string {
    return this.obterUnidadeUsuario(usuario)?.sigla ?? '';
  }

  obterSiglaUnidade(responsavel: any): string {
    if (!responsavel?.unidade) return '';
    if (typeof responsavel.unidade === 'number') return '';
    return responsavel.unidade.sigla ?? '';
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

    const unidadeId = Number(this.formularioProjeto.get('unidadeResponsavel') ?.value);

    if (!unidadeId) {
      return [];
    }

    return this.usuarios().filter(
      usuario =>
        this.obterIdUnidadeUsuario(usuario) === unidadeId
    );
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

    return this.unidades().filter(
      unidade => unidade.id === unidadeId
    );
  }

}
