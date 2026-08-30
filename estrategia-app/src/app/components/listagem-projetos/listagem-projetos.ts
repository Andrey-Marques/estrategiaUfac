import { Component } from '@angular/core';
import { InfoBar } from '../utils/info-bar/info-bar';
import { ProjetoEstrategico } from '../../model/projetoEstrategico';
import { ProjetoService } from '../../service/projeto.service';

@Component({
  selector: 'app-listagem-projetos',
  imports: [InfoBar],
  templateUrl: './listagem-projetos.html',
  styleUrl: './listagem-projetos.scss',
})
export class ListagemProjetos {}
