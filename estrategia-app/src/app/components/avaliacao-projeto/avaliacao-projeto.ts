import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProjetoEstrategico } from '../../model/projetoEstrategico';
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
  imports: [CommonModule, FormsModule],
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

  get diferencaOrcamento(): DiferencaRevisao | null {
    return this.revisao?.diferencas['evolucoesOrcamentarias'] ?? null;
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

  get orcamentosPropostos(): Array<{
    valor?: string | number;
    descricao?: string;
    data_registro?: string;
  }> {
    const orcamentos = this.diferencaOrcamento?.proposto;
    return Array.isArray(orcamentos) ? orcamentos : [];
  }

  get orcamentosRemovidos(): Array<{
    valor?: string | number;
    descricao?: string;
    data_registro?: string;
  }> {
    const anteriores = this.diferencaOrcamento?.anterior;
    const propostos = this.diferencaOrcamento?.proposto;
    if (!Array.isArray(anteriores) || !Array.isArray(propostos)) return [];

    return anteriores.filter(
      (item) =>
        !propostos.some(
          (proposto) =>
            String(proposto?.valor) === String(item?.valor) &&
            proposto?.descricao === item?.descricao &&
            proposto?.data_registro === item?.data_registro,
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
}
