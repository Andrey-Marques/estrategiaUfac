import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IndicadorEstrategico } from '../../model/indicadorEstrategico';
import { IndicadorService } from '../../service/indicador.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ObjetivoEstrategico } from '../../model/objetivoEstrategico';
import { UsuarioService } from '../../service/usuario.service';
import { UnidadeService } from '../../service/unidade.service';
import { ObjetivoService } from '../../service/objetivo.service';
import { Usuario } from '../../model/usuario';
import { Unidade } from '../../model/unidade';
import * as katex from 'katex';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-listagem-indicadores',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './listagem-indicadores.html',
  styleUrl: './listagem-indicadores.scss',
})
export class ListagemIndicadores {
  formularioIndicador: FormGroup;
  usuarios = signal<Usuario[]>([]);
  unidades = signal<Unidade[]>([]);
  objetivos = signal<ObjetivoEstrategico[]>([])
  usuarioAtual = signal<Usuario | null>(null);
  isAdmin = signal(false);
  objetivoSelecionado: number | null = null;
  formulaRenderizada: SafeHtml | null = null;
  indicadores = signal<IndicadorEstrategico[]>([]);

  constructor(
    private indicadorService: IndicadorService,
    private usuarioService: UsuarioService,
    private unidade: UnidadeService,
    private objetivoService: ObjetivoService,
    private fb: FormBuilder,
    private sanitizer: DomSanitizer
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
      observacao: ['']
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
      error: (erro) => console.error('erro ao buscar indicadores', erro)
    });
  }

  etapaAtual = 1;

  previewFormula: string | null = null;

  metas: {
    ano: number | null;
    prevista: number | null;
    alcancada: number | null;
  }[] = [
    {
      ano: new Date().getFullYear(),
      prevista: null,
      alcancada: null
    }
  ];


  /* =========================
    NAVEGAÇÃO
    ========================= */

  avancar(): void {
    if (this.etapaAtual < 4) {
      this.etapaAtual++;
    }
  }


  voltar(): void {
    if (this.etapaAtual > 1) {
      this.etapaAtual--;
    }
  }


  irParaEtapa(etapa: number): void {
    if (etapa >= 1 && etapa <= 4) {
      this.etapaAtual = etapa;
    }
  }

  adicionarMeta(): void {

    const ultimoAno =
      this.metas.length > 0
        ? Number(this.metas[this.metas.length - 1].ano)
        : new Date().getFullYear() - 1;


    this.metas.push({
      ano: ultimoAno + 1,
      prevista: null,
      alcancada: null
    });

  }


  removerMeta(indice: number): void {

    const meta = this.metas[indice];

    const confirmar = window.confirm(
      `Tem certeza que deseja excluir a meta do ano ${meta.ano ?? ''}?`
    );

    if (!confirmar) {
      return;
    }

    this.metas.splice(indice, 1);
  }

  buscarUsuarioAtual(): void {

    this.usuarioService.getAtual().subscribe({

      next: usuario => {
        this.usuarioAtual.set(usuario);
        this.isAdmin.set(usuario.papel === 'ADMIN');

      },
      error: erro =>
        console.error('Erro ao buscar usuário:', erro)

    });

  }
  private observarResponsavelSelecionado(): void {

    this.formularioIndicador
      .get('responsavel')?.valueChanges.subscribe(responsavelId => {

        if (!responsavelId) {
          this.formularioIndicador.patchValue(
            {unidade: null},
            {emitEvent: false}
          );
          return;
        }

        const responsavel = this.usuarios().find(usuario => Number(usuario.id) === Number(responsavelId));

        if (!responsavel) {
          return;
        }

        const unidadeId =
          typeof responsavel.unidade === 'number' ? responsavel.unidade : responsavel.unidade?.id;
        this.formularioIndicador.patchValue(
          {unidade: unidadeId ?? null},
          {emitEvent: false}
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

  obterResponsavelSelecionado(): Usuario | null {
    const id = Number(
      this.formularioIndicador.get('responsavel')?.value
    );

    return this.usuarios().find(
      usuario => usuario.id === id
    ) ?? null;
  }

  selecionarObjetivo(objetivoId: number): void {
    this.objetivoSelecionado = objetivoId;
  }
  buscarUsuarios(): void {

    this.usuarioService.get().subscribe({
      next: usuarios =>
        this.usuarios.set(usuarios),
      error: erro =>
        console.error('Erro ao buscar usuários:', erro)
    });
  }


  buscarUnidades(): void {

    this.unidade.get().subscribe({
      next: unidades =>
        this.unidades.set(unidades),

      error: erro =>
        console.error('Erro ao buscar unidades:', erro
        )
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

    return this.unidades().find(
      unidade => unidade.id === unidadeId
    );
  }

  buscarObjetivos(): void {
    this.objetivoService.get().subscribe({
      next: objetivos =>
        this.objetivos.set(objetivos),
      error: erro =>
        console.error('Erro ao buscar objetivos:', erro)
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
    const dados = {nome: formulario.nome,
      responsavel: formulario.responsavel,
      unidade: formulario.unidade,
      objetivo: this.objetivoSelecionado,
      finalidade: formulario.finalidade,
      polaridade: formulario.polaridade,
      metodo_calculo: formulario.metodoCalculo,
      formula: formulario.formula || '',
      observacao: formulario.observacao || '',
      status,
      evolucao_indicador: this.metas.map(meta => ({
          ano: String(meta.ano ?? ''),
          meta_prevista:  String(meta.prevista ?? ''),
          meta_alcancada: String(meta.alcancada ?? '')
        }))
    };

    this.indicadorService.criarIndicador(dados).subscribe({
        next: indicador => {
          this.buscarIndicador();
          this.fecharFormulario();
        },
        error: erro => {
          console.error('Erro ao criar indicador:', erro);

        }

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
      observacao: ''
    });

    this.objetivoSelecionado = null;
    this.formulaRenderizada = '';
    this.metas = [
      {
        ano: new Date().getFullYear(),
        prevista: null,
        alcancada: null
      }
    ];
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
        displayMode: true
      });
      this.formulaRenderizada = this.sanitizer.bypassSecurityTrustHtml(htmlFormula);

    } catch (erro) {
      console.error('Erro ao renderizar fórmula:', erro);
      this.formulaRenderizada = null;
    }
  }
}
