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

  indicadores = signal<IndicadorEstrategico[]>([]);

  constructor(private indicadorService: IndicadorService, private usuarioService: UsuarioService, private unidade: UnidadeService, private objetivoService: ObjetivoService, private fb: FormBuilder) {

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


  buscarObjetivos(): void {
    this.objetivoService.get().subscribe({
      next: objetivos =>
        this.objetivos.set(objetivos),
      error: erro =>
        console.error('Erro ao buscar objetivos:', erro)
    });
  }

  salvarIndicador(
    status: 'RASCUNHO' | 'EM_ESPERA' | 'APROVADO'
  ): void {

    if (
      status !== 'RASCUNHO' &&
      this.formularioIndicador.invalid
    ) {

      this.formularioIndicador.markAllAsTouched();

      alert(
        'Preencha os campos obrigatórios.'
      );

      return;
    }


    if (
      status !== 'RASCUNHO' &&
      !this.objetivoSelecionado
    ) {

      alert(
        'Selecione um objetivo estratégico.'
      );

      this.etapaAtual = 1;

      return;
    }


    const formulario =
      this.formularioIndicador.getRawValue();


    const dados = {

      nome:
        formulario.nome,

      responsavel:
        formulario.responsavel,

      unidade:
        formulario.unidade,

      objetivo:
        this.objetivoSelecionado,

      finalidade:
        formulario.finalidade,

      polaridade:
        formulario.polaridade,

      metodo_calculo:
        formulario.metodoCalculo,

      formula:
        formulario.formula || '',

      observacao:
        formulario.observacao || '',

      status,

      evolucao_indicador:
        this.metas.map(meta => ({

          ano:
            String(meta.ano ?? ''),

          meta_prevista:
            String(meta.prevista ?? ''),

          meta_alcancada:
            String(meta.alcancada ?? '')

        }))

    };


    console.log(
      'Indicador enviado:',
      dados
    );


    this.indicadorService
      .criarIndicador(dados)
      .subscribe({

        next: indicador => {

          console.log(
            'Indicador criado:',
            indicador
          );

          this.buscarIndicador();

          this.fecharFormulario();

        },

        error: erro => {

          console.error(
            'Erro ao criar indicador:',
            erro
          );

          console.error(
            'Resposta do backend:',
            erro.error
          );

        }

      });

  }

  formularioAberto = false;

  fecharFormulario(): void {
    this.formularioAberto = false;
  }
}
