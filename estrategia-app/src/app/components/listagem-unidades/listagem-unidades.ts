import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { Unidade } from '../../model/unidade';
import { UnidadeService } from '../../service/unidade.service';
import { Paginacao } from '../utils/paginacao/paginacao';

@Component({
  selector: 'app-listagem-unidades',
  imports: [CommonModule, ReactiveFormsModule, Paginacao],
  templateUrl: './listagem-unidades.html',
  styleUrl: './listagem-unidades.scss',
})
export class ListagemUnidades implements OnInit {
  private service = inject(UnidadeService);
  private fb = inject(FormBuilder);
  unidades = signal<Unidade[]>([]);
  pesquisa = signal('');
  carregando = signal(false);
  salvando = signal(false);
  erro = signal('');
  sucesso = signal('');
  erroModal = signal('');
  modalAberto = signal(false);
  unidadeEmEdicao = signal<Unidade | null>(null);
  unidadeParaExcluir = signal<Unidade | null>(null);
  formulario = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(255), Validators.pattern(/\S/)]],
    sigla: ['', [Validators.required, Validators.maxLength(10), Validators.pattern(/\S/)]],
  });
  unidadesFiltradas = computed(() => {
    const termo = this.normalizar(this.pesquisa().trim());
    return this.unidades().filter(u => this.normalizar(`${u.nome} ${u.sigla}`).includes(termo));
  });
  paginaSelecionada = signal(1);
  itensPorPagina = signal(10);
  paginaAtual = computed(() => Math.min(this.paginaSelecionada(), Math.max(1, Math.ceil(this.unidadesFiltradas().length / this.itensPorPagina()))));
  unidadesPaginadas = computed(() => {
    const inicio = (this.paginaAtual() - 1) * this.itensPorPagina();
    return this.unidadesFiltradas().slice(inicio, inicio + this.itensPorPagina());
  });

  alterarItensPorPagina(quantidade: number): void {
    this.itensPorPagina.set(quantidade);
    this.paginaSelecionada.set(1);
  }

  ngOnInit(): void { this.carregar(); }

  private normalizar(valor: string): string {
    return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set('');
    this.service.get().pipe(finalize(() => this.carregando.set(false))).subscribe({
      next: unidades => this.unidades.set(unidades),
      error: () => this.erro.set('Não foi possível carregar as unidades. Tente novamente.'),
    });
  }

  pesquisar(evento: Event): void {
    this.pesquisa.set((evento.target as HTMLInputElement).value);
    this.paginaSelecionada.set(1);
  }

  abrirModal(unidade: Unidade | null = null): void {
    this.unidadeEmEdicao.set(unidade);
    this.formulario.reset({ nome: unidade?.nome ?? '', sigla: unidade?.sigla ?? '' });
    this.erroModal.set('');
    this.sucesso.set('');
    this.modalAberto.set(true);
  }

  @HostListener('document:keydown.escape')
  fecharModal(): void {
    if (this.salvando()) return;
    this.modalAberto.set(false);
    this.unidadeParaExcluir.set(null);
    this.erroModal.set('');
  }

  salvar(): void {
    if (this.salvando()) return;
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) return;
    const valores = this.formulario.getRawValue();
    const dados = { nome: valores.nome.trim(), sigla: valores.sigla.trim().toUpperCase() };
    const unidade = this.unidadeEmEdicao();
    const requisicao = unidade ? this.service.editar(unidade.id, dados) : this.service.criar(dados);
    this.salvando.set(true);
    this.erroModal.set('');
    requisicao.pipe(finalize(() => this.salvando.set(false))).subscribe({
      next: salva => {
        this.unidades.update(lista => [...lista.filter(u => u.id !== salva.id), salva].sort((a, b) => a.sigla.localeCompare(b.sigla)));
        this.modalAberto.set(false);
        this.sucesso.set(unidade ? 'Unidade atualizada com sucesso.' : 'Unidade cadastrada com sucesso.');
      },
      error: erro => this.erroModal.set(this.mensagemErro(erro)),
    });
  }

  confirmarExclusao(unidade: Unidade): void {
    this.erroModal.set('');
    this.sucesso.set('');
    this.unidadeParaExcluir.set(unidade);
  }

  excluir(): void {
    const unidade = this.unidadeParaExcluir();
    if (!unidade || this.salvando()) return;
    this.salvando.set(true);
    this.erroModal.set('');
    this.service.excluir(unidade.id).pipe(finalize(() => this.salvando.set(false))).subscribe({
      next: () => {
        this.unidades.update(lista => lista.filter(u => u.id !== unidade.id));
        this.unidadeParaExcluir.set(null);
        this.sucesso.set('Unidade excluída com sucesso.');
      },
      error: erro => this.erroModal.set(this.mensagemErro(erro)),
    });
  }

  private mensagemErro(erro: HttpErrorResponse): string {
    if (erro.status === 403) return 'Somente administradores podem gerenciar unidades.';
    const dados = erro.error;
    if (dados && typeof dados === 'object') {
      const mensagens = Object.values(dados).flat().filter(v => typeof v === 'string');
      if (mensagens.length) return mensagens.join(' ');
    }
    return 'Não foi possível concluir a operação. Tente novamente.';
  }
}
