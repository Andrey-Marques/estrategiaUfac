import { Component, inject, signal } from '@angular/core';
import { InfoBar } from '../utils/info-bar/info-bar';
import { IniciativaEstrategica } from '../../model/iniciativaEstrategica';
import { IniciativaService } from '../../service/iniciativa.service';
import { CommonModule, NgForOf } from '@angular/common';
import { DatePipe } from '@angular/common';
import { FormBuilder,FormGroup,Validators, ReactiveFormsModule } from '@angular/forms';
import { ObjetivoService } from '../../service/objetivo.service';
import { ObjetivoEstrategico } from '../../model/objetivoEstrategico';
import { UsuarioService } from '../../service/usuario.service';
import { Usuario } from '../../model/usuario';
import { UnidadeService } from '../../service/unidade.service';
import { Unidade } from '../../model/unidade';
import {AvaliacaoIniciativa, DecisaoIniciativa} from '../avaliacao-iniciativa/avaliacao-iniciativa';

export interface AcaoIniciativa {
  descricaoAcao: string;
  prazoInicio: string;
  prazoFim: string;
  custoEstimado: string;
  statusAtual: string;
}

@Component({
  selector: 'app-listagem-iniciativas',
  imports: [InfoBar, NgForOf, DatePipe, CommonModule, ReactiveFormsModule, AvaliacaoIniciativa],
  templateUrl: './listagem-iniciativas.html',
  styleUrl: './listagem-iniciativas.scss',
  providers: [DatePipe],
})
export class ListagemIniciativas {
  iniciativas = signal<IniciativaEstrategica[]>([])
  isAdmin = signal(false);
  usuarioAtual = signal<Usuario | null>(null);
  private datePipe = inject(DatePipe);

  // variaveis para modal de criar iniciativa
  usuarios = signal<Usuario[]>([]);
  unidades = signal<Unidade[]>([])
  objetivos = signal<ObjetivoEstrategico[]>([]);
  acoesIniciativa = signal<AcaoIniciativa[]>([]);
  formularioIniciativa: FormGroup;
  formularioAcaoInterno: FormGroup;
  etapaAtual = 1;
  submodalAcaoAberto = false;
  visualizando = false;
  objetivosSelecionados : number[] = [];
  //----------------------------
  iniciativaEmAnalise = signal<IniciativaEstrategica | null>(null);
  modoEdicao = false;
  editandoIniciativaRejeitada = false;
  iniciativaSelecionadaId: number | null = null;

  constructor(private iniciativaService: IniciativaService,private usuarioService: UsuarioService, private unidadeService: UnidadeService, private objetivoService: ObjetivoService, private construtorFormulario: FormBuilder){
    this.formularioIniciativa = this.construtorFormulario.group({
      tituloIniciativa: ['', Validators.required],
      responsavelPreenchimento: [null, Validators.required],
      unidadeResponsavel: [null, Validators.required],
      objetivosEstrategicos: [[], Validators.required],
      evolucaoPercentual: [50, [Validators.required, Validators.min(0), Validators.max(100)]],
      observacoes: ['']
    });

    this.formularioAcaoInterno = this.construtorFormulario.group({
      descricaoAcao: ['', Validators.required],
      prazoInicio: ['', Validators.required],
      prazoFim: ['', Validators.required],
      custoEstimado: ['', Validators.required],
      statusAtual: ['nao-iniciada', Validators.required]
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
      next: usuario => {
        this.usuarioAtual.set(usuario);
        this.isAdmin.set(usuario.papel === 'ADMIN');
      },
      error: erro =>
        console.error('Erro ao buscar usuário atual:',erro)
    });
  }

  responsaveisDisponiveis(): Usuario[] {

    const atual = this.usuarioAtual();
    if (!atual) {return [];}

    if (this.isAdmin()) {return this.usuarios();}

    const unidadeAtual =typeof atual.unidade === 'number'? atual.unidade: atual.unidade?.id;


    return this.usuarios().filter(
      usuario => {
        const unidadeUsuario = typeof usuario.unidade === 'number' ? usuario.unidade : usuario.unidade?.id;

        return (
          unidadeUsuario === unidadeAtual
        );
      }
    );
  }

