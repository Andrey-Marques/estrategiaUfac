import { ObjetivoService } from './../../service/objetivo.service';
import { Component, OnInit, signal } from '@angular/core';
import {
  ObjetivoEstrategico,
  CriarObjetivoEstrategico
} from '../../model/objetivoEstrategico';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

@Component({
  selector: 'app-formulario-iniciativas',
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './formulario-iniciativas.html',
  styleUrl: './formulario-iniciativas.scss',
})
export class FormularioIniciativas implements OnInit {

  objetivos = signal<ObjetivoEstrategico[]>([]);

  formularioIniciativa: FormGroup;

  etapaAtual = 1;

  constructor(
    private objetivoService: ObjetivoService,
    private construtorFormulario: FormBuilder
  ) {

    this.formularioIniciativa = this.construtorFormulario.group({

      tituloIniciativa: [
        '',
        Validators.required
      ],

      responsavelPreenchimento: [
        '',
        Validators.required
      ],

      unidadeResponsavel: [
        ''
      ],

      objetivosEstrategicos: [
        [],
        Validators.required
      ]

    });

  }

  ngOnInit(): void {

    this.buscarObjetivosEstrategicos();

  }


  /**
   * Busca os objetivos estratégicos cadastrados no sistema.
   */
  buscarObjetivosEstrategicos(): void {

    this.objetivoService.get().subscribe({

      next: (dados) => {

        console.log('Dados recebidos:', dados);

        this.objetivos.set(dados);

        console.log(
          'Quantidade de objetivos:',
          this.objetivos().length
        );

      },

      error: (erro) => {

        console.error(
          'Erro ao buscar objetivos estratégicos:',
          erro
        );

      }

    });

  }


  /**
   * Adiciona ou remove um objetivo estratégico
   * da lista de objetivos selecionados.
   */
  selecionarObjetivo(
    objetivo: ObjetivoEstrategico,
    evento: Event
  ): void {

    const caixaSelecao =
      evento.target as HTMLInputElement;

    const objetivosSelecionados =
      this.formularioIniciativa.get(
        'objetivosEstrategicos'
      )?.value || [];

    if (caixaSelecao.checked) {

      this.formularioIniciativa.patchValue({

        objetivosEstrategicos: [
          ...objetivosSelecionados,
          objetivo.id

        ]

      });

    } else {

      this.formularioIniciativa.patchValue({

        objetivosEstrategicos:
          objetivosSelecionados.filter(
            (id: number) => id !== objetivo.id
          )

      });

    }

  }


  /**
   * Verifica se determinado objetivo está selecionado.
   */
  objetivoEstaSelecionado(
    objetivo: ObjetivoEstrategico
  ): boolean {

    const objetivosSelecionados =
      this.formularioIniciativa.get(
        'objetivosEstrategicos'
      )?.value || [];

    return objetivosSelecionados.includes(
      objetivo.id
    );

  }


  /**
   * Avança para a próxima etapa do formulário.
   */
  avancar(): void {

    if (this.etapaAtual === 1) {

      if (
        this.formularioIniciativa.get(
          'tituloIniciativa'
        )?.invalid
      ) {

        this.formularioIniciativa
          .get('tituloIniciativa')
          ?.markAsTouched();

        return;

      }

      const objetivosSelecionados =
        this.formularioIniciativa.get(
          'objetivosEstrategicos'
        )?.value || [];

      if (objetivosSelecionados.length === 0) {

        alert(
          'Selecione pelo menos um Objetivo Estratégico.'
        );

        return;

      }

      this.etapaAtual = 2;

      return;

    }

    if (this.etapaAtual < 3) {

      this.etapaAtual++;

    }

  }


  /**
   * Volta para a etapa anterior do formulário.
   */
  voltar(): void {

    if (this.etapaAtual > 1) {

      this.etapaAtual--;

    }

  }


  /**
   * Retorna os dados preenchidos no formulário.
   */
  obterDadosFormulario(): void {

    console.log(
      'Dados do formulário:',
      this.formularioIniciativa.value
    );

  }

}