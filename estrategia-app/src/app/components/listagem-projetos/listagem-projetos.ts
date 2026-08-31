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

@Component({
  selector: 'app-listagem-projetos',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './listagem-projetos.html',
  styleUrl: './listagem-projetos.scss',
  providers: [DatePipe],
})
export class ListagemProjetos {
  projetos = signal<ProjetoEstrategico[]>([]);
  usuarios = signal<Usuario[]>([]);
  unidades = signal<Unidade[]>([]);
  objetivos = signal<ObjetivoEstrategico[]>([]);
  formularioProjeto: FormGroup;
  etapaAtual = 1;
  visualizando = false;
  modoEdicaoEtapa3 = false;
  projetoSelecionadoId: number | null = null;

  realizacoesConcluidas = signal<string[]>([]);
  proximosPassos = signal<string[]>([]);

  realizacoesAntesDaEdicao: string[] = [];
  proximosPassosAntesDaEdicao: string[] = [];

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
      acoesPrevistas: [''],
      objetivos: [[], Validators.required],
    });
  }

  ngOnInit(): void {
    this.buscarProjeto();
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

  visualizarProjeto(projeto: ProjetoEstrategico): void {
    this.visualizando = true;
    this.modoEdicaoEtapa3 = false;
    this.projetoSelecionadoId = projeto.id;
    this.formularioProjeto.enable();

    this.projetoService.getById(projeto.id).subscribe({
      next: (projetoDetalhado) => {
        this.carregarEvolucoesProjeto(projetoDetalhado);
        this.formularioProjeto.patchValue({
          tituloProjeto: projetoDetalhado.nome,
          liderProjeto: projetoDetalhado.responsavel,
          unidadeResponsavel: projetoDetalhado.unidade,
          descricao: projetoDetalhado.descricao,
          acoesPrevistas: projetoDetalhado.acoes_previstas,
          objetivos: this.normalizarIds(projetoDetalhado.objetivos ?? []),
          realizacoes: projetoDetalhado.evolucoes?.map((evolucao) => evolucao.realizacao).join('\n\n') || '',
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
          acoesPrevistas: projeto.acoes_previstas,
          objetivos: this.normalizarIds(projeto.objetivos ?? []),
          realizacoes: projeto.evolucoes?.map((evolucao) => evolucao.realizacao).join('\n\n') || '',
        });
        this.formularioProjeto.disable();
        this.etapaAtual = 1;
      }
    });
  }

  editarProjeto(): void {
    this.realizacoesAntesDaEdicao = [...this.realizacoesConcluidas()];
    this.proximosPassosAntesDaEdicao = [...this.proximosPassos()];

    this.modoEdicaoEtapa3 = true;
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

  salvarProjeto(status: string): void{
    if(this.formularioProjeto.invalid){
      this.formularioProjeto.markAllAsTouched();
      return;
    }

    const formulario = this.formularioProjeto.getRawValue();

    const projeto = {
      nome: formulario.tituloProjeto,
      descricao: formulario.descricao,
      tempo_estimado: formulario.tempoEstimado,
      custo_estimado: Number(formulario.custoEstimado),
      percentual_progresso: 0,
      status: status,
      responsavel: formulario.liderProjeto,
      unidade: formulario.unidadeResponsavel,
      acoes_previstas: formulario.acoesPrevistas,
      objetivos: formulario.objetivos ?? [],
      evolucoes: this.montarEvolucoes(),
    };

    this.projetoService.CriarProjeto(projeto).subscribe({
      next: (projetoCriado)=>{
        console.log('projeto criado', projetoCriado);
        this.fecharFormulario();
        this.fecharModal();
        this.buscarProjeto();
        this.formularioProjeto.reset();
        this.etapaAtual = 1;
      },
      error: (erro)=>{
        console.error('erro ao criar projeto:', erro.error);
      }
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
    this.etapaAtual = 1;
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

  buscarUsuarios(): void{
    this.usuarioService.get().subscribe({
      next: (dados) => this.usuarios.set(dados),
      error: (erro) => console.error('erro ao buscar usuarios', erro)
    });
  }

  buscarUnidades(): void {
    this.unidadeService.get().subscribe({
      next: (dados) => this.unidades.set(dados),
      error: (erro) => console.error('erro ao buscar unidades', erro)
    });
  }

  buscarObjetivosEstrategicos(): void {
    this.objetivoService.get().subscribe({
      next: (dados) => this.objetivos.set(dados),
      error: (erro) => console.error('Erro ao buscar objetivos estratégicos:', erro)
    });
  }

  selecionarObjetivo(objetivo: ObjetivoEstrategico, evento: Event): void {
    if (this.visualizando && !this.modoEdicaoEtapa3) return;

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
    if(this.visualizando && !this.modoEdicaoEtapa3){
      return;
    }
    const texto = window.prompt('Digite a realização concluída:');
    if(!texto || !texto.trim()){
      return;
    }

    this.realizacoesConcluidas.update(lista => [...lista, texto.trim()]);
  }

  adicionarProximoPasso(): void {
    if(this.visualizando && !this.modoEdicaoEtapa3){
      return;
    }
    const texto = window.prompt('Digite um proximo passo:');

    if(!texto || !texto.trim()){
      return;
    }
    this.proximosPassos.update(lista => [...lista, texto.trim()])
  }

  concluirProximoPasso(indice: number): void {
    if(!this.modoEdicaoEtapa3){
      return;
    }
    const passo = this.proximosPassos()[indice];
    if(!passo){
      return;
    }

    this.proximosPassos.update(lista =>
      lista.filter((_,i) => i !== indice)
    );

    this.realizacoesConcluidas.update(lista => [...lista, passo]);
  }

  removerRealizacao(indice: number): void {
    if(this.visualizando && !this.modoEdicaoEtapa3){
      return;
    }
    this.realizacoesConcluidas.update(lista => lista.filter((_, i) => i !== indice));
  }

  removerProximoPasso(indice: number): void {
    if (this.visualizando && !this.modoEdicaoEtapa3) {
      return;
    }

    this.proximosPassos.update(lista =>
      lista.filter((_, i) => i !== indice)
    );
  }

  voltarRealizacaoParaProximoPasso(indice: number): void {

    if (!this.modoEdicaoEtapa3) {
      return;
    }
    const realizacao = this.realizacoesConcluidas()[indice];

    if (!realizacao) {
      return;
    }

    this.realizacoesConcluidas.update(lista => lista.filter((_, i) => i !== indice));

    this.proximosPassos.update(lista => [...lista,realizacao]);
  }
  cancelarEdicaoEtapa3(): void {

    this.realizacoesConcluidas.set([ ...this.realizacoesAntesDaEdicao]);

    this.proximosPassos.set([ ...this.proximosPassosAntesDaEdicao]);

    this.modoEdicaoEtapa3 = false;
  }
  private montarEvolucoes(): Array<{realizacao: string; proximo_passo:string}> {
    const realizacoes = this.realizacoesConcluidas().filter(valor =>valor?.trim()).map(valor => ({realizacao: valor.trim(), proximo_passo: ''}));

    const proximos = this.proximosPassos().filter(valor => valor?.trim()).map(valor => ({realizacao: '', proximo_passo: valor.trim()}));

    return [...realizacoes, ...proximos]
  }

  confirmarEdicaoEtapa3(): void{
    if(!this.projetoSelecionadoId){
      return;
    }
    const confirmou = window.confirm('Tem certeza que deseja salvar as alterações das realizações e proximos passo desse projeto?');

    if(!confirmou){
      return
    }
    const evolucoes = this.montarEvolucoes();

    this.projetoService.atualizarProjeto(this.projetoSelecionadoId, {evolucoes: evolucoes}).subscribe({
      next: (projetoAtualizado)=>{
        this.carregarEvolucoesProjeto(projetoAtualizado);

        this.modoEdicaoEtapa3 = false;

        this.realizacoesAntesDaEdicao = [];
        this.proximosPassosAntesDaEdicao = [];

        this.buscarProjeto();

        console.log('Evoluções atualizadas com sucesso');
      },

      error: (erro) => {
        console.error('Erro ao atualizar evoluções:', erro)
        window.alert('nao foi possivel salvar alterações.')
      }
    })
  }

}