  buscarIniciativa(): void {
    this.iniciativaService.get().subscribe({
      next: (iniciativa) => {this.iniciativas.set(iniciativa)
        console.log(iniciativa)
      },
      error: (erro) => {console.error('erro ao buscar iniciativas:', erro)}
    })
  }

 CriarNovaIniciativa(): void {
    this.visualizando = false;
    this.modoEdicao = false;
    this.editandoIniciativaRejeitada = false;
    this.iniciativaSelecionadaId = null;
    this.formularioIniciativa.enable();

    const usuario = this.usuarioAtual();
    const unidadeUsuario =
      typeof usuario?.unidade === 'number'
        ? usuario.unidade
        : usuario?.unidade?.id;

    this.formularioIniciativa.reset({
      tituloIniciativa: '',
      responsavelPreenchimento: null,
      unidadeResponsavel: this.isAdmin()? null : unidadeUsuario,
      objetivosEstrategicos: [],
      evolucaoPercentual: 0,
      observacoes: ''
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

  buscarUsuarios(): void{
    this.usuarioService.get().subscribe({
      next: (dados) => this.usuarios.set(dados),
      error: (erro) => console.error('erro ao buscar usuarios', erro)
    })
  }
  buscarUnidade(): void{
    this.unidadeService.get().subscribe({
      next: (dados) => this.unidades.set(dados),
      error: (erro) => console.error('erro ao buscar unidades', erro)
    })
  }

  buscarObjetivosEstrategicos(): void {
    this.objetivoService.get().subscribe({
      next: (dados) => this.objetivos.set(dados),
      error: (erro) => console.error('Erro ao buscar objetivos estratégicos:', erro)
    });
  }

  salvarIniciativa(statusSolicitado: 'RASCUNHO' | 'EM_ESPERA' | 'APROVADO'): void {
    if (statusSolicitado !== 'RASCUNHO' && !this.validarDadosObrigatorios()) {
      return;
    }
    const formulario = this.formularioIniciativa.getRawValue();
    const dados = {
      nome: formulario.tituloIniciativa,
      responsavel: formulario.responsavelPreenchimento,
      unidade: formulario.unidadeResponsavel,
      objetivos: formulario.objetivosEstrategicos,
      percentual_evolucao:  formulario.evolucaoPercentual,
      observacao: formulario.observacoes || '',
      status: statusSolicitado,
      acoes: this.acoesIniciativa().map(
      acao => ({
        nome: acao.descricaoAcao,
        prazo_inicio: this.converterDataParaApi( acao.prazoInicio),
        prazo_fim:this.converterDataParaApi(acao.prazoFim),
        custo: acao.custoEstimado,
        status: this.converterStatusParaApi(acao.statusAtual)
      })
    )
    };

    this.iniciativaService.criarIniciativa(dados).subscribe({
        next: resposta => {
          console.log('Iniciativa criada',  resposta);
          this.fecharFormulario();
          this.fecharModal();
          this.buscarIniciativa();
        },
        error: erro => {
          console.error('Erro ao criar iniciativa', erro);
        }
      });
  }

  selecionarObjetivo(objetivo: ObjetivoEstrategico, evento: Event): void {
    const caixaSelecao = evento.target as HTMLInputElement;
    const selecionados = this.formularioIniciativa.get('objetivosEstrategicos')?.value || [];
    const novos = caixaSelecao.checked ? [...selecionados, objetivo.id] : selecionados.filter((id: number) => id !== objetivo.id);
    this.formularioIniciativa.patchValue({ objetivosEstrategicos: novos });
    this.formularioIniciativa.get('objetivosEstrategicos')?.markAsTouched();
  }

  objetivoEstaSelecionado(objetivo: ObjetivoEstrategico): boolean {
    return (this.formularioIniciativa.get('objetivosEstrategicos')?.value || []).includes(objetivo.id);
  }

  abrirSubmodalAcao(): void {
    this.formularioAcaoInterno.reset({ descricaoAcao: '', prazoInicio: '', prazoFim: '', custoEstimado: '', statusAtual: 'nao-iniciada' });
    this.submodalAcaoAberto = true;
  }

  fecharSubmodalAcao(): void { this.submodalAcaoAberto = false; }

  adicionarAcaoIniciativa(): void {
    if (this.formularioAcaoInterno.invalid) {
      this.formularioAcaoInterno.markAllAsTouched();
      alert('Preencha todos os campos da ação.');
      return;
    }
    this.acoesIniciativa.update(lista => [...lista, this.formularioAcaoInterno.value]);
    this.fecharSubmodalAcao();
  }

  removerAcaoIniciativa(indiceAcao: number): void {
    this.acoesIniciativa.update(lista => lista.filter((_, i) => i !== indiceAcao));
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
      'concluida': 'CONCLUIDA'
    };
    return mapa[status] || status;
  }

  private converterStatusParaFormulario(status: string): string {
    const mapa: Record<string, string> = {
      PLANEJAMENTO: 'nao-iniciada', ANDAMENTO: 'em-execucao', CONCLUIDA: 'concluida'
    };
    return mapa[status] || status;
  }
  private observarResponsavelSelecionado(): void {
    this.formularioIniciativa.get('responsavelPreenchimento')?.valueChanges.subscribe(responsavelId => {
        if (!responsavelId) {
          this.formularioIniciativa.patchValue(
            {unidadeResponsavel: null},
            {emitEvent: false}
          );
          return;
        }

        const responsavel = this.usuarios().find(usuario =>
              Number(usuario.id) ===
              Number(responsavelId)
          );

        if (!responsavel) {
          return;
        }

        const unidadeId =
          typeof responsavel.unidade === 'number'
            ? responsavel.unidade
            : responsavel.unidade?.id;

        this.formularioIniciativa.patchValue(
          { unidadeResponsavel: unidadeId ?? null
          },
          {
            emitEvent: false
          }
        );
      });
  }

  obterRotuloStatus(status: string): string {
    const mapa: Record<string, string> = { 'nao-iniciada': 'Não iniciada', 'em-execucao': 'Em execução', 'concluida': 'Concluída' };
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

    if (!formulario.responsavelPreenchimento) {
      window.alert('Selecione o responsável pela iniciativa.');
      this.etapaAtual = 1;
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
    this.iniciativaService.getById(iniciativa.id).subscribe({
        next: dados => {
          this.iniciativaEmAnalise.set(dados);
        },
        error: erro =>
          console.error('Erro ao carregar iniciativa:', erro)
      });
  }

  fecharAvaliacao(): void {
    this.iniciativaEmAnalise.set(null);
  }

  aprovarIniciativa(decisao: DecisaoIniciativa): void {
    this.iniciativaService
      .aprovar(
        decisao.iniciativa.id,
        decisao.observacao
      )
      .subscribe({
        next: () => {
          this.fecharAvaliacao();
          this.buscarIniciativa();
        },
        error: erro =>
          console.error('Erro ao aprovar iniciativa:', erro)
      });
  }
  rejeitarIniciativa(decisao: DecisaoIniciativa): void {
    this.iniciativaService
      .rejeitar( decisao.iniciativa.id, decisao.observacao)
      .subscribe({
        next: () => {
          this.fecharAvaliacao();
          this.buscarIniciativa();
        },
        error: erro =>
          console.error( 'Erro ao rejeitar iniciativa:', erro)
      });
  }

  carregarIniciativaFormulario(dados: IniciativaEstrategica): void {
    this.formularioIniciativa.enable();

    this.formularioIniciativa.patchValue({
      tituloIniciativa: dados.nome,
      responsavelPreenchimento: dados.responsavel,
      unidadeResponsavel: dados.unidade,
      objetivosEstrategicos: dados.objetivos || [],
      evolucaoPercentual:
        Number(dados.percentual_evolucao),
      observacoes: dados.observacao || ''
    });


    this.acoesIniciativa.set(
      (dados.acoes_realizadas || [])
        .map(acao => ({
          descricaoAcao: acao.nome,
          prazoInicio: acao.prazo_inicio,
          prazoFim: acao.prazo_fim,
          custoEstimado: String(acao.custo),
          statusAtual: this.converterStatusParaFormulario(acao.status)
        }))
    );
  }

  abrirEdicaoPeloModal(iniciativa: IniciativaEstrategica): void {
    this.fecharAvaliacao();
    this.editandoIniciativaRejeitada = false;
    this.iniciativaSelecionadaId = iniciativa.id;

    this.iniciativaService.getById(iniciativa.id).subscribe({
        next: dados => {
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
          this.etapaAtual = 2;
        },
        error: erro => {
          console.error('Erro ao carregar iniciativa para edição:', erro);
        }
      });
  }

  montarAcoesApi() {
    return this.acoesIniciativa().map(
      acao => ({
        nome: acao.descricaoAcao,
        prazo_inicio: this.converterDataParaApi(acao.prazoInicio),
        prazo_fim:this.converterDataParaApi(acao.prazoFim),
        custo: acao.custoEstimado,
        status: this.converterStatusParaApi(acao.statusAtual)
      })
    );
  }

  obterRotuloStatusIniciativa(status: string): string {
    const mapa: Record<string, string> = {
      APROVADO: 'Aprovado/Público',
      REJEITADO: 'Rejeitado',
      RASCUNHO: 'Rascunho',
      EM_ESPERA: 'Em Espera'
    };
    return mapa[status] ?? status;
  }
  obterClasseStatusIniciativa(status: string): string {
    const mapa: Record<string, string> = {
      APROVADO: 'status-aprovado',
      REJEITADO: 'status-rejeitado',
      RASCUNHO: 'status-rascunho',
      EM_ESPERA: 'status-espera'
    };
    return mapa[status]?? 'status-rascunho';
  }

  salvarEdicaoIniciativa(): void {
    if (!this.iniciativaSelecionadaId) {
      return;
    }
    const formulario =this.formularioIniciativa.getRawValue();

    let dados: any;

    if (this.isAdmin() || this.editandoIniciativaRejeitada
    ) {
      dados = {
        nome: formulario.tituloIniciativa,
        responsavel: formulario.responsavelPreenchimento,
        unidade: formulario.unidadeResponsavel,
        objetivos: formulario.objetivosEstrategicos,
        percentual_evolucao: Number(formulario.evolucaoPercentual),
        observacao: formulario.observacoes,
        acoes: this.montarAcoesApi()
      };
    } else {

      dados = {
        percentual_evolucao: Number(formulario.evolucaoPercentual),
        observacao: formulario.observacoes,
        acoes: this.montarAcoesApi()
      };
    }

    this.iniciativaService .atualizarIniciativa(this.iniciativaSelecionadaId, dados).subscribe({
        next: () => {
          this.fecharModal();
          this.buscarIniciativa();
          this.modoEdicao = false;
          this.editandoIniciativaRejeitada = false;
          this.iniciativaSelecionadaId = null;
        },
        error: erro =>
          console.error('Erro ao atualizar iniciativa:', erro)
      });
  }
  responsavelSelecionado(): Usuario | null {

    const responsavelId =
      this.formularioIniciativa
        .get('responsavelPreenchimento')
        ?.value;

    if (!responsavelId) {
      return null;
    }

    return (
      this.usuarios().find(
        usuario =>
          Number(usuario.id) ===
          Number(responsavelId)
      ) ?? null
    );
  }
  obterSiglaUnidadeUsuario(
    usuario: Usuario
  ): string {

    if (
      usuario.unidade &&
      typeof usuario.unidade === 'object'
    ) {
      return usuario.unidade.sigla;
    }

    const unidadeId = Number(
      usuario.unidade
    );

    const unidade =
      this.unidades().find(
        item =>
          Number(item.id) === unidadeId
      );

    return unidade?.sigla ?? '';
  }
}
