import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ObjetivoService } from '../../../service/objetivo.service';
import { ObjetivoEstrategico } from '../../../model/objetivoEstrategico';
import { IniciativaService } from '../../../service/iniciativa.service';

export interface AcaoIniciativa {
  descricaoAcao: string;
  prazoInicio: string;
  prazoFim: string;
  custoEstimado: string;
  statusAtual: string;
}

@Component({
  selector: 'app-formulario-iniciativas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './formulario-iniciativas.html',
  styleUrls: ['./formulario-iniciativas.scss']
})
export class FormularioIniciativas implements OnInit {
  objetivos = signal<ObjetivoEstrategico[]>([]);
  acoesIniciativa = signal<AcaoIniciativa[]>([]);
  formularioIniciativa: FormGroup;
  formularioAcaoInterno: FormGroup;
  etapaAtual = 1;
  submodalAcaoAberto = false;
  objetivosSelecionados : number[] = [];

  constructor(private objetivoService: ObjetivoService, private construtorFormulario: FormBuilder, private iniciativaService: IniciativaService) {
    this.formularioIniciativa = this.construtorFormulario.group({
      tituloIniciativa: ['', Validators.required],
      responsavelPreenchimento: ['', Validators.required],
      unidadeResponsavel: [''],
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

  ngOnInit(): void { this.buscarObjetivosEstrategicos(); }

  salvarIniciativa():void{
    const observacoes = this.formularioIniciativa.value.observacoes || '';
    const dados = {
      nome : this.formularioIniciativa.value.tituloIniciativa,
      responsavel : this.formularioIniciativa.value.responsavelPreenchimento,
      unidade : this.formularioIniciativa.value.unidadeResponsavel,
      objetivos : this.formularioIniciativa.value.objetivosEstrategicos,
      percentual_evolucao : this.formularioIniciativa.value.evolucaoPercentual,
      observacao: observacoes,
      status: 'PLANEJAMENTO',
      acoes: this.acoesIniciativa().map(acao => ({
        nome: acao.descricaoAcao,
        prazo_inicio: this.converterDataParaApi(acao.prazoInicio),
        prazo_fim: this.converterDataParaApi(acao.prazoFim),
        custo: acao.custoEstimado,
        status: this.converterStatusParaApi(acao.statusAtual)
      }))
    }

    console.log('enviado', dados);

    this.iniciativaService.criarIniciativa(dados).subscribe({
      next: (resposta) => {
        console.log('Iniciativa criada', resposta)
      },
      error: (erro) => {
        console.error('Erro ao criar iniciativa', erro);
      }
    })
  }

  buscarObjetivosEstrategicos(): void {
    this.objetivoService.get().subscribe({
      next: (dados) => this.objetivos.set(dados),
      error: (erro) => console.error('Erro ao buscar objetivos estratégicos:', erro)
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

  obterRotuloStatus(status: string): string {
    const mapa: Record<string, string> = { 'nao-iniciada': 'Não iniciada', 'em-execucao': 'Em execução', 'concluida': 'Concluída' };
    return mapa[status] || status;
  }

  irParaEtapa(numeroEtapa: number): void {
    if (numeroEtapa === this.etapaAtual) return;
    if (this.etapaAtual === 1 && numeroEtapa > 1 && !this.validarEtapaUm()) return;
    this.etapaAtual = numeroEtapa;
  }

  private validarEtapaUm(): boolean {
    const campoTitulo = this.formularioIniciativa.get('tituloIniciativa');
    const campoResp = this.formularioIniciativa.get('responsavelPreenchimento');
    if (campoTitulo?.invalid) campoTitulo.markAsTouched();
    if (campoResp?.invalid) campoResp.markAsTouched();
    const selecionados = this.formularioIniciativa.get('objetivosEstrategicos')?.value || [];
    if (selecionados.length === 0) alert('Selecione pelo menos um Objetivo Estratégico.');
    return !campoTitulo?.invalid && !campoResp?.invalid && selecionados.length > 0;
  }

  avancar(): void {
    if (this.etapaAtual === 1) { if (this.validarEtapaUm()) this.etapaAtual = 2; return; }
    if (this.etapaAtual < 3) this.etapaAtual++;
  }

  voltar(): void { if (this.etapaAtual > 1) this.etapaAtual--; }

  salvarRascunho(): void {
    console.log('Rascunho salvo:', { ...this.formularioIniciativa.value, acoes: this.acoesIniciativa() });
  }

  submeterParaAnalise(): void {
    if (this.formularioIniciativa.invalid) {
      this.formularioIniciativa.markAllAsTouched();
      alert('Preencha todos os campos obrigatórios antes de submeter.');
      return;
    }
    console.log('Enviado para análise:', { ...this.formularioIniciativa.value, acoes: this.acoesIniciativa() });
  }
}
