import { Component, inject, signal } from '@angular/core';
import { InfoBar } from '../utils/info-bar/info-bar';
import { IniciativaEstrategica } from '../../model/iniciativaEstrategica';
import { IniciativaService } from '../../service/iniciativa.service';
import { CommonModule, NgForOf } from '@angular/common';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-listagem-iniciativas',
  imports: [InfoBar, NgForOf, DatePipe],
  templateUrl: './listagem-iniciativas.html',
  styleUrl: './listagem-iniciativas.scss',
  providers: [DatePipe],
})
export class ListagemIniciativas {
  iniciativas = signal<IniciativaEstrategica[]>([])
  private datePipe = inject(DatePipe);
  constructor(private iniciativaService: IniciativaService){}

  ngOnInit(): void {
    this.buscarIniciativa();
  }

  buscarIniciativa(): void {
    this.iniciativaService.get().subscribe({
      next: (iniciativa) => {this.iniciativas.set(iniciativa)
        console.log(iniciativa)
      },
      error: (erro) => {console.error('erro ao buscar iniciativas:', erro)}
    })
  }
  
}
