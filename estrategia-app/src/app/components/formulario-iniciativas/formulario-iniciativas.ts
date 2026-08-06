import { ObjetivoService } from './../../service/objetivo.service';
import { Component, OnInit, signal } from '@angular/core';
import { ObjetivoEstrategico, CriarObjetivoEstrategico } from '../../model/objetivoEstrategico';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-formulario-iniciativas',
  imports: [
    CommonModule
  ],
  templateUrl: './formulario-iniciativas.html',
  styleUrl: './formulario-iniciativas.scss',
})
export class FormularioIniciativas implements OnInit {

  objetivos = signal<ObjetivoEstrategico[]>([]);

  constructor(private objetivoService: ObjetivoService) {}

  ngOnInit(): void {

    this.objetivoService.get().subscribe({
      next: (dados) => {
        console.log('Dados recebidos:', dados);
        this.objetivos.set(dados);
        console.log('Quantidade:', this.objetivos().length);
      },
      error: (erro) => {

        console.error('Erro ao buscar:', erro);
      }
    });

  }
}
