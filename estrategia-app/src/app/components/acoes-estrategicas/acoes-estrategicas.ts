import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { HeaderPublico } from '../utils/header-publico/header-publico';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Rodape } from '../utils/rodape/rodape';

interface AbaEstrategica {
  id: string;
  label: string;
}

interface FiltroAtivo {
  label: string;
}

interface Indicador {
  codigo: string;
  titulo: string;
  unidade: string;
  responsavel: string;
  dataReferencia: string;
  dataAtualizacao: string;
}

@Component({
  selector: 'app-acoes-estrategicas',
  imports: [CommonModule, HeaderPublico, RouterModule, FormsModule, Rodape],
  templateUrl: './acoes-estrategicas.html',
  styleUrl: './acoes-estrategicas.scss',
})
export class AcoesEstrategicas {

  // ==========================================================
  // ABAS
  // ==========================================================

  abas: AbaEstrategica[] = [
    { id: 'projetos', label: 'Projetos Estratégicos' },
    { id: 'indicadores', label: 'Indicadores Estratégicos' },
    { id: 'iniciativas', label: 'Iniciativas Estratégicas' },
  ];

  abaAtiva = 'indicadores';

  selecionarAba(id: string): void {
    this.abaAtiva = id;
  }

  // ==========================================================
  // FILTROS ATIVOS
  // ==========================================================

  filtrosAtivos: FiltroAtivo[] = [
    { label: 'Unidade: PROEX' },
  ];

  removerFiltro(filtro: FiltroAtivo): void {
    this.filtrosAtivos = this.filtrosAtivos.filter((f) => f !== filtro);
  }

  limparFiltros(): void {
    this.filtrosAtivos = [];
  }

  // ==========================================================
  // LISTA DE INDICADORES
  // ==========================================================

  indicadores: Indicador[] = [
    { codigo: 'OE1', titulo: 'Taxa de Diplomação da Graduação – TDG', unidade: 'PROGRAD', responsavel: 'MARIA BEATRIZ FULANA', dataReferencia: '20/07/2026', dataAtualizacao: '2026-07-09' },
    { codigo: 'OE2', titulo: 'Índice de Evasão Acadêmica', unidade: 'PROGRAD', responsavel: 'JOÃO PEDRO SILVA', dataReferencia: '15/06/2026', dataAtualizacao: '2026-06-15' },
    { codigo: 'OE3', titulo: 'Participação em Programas de Extensão', unidade: 'PROEX', responsavel: 'ANA CLARA SOUZA', dataReferencia: '02/08/2026', dataAtualizacao: '2026-08-02' },
    { codigo: 'OE1', titulo: 'Execução Orçamentária Anual', unidade: 'PROPLAN', responsavel: 'CARLOS EDUARDO LIMA', dataReferencia: '10/05/2026', dataAtualizacao: '2026-05-10' },
    { codigo: 'OE2', titulo: 'Projetos de Extensão Concluídos', unidade: 'PROEX', responsavel: 'FERNANDA ALVES', dataReferencia: '28/07/2026', dataAtualizacao: '2026-07-28' },
  ];

  filtrar(): void {
   }
}