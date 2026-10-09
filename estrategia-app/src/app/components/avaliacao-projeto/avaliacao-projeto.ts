import { compararAcoes } from '../../model/comparacao-acoes';
import { StatusProjeto } from '../utils/status-projeto/status-projeto';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AcaoProjeto, ProjetoEstrategico } from '../../model/projetoEstrategico';
import { DiferencaRevisao, RevisaoEdicao } from '../../model/revisaoEdicao';

type ProjetoAvaliacao = ProjetoEstrategico & {
  responsavel_nome?: string;
  unidade_sigla?: string;
};

export interface DecisaoProjeto {
  projeto: ProjetoEstrategico;
  observacao: string;
}

@Component({
  selector: 'app-avaliacao-projeto',
  standalone: true,
  imports: [StatusProjeto, CommonModule, FormsModule],
  templateUrl: './avaliacao-projeto.html',
  styleUrl: './avaliacao-projeto.scss',
})
export class AvaliacaoProjeto {
  @Input({ required: true })
  projeto!: ProjetoAvaliacao;

  @Input() isAdmin = false;

  @Input() revisao: RevisaoEdicao | null = null;

  @Output()
  fechado = new EventEmitter<void>();

  @Output()
  aprovado = new EventEmitter<DecisaoProjeto>();

  @Output()
  rejeitado = new EventEmitter<DecisaoProjeto>();

  @Output()
  revisaoAprovada = new EventEmitter<RevisaoEdicao>();

  @Output()
  revisaoRejeitada = new EventEmitter<{ revisao: RevisaoEdicao; observacao: string }>();

  @Output()
  editar = new EventEmitter<ProjetoEstrategico>();

  observacao = '';
  mensagemErro = '';

  get modoAvaliacao(): boolean {
    return (
      this.isAdmin && (this.projeto.status === 'EM_ESPERA' || this.revisao?.status === 'PENDENTE')
    );
  }

  get modoVisualizacao(): boolean {
    return !this.modoAvaliacao;
  }
  get realizacoesValidas() {
    return (this.projeto.evolucoes ?? []).filter(
      (evolucao) => evolucao.tipo === 'REALIZACAO' && !!evolucao.descricao?.trim(),
    );
  }

  get proximosPassosValidos() {
    return (this.projeto.evolucoes ?? []).filter(
      (evolucao) => evolucao.tipo === 'PROXIMO_PASSO' && !!evolucao.descricao?.trim(),
    );
  }

  get diferencaRealizacoes(): DiferencaRevisao | null {
    return this.revisao?.diferencas['evolucoes'] ?? null;
  }

  get diferencaAcoes(): DiferencaRevisao | null {
    return this.revisao?.diferencas['acoes'] ?? null;
  }

  get comparacaoAcoes(): { anteriores: AcaoProjeto[]; propostas: AcaoProjeto[] } {
    const diferenca = this.diferencaAcoes;
    return compararAcoes<AcaoProjeto>(
      Array.isArray(diferenca?.anterior) ? diferenca.anterior : [],
      Array.isArray(diferenca?.proposto) ? diferenca.proposto : [],
    );
  }

  get acoesPropostas(): AcaoProjeto[] {
    return this.comparacaoAcoes.propostas;
  }

  get diferencaProgresso(): DiferencaRevisao | null {
    return this.revisao?.diferencas['percentual_progresso'] ?? null;
  }

  get revisaoPendente(): boolean {
    return this.revisao?.status === 'PENDENTE';
  }

  obterRotuloStatusRevisao(status: string): string {
    const rotulos: Record<string, string> = {
      PENDENTE: 'Alteração pendente de análise',
      APROVADA: 'Alteração aprovada',
      REJEITADA: 'Alteração rejeitada',
    };
    return rotulos[status] ?? status;
  }

  get realizacoesPropostas(): Array<{ descricao?: string }> {
    const evolucoes = this.diferencaRealizacoes?.proposto;
    return Array.isArray(evolucoes) ? evolucoes.filter((item) => item?.tipo === 'REALIZACAO') : [];
  }

  get proximosPassosPropostos(): Array<{ descricao?: string }> {
    const evolucoes = this.diferencaRealizacoes?.proposto;
    return Array.isArray(evolucoes)
      ? evolucoes.filter((item) => item?.tipo === 'PROXIMO_PASSO')
      : [];
  }

  get realizacoesRemovidas(): Array<{ descricao?: string }> {
    const anteriores = this.diferencaRealizacoes?.anterior;
    const propostos = this.diferencaRealizacoes?.proposto;
    if (!Array.isArray(anteriores) || !Array.isArray(propostos)) return [];

    return anteriores.filter(
      (item) =>
        item?.tipo === 'REALIZACAO' &&
        !propostos.some(
          (proposto) => proposto?.tipo === item.tipo && proposto?.descricao === item.descricao,
        ),
    );
  }

  get proximosPassosRemovidos(): Array<{ descricao?: string }> {
    const anteriores = this.diferencaRealizacoes?.anterior;
    const propostos = this.diferencaRealizacoes?.proposto;
    if (!Array.isArray(anteriores) || !Array.isArray(propostos)) return [];

    return anteriores.filter(
      (item) =>
        item?.tipo === 'PROXIMO_PASSO' &&
        !propostos.some(
          (proposto) => proposto?.tipo === item.tipo && proposto?.descricao === item.descricao,
        ),
    );
  }

  editarProjeto(): void {
    this.editar.emit(this.projeto);
  }

  fechar(): void {
    this.observacao = '';
    this.mensagemErro = '';
    this.fechado.emit();
  }

  aprovar(): void {
    if (this.revisao) {
      this.revisaoAprovada.emit(this.revisao);
      return;
    }

    this.aprovado.emit({
      projeto: this.projeto,
      observacao: this.observacao.trim(),
    });
  }

  rejeitar(): void {
    const observacao = this.observacao.trim();

    if (!observacao) {
      this.mensagemErro = 'Informe o motivo da rejeição.';
      return;
    }

    if (this.revisao) {
      this.revisaoRejeitada.emit({ revisao: this.revisao, observacao });
      return;
    }

    this.rejeitado.emit({
      projeto: this.projeto,
      observacao,
    });
  }

  obterRotuloStatus(): string {
    const rotulos: Record<string, string> = {
      APROVADO: 'Aprovado/Público',
      REJEITADO: 'Rejeitado',
      RASCUNHO: 'Rascunho',
      EM_ESPERA: 'Em espera',
    };

    return rotulos[this.projeto.status] ?? this.projeto.status;
  }

  obterClasseStatus(): string {
    const classes: Record<string, string> = {
      APROVADO: 'status-aprovado',
      REJEITADO: 'status-rejeitado',
      RASCUNHO: 'status-rascunho',
      EM_ESPERA: 'status-em-espera',
    };

    return classes[this.projeto.status] ?? 'status-rascunho';
  }
  get acoesAnteriores(): AcaoProjeto[] {
    return this.comparacaoAcoes.anteriores;
  }
  rotuloStatusAcao(status: string): string {
    return ({ PLANEJAMENTO: 'Não iniciada', ANDAMENTO: 'Em execução', CONCLUIDA: 'Concluída',
      CANCELADA: 'Cancelada' } as Record<string, string>)[status] ?? status;
  }
}
