import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ObjetivoEstrategico } from '../../model/objetivoEstrategico';
import { ProjetoEstrategico } from '../../model/projetoEstrategico';
import { Unidade } from '../../model/unidade';
import { Usuario } from '../../model/usuario';
import { ObjetivoService } from '../../service/objetivo.service';
import { ProjetoService } from '../../service/projeto.service';
import { UnidadeService } from '../../service/unidade.service';
import { UsuarioService } from '../../service/usuario.service';
import {EvolucaoOrcamentaria } from '../../model/projetoEstrategico';

@Component({
  selector: 'app-listagem-projetos',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './listagem-projetos.html',
  styleUrl: './listagem-projetos.scss',
  providers: [DatePipe],
})
export class ListagemProjetos {
  evolucoesOrcamentarias = signal<EvolucaoOrcamentaria[]>([]);
  projetos = signal<ProjetoEstrategico[]>([]);
  usuarios = signal<Usuario[]>([]);
  unidades = signal<Unidade[]>([]);
  objetivos = signal<ObjetivoEstrategico[]>([]);
  isAdmin = signal(false);
  usuarioAtual = signal<Usuario | null>(null);
  formularioProjeto: FormGroup;
  etapaAtual = 1;
  visualizando = false;
  modoEdicaoEtapa3 = false;
  projetoSelecionadoId: number | null = null;

  filtroStatus = signal<string>('TODOS');
  termoPesquisa = signal<string>('');
  unidadeSelecionadas =signal<number[]>([]);
  menuUnidadesAberto = signal(false);

  realizacoesConcluidas = signal<string[]>([]);
  proximosPassos = signal<string[]>([]);

  realizacoesAntesDaEdicao: string[] = [];
  proximosPassosAntesDaEdicao: string[] = [];
  dadosFormularioAntesDaEdicao: any = null;

  private datePipe = inject(DatePipe);

  constructor(
    private projetoService: ProjetoService,
    private construtorFormulario: FormBuilder,
    private usuarioService: UsuarioService,
    private unidadeService: UnidadeService,
    private objetivoService: ObjetivoService,
  ) {
    this.formularioProjeto = this.construtorFormulario.group({
      tituloProjeto: ['', Validators.required],
      liderProjeto: ['', Validators.required],
      unidadeResponsavel: ['', Validators.required],
      descricao: [''],
      tempoEstimado: ['', Validators.required],
      custoEstimado: [0, Validators.required],

      percentualProgresso: [0,[ Validators.required, Validators.min(0), Validators.max(100)]],
      valorInvestido: [null],
      descricaoOrcamentaria: [''],
      acoesPrevistas: [''],
      objetivos: [[], Validators.required],
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

  buscarUsuarioAtual(): void {
    this.usuarioService.getAtual().subscribe({
      next: (usuario) => {
        this.usuarioAtual.set(usuario);
        this.isAdmin.set(usuario.papel === 'ADMIN');
      },

      error: (erro) => {
        console.error(
          'Erro ao buscar usuário atual:',
          erro
        );
      },
    });
  }

  alterarFiltroStatus(status: string): void {
    this.filtroStatus.set(status);
  }

  pesquisarProjeto(evento: Event): void{
    const input = evento.target as HTMLInputElement;

    this.termoPesquisa.set(
      input.value.trim().toLowerCase()
    );
  }

  alternarUnidade(unidadeId: number): void {

    const selecionadas = this.unidadeSelecionadas();

    if (selecionadas.includes(unidadeId)) {

      this.unidadeSelecionadas.set(
        selecionadas.filter(
          id => id !== unidadeId
        )
      );

    } else {

      this.unidadeSelecionadas.set([
        ...selecionadas,
        unidadeId
      ]);

    }
  }
  unidadeEstaSelecionada(
    unidadeId: number
  ): boolean {

    return this.unidadeSelecionadas()
      .includes(unidadeId);
  }

  alternarMenuUnidades(): void {
    this.menuUnidadesAberto.update(
      aberto => !aberto
    );
  }

  limparFiltroUnidades(): void {
    this.unidadeSelecionadas.set([]);
  }

  projetosFiltrados(): ProjetoEstrategico[] {

    const status =
      this.filtroStatus();

    const pesquisa =
      this.termoPesquisa();

    const unidadeSelecionadas =
      this.unidadeSelecionadas();


    return this.projetos().filter(
      projeto => {

        // ========================
        // FILTRO DE STATUS
        // ========================

        const atendeStatus =
          status === 'TODOS' ||
          projeto.status === status;


        // ========================
        // PESQUISA PELO NOME
        // ========================

        const nomeProjeto =
          projeto.nome
            ?.toLowerCase() ?? '';

        const atendePesquisa =
          !pesquisa ||
          nomeProjeto.includes(pesquisa);


        // ========================
        // FILTRO DE UNIDADE
        // ========================

        const atendeUnidade =
          unidadeSelecionadas.length === 0 ||
          unidadeSelecionadas.includes(
            Number(projeto.unidade)
          );


        return (
          atendeStatus &&
          atendePesquisa &&
          atendeUnidade
        );
      }
    );
  }

  visualizarProjeto(projeto: ProjetoEstrategico): void {
    this.visualizando = true;
    this.modoEdicaoEtapa3 = false;
    this.projetoSelecionadoId = projeto.id;
    this.formularioProjeto.enable();

    this.projetoService.getById(projeto.id).subscribe({
      next: (projetoDetalhado) => {
        this.carregarEvolucoesProjeto(
          projetoDetalhado
        );

        this.evolucoesOrcamentarias.set(
          projetoDetalhado.evolucoesOrcamentarias ?? []
        );
        this.formularioProjeto.patchValue({
          tituloProjeto: projetoDetalhado.nome,
          liderProjeto: projetoDetalhado.responsavel,
          unidadeResponsavel: projetoDetalhado.unidade,
          descricao: projetoDetalhado.descricao,
          tempoEstimado: projetoDetalhado.tempo_estimado,
          custoEstimado: projetoDetalhado.custo_estimado,

          percentualProgresso:
            projetoDetalhado.percentual_progresso,

          valorInvestido: null,
          descricaoOrcamentaria: '',

          acoesPrevistas:
            projetoDetalhado.acoes_previstas,

          objetivos: this.normalizarIds(
            projetoDetalhado.objetivos ?? []
          )
        });
        this.formularioProjeto.disable();
        this.etapaAtual = 1;
      },
      error: (erro) => {
        console.error('Erro ao buscar projeto para visualização:', erro);
        this.carregarEvolucoesProjeto(projeto);
        this.formularioProjeto.patchValue({
          tituloProjeto: projeto.nome,
          liderProjeto: projeto.responsavel,
          unidadeResponsavel: projeto.unidade,
          descricao: projeto.descricao,
          tempoEstimado: projeto.tempo_estimado,
          percentualProgresso: projeto.percentual_progresso,
          custoEstimado: projeto.custo_estimado,
          acoesPrevistas: projeto.acoes_previstas,
          objetivos: this.normalizarIds(projeto.objetivos ?? []),
          realizacoes: projeto.evolucoes?.map((evolucao) => evolucao.realizacao).join('\n\n') || '',
        });
        this.formularioProjeto.disable();
        this.etapaAtual = 1;
      },
    });
  }

  editarProjeto(): void {
    this.realizacoesAntesDaEdicao = [
      ...this.realizacoesConcluidas()
    ];

    this.proximosPassosAntesDaEdicao = [
      ...this.proximosPassos()
    ];

    this.dadosFormularioAntesDaEdicao =
      this.formularioProjeto.getRawValue();

    this.modoEdicaoEtapa3 = true;

    if (this.isAdmin()) {
      this.formularioProjeto.enable();
    } else {
      this.formularioProjeto
        .get('percentualProgresso')
        ?.enable();

      this.formularioProjeto
        .get('valorInvestido')
        ?.enable();

      this.formularioProjeto
        .get('descricaoOrcamentaria')
        ?.enable();
    }
  }

  private normalizarIds(valores: Array<number | { id?: number; objetivo?: number; objetivo_id?: number } | null | undefined>): number[] {
    return (valores ?? [])
      .map((item) => {
        if (typeof item === 'number') return item;
        return item?.id ?? item?.objetivo ?? item?.objetivo_id ?? null;
      })
      .filter((valor): valor is number => valor !== null && valor !== undefined);
  }

  private carregarEvolucoesProjeto(projeto: ProjetoEstrategico): void {
    const realizacoes = (projeto.evolucoes ?? [])
      .filter((evolucao) => !!evolucao.realizacao?.trim())
      .map((evolucao) => evolucao.realizacao.trim());

    const passos = (projeto.evolucoes ?? [])
      .filter((evolucao) => !!evolucao.proximo_passo?.trim())
      .map((evolucao) => evolucao.proximo_passo.trim());

    this.realizacoesConcluidas.set(realizacoes);
    this.proximosPassos.set(passos);
  }

  private obterEvolucoesAtuais(): Array<{ realizacao: string; proximo_passo: string }> {
    const evolucoesAtuais = this.projetos().find((projeto) => projeto.id === this.projetoSelecionadoId)?.evolucoes ?? [];

    return evolucoesAtuais
      .filter((evolucao) => !!evolucao.realizacao?.trim() || !!evolucao.proximo_passo?.trim())
      .map((evolucao) => ({
        realizacao: evolucao.realizacao?.trim() ?? '',
        proximo_passo: evolucao.proximo_passo?.trim() ?? '',
      }));
  }

  private recarregarDetalhesProjeto(): void {
    if (!this.projetoSelecionadoId) return;

    this.projetoService.getById(this.projetoSelecionadoId).subscribe({
      next: (projetoDetalhado) => {
        this.carregarEvolucoesProjeto(projetoDetalhado);
      },
      error: (erro) => console.error('Erro ao recarregar projeto:', erro),
    });
  }

  salvarProjeto(status: string): void {
    if (this.formularioProjeto.invalid) {
      this.formularioProjeto.markAllAsTouched();
      return;
    }

    const formulario = this.formularioProjeto.getRawValue();

    const evolucoesOrcamentarias = [];

    const valorInvestido = Number(
      formulario.valorInvestido
    );

    const descricaoOrcamentaria = (
      formulario.descricaoOrcamentaria ?? ''
    ).trim();

    if (valorInvestido > 0 || descricaoOrcamentaria) {
      evolucoesOrcamentarias.push({
        valor: valorInvestido || 0,
        descricao: descricaoOrcamentaria
      });
    }

    const responsavel = this.usuarios().find(
      usuario => usuario.id === Number(formulario.liderProjeto)
    );

    if (!responsavel?.unidade) {
      window.alert(
        'O servidor responsável não possui uma unidade vinculada.'
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
      'O servidor responsável não pertence à unidade selecionada.'
    );

    return;
  }

    const projeto = {
      nome: formulario.tituloProjeto,
      descricao: formulario.descricao,
      tempo_estimado: formulario.tempoEstimado,
      custo_estimado: Number(formulario.custoEstimado),
      percentual_progresso: Number(formulario.percentualProgresso ?? 0),
      evolucoesOrcamentarias: evolucoesOrcamentarias,
      status: status,
      responsavel: formulario.liderProjeto,
      unidade: formulario.unidadeResponsavel,
      acoes_previstas: formulario.acoesPrevistas,
      objetivos: formulario.objetivos ?? [],
      evolucoes: this.montarEvolucoes(),
    };

    this.projetoService.CriarProjeto(projeto).subscribe({
      next: (projetoCriado) => {
        console.log('Projeto criado:', projetoCriado);
        this.limparEvolucoesProjeto();
        this.projetoSelecionadoId = null;
        this.dadosFormularioAntesDaEdicao = null;
        this.modoEdicaoEtapa3 = false;
        this.fecharModal();
        this.buscarProjeto();
        this.formularioProjeto.reset();
        this.etapaAtual = 1;
      },
      error: (erro) => {
        console.error('erro ao criar projeto:', erro.error);
      },
    });
  }

  criarNovoProjeto(): void {
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
      custoEstimado: 0,
      acoesPrevistas: '',
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
  }

  fecharFormulario(): void {
    this.visualizando = false;
    this.modoEdicaoEtapa3 = false;
    this.projetoSelecionadoId = null;
    this.formularioProjeto.enable();
  }

  fecharModal(): void {
    const modal = document.getElementById('modalProjeto');
    if (!modal) return;

    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    modal.style.display = 'none';

    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) backdrop.remove();

    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('padding-right');
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
    this.usuarioService.get().subscribe({
      next: (dados) => this.usuarios.set(dados),
      error: (erro) => console.error('erro ao buscar usuarios', erro),
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
    return this.normalizarIds(this.formularioProjeto.get('objetivos')?.value || []).includes(objetivo.id);
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

    if (this.dadosFormularioAntesDaEdicao) {
      this.formularioProjeto.patchValue(this.dadosFormularioAntesDaEdicao);
    }

    this.formularioProjeto.disable();
    this.modoEdicaoEtapa3 = false;
    this.dadosFormularioAntesDaEdicao = null;
  }

  private montarEvolucoes(): Array<{ realizacao: string; proximo_passo: string }> {
    const realizacoes = this.realizacoesConcluidas()
      .filter((valor) => valor?.trim())
      .map((valor) => ({ realizacao: valor.trim(), proximo_passo: '' }));

    const proximos = this.proximosPassos()
      .filter((valor) => valor?.trim())
      .map((valor) => ({ realizacao: '', proximo_passo: valor.trim() }));

    return [...realizacoes, ...proximos];
  }

  confirmarEdicaoEtapa3(): void {
    if (!this.projetoSelecionadoId) {
      return;
    }

    const confirmou = window.confirm('Tem certeza que deseja salvar as alterações deste projeto?');

    if (!confirmou) {
      return;
    }

    const evolucoes = this.montarEvolucoes();
    let dadosAtualizacao: any;

    if (this.isAdmin()) {
      if (this.formularioProjeto.invalid) {
        this.formularioProjeto.markAllAsTouched();
        window.alert('Preencha corretamente os campos obrigatórios.');
        return;
      }

      const formulario = this.formularioProjeto.getRawValue();
      const novasEvolucoesOrcamentarias = [];

      const valorInvestido =
        Number(formulario.valorInvestido);

      const descricaoOrcamentaria =
        (
          formulario.descricaoOrcamentaria ?? ''
        ).trim();

      if (
        valorInvestido > 0 ||
        descricaoOrcamentaria
      ) {
        novasEvolucoesOrcamentarias.push({
          valor: valorInvestido || 0,
          descricao: descricaoOrcamentaria
        });
      }

      dadosAtualizacao = {
        nome: formulario.tituloProjeto,
        descricao: formulario.descricao,
        tempo_estimado: formulario.tempoEstimado,
        custo_estimado:Number(formulario.custoEstimado),
        percentual_progresso:Number(  formulario.percentualProgresso ?? 0),
        responsavel: formulario.liderProjeto,
        unidade: formulario.unidadeResponsavel,
        acoes_previstas: formulario.acoesPrevistas,
        objetivos:formulario.objetivos ?? [],
        evolucoes: evolucoes,
        evolucoesOrcamentarias:novasEvolucoesOrcamentarias
      };
    } else {
        const formulario = this.formularioProjeto.getRawValue();

        const novasEvolucoesOrcamentarias = [];

        const valorInvestido = Number(formulario.valorInvestido);
        const descricaoOrcamentaria =
          (formulario.descricaoOrcamentaria ?? '').trim();

        if (valorInvestido > 0 || descricaoOrcamentaria) {
          novasEvolucoesOrcamentarias.push({
            valor: valorInvestido || 0,
            descricao: descricaoOrcamentaria
          });
        }

        dadosAtualizacao = { percentual_progresso: Number( formulario.percentualProgresso ?? 0), evolucoes: evolucoes, evolucoesOrcamentarias: novasEvolucoesOrcamentarias};
      }

    this.projetoService.atualizarProjeto(this.projetoSelecionadoId, dadosAtualizacao).subscribe({
      next: (projetoAtualizado) => {

        this.carregarEvolucoesProjeto(
          projetoAtualizado
        );

        this.evolucoesOrcamentarias.set(
          projetoAtualizado.evolucoesOrcamentarias
            ?? []
        );

        this.formularioProjeto.patchValue({
          valorInvestido: null,
          descricaoOrcamentaria: ''
        });

        this.modoEdicaoEtapa3 = false;
        this.formularioProjeto.disable();

        this.buscarProjeto();
      },
      error: (erro) => {
        console.error('Erro ao atualizar projeto:', erro);
        window.alert('Não foi possível salvar as alterações.');
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




  obterUnidadeProjeto(projeto: ProjetoEstrategico): Unidade | undefined {
    return this.unidades().find(
      unidade => unidade.id === projeto.unidade
    );
  }

  servidoresComUnidade(): Usuario[] {
    const usuarioLogado = this.usuarioAtual();

    if (!usuarioLogado) {
      return [];
    }

    // ADMIN pode visualizar servidores de todas as unidades
    if (usuarioLogado.papel === 'ADMIN') {
      return this.usuarios().filter(
        usuario =>
          (usuario.papel === 'SERVIDOR' ||
            usuario.papel === 'ADMIN') &&
          usuario.unidade != null
      );
    }

    // Obtém a unidade do servidor logado
    const unidadeUsuarioLogado =
      this.obterIdUnidadeUsuario(usuarioLogado);

    if (unidadeUsuarioLogado === null) {
      return [];
    }

    // SERVIDOR vê somente pessoas da própria unidade
    return this.usuarios().filter(usuario => {

      const unidadeUsuario =
        this.obterIdUnidadeUsuario(usuario);

      return (
        (usuario.papel === 'SERVIDOR' ||
          usuario.papel === 'ADMIN') &&
        unidadeUsuario === unidadeUsuarioLogado
      );
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

    return this.unidades().find(
      unidade => unidade.id === unidadeId
    );
  }

  aoSelecionarResponsavel(): void {
    const responsavelId = Number(
      this.formularioProjeto.get('liderProjeto')?.value
    );

    const responsavel = this.usuarios().find(
      usuario => usuario.id === responsavelId
    );

    if (!responsavel) {
      this.formularioProjeto.patchValue({
        unidadeResponsavel: ''
      });

      return;
    }

    const unidadeId = this.obterIdUnidadeUsuario(responsavel);

    if (unidadeId === null) {
      this.formularioProjeto.patchValue({
        unidadeResponsavel: ''
      });

      return;
    }

    this.formularioProjeto.patchValue({
      unidadeResponsavel: unidadeId
    });
  }

  unidadesDoResponsavel(): Unidade[] {
    const responsavelId = Number(
      this.formularioProjeto.get('liderProjeto')?.value
    );

    const responsavel = this.usuarios().find(
      usuario => usuario.id === responsavelId
    );

    if (!responsavel) {
      return [];
    }

    const unidade = this.obterUnidadeUsuario(responsavel);

    return unidade ? [unidade] : [];
  }

  obterResponsavelSelecionado(): Usuario | null {
    const id = Number(
      this.formularioProjeto.get('liderProjeto')?.value
    );

    return this.usuarios().find(
      usuario => usuario.id === id
    ) ?? null;
  }


  obterPercentual(projeto: ProjetoEstrategico): number {
    const percentual = Number(projeto.percentual_progresso) || 0;

    return Math.min(
      Math.max(percentual, 0),
      100
    );
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
      percentualProgresso: valor
    });

    input.value = String(valor);
  }

}


