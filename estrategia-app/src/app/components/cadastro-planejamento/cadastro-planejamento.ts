import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { PlanejamentoService } from '../../service/planejamento.service';
import { Pdi, Planejamento } from '../../model/planejamento';
import { ObjetivoEstrategico } from '../../model/objetivoEstrategico';
import { ObjetivoService } from '../../service/objetivo.service';

@Component({
  selector: 'app-cadastro-planejamento',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cadastro-planejamento.html',
  styleUrl: './cadastro-planejamento.scss',
})
export class CadastroPlanejamento implements OnInit {
  private readonly service = inject(PlanejamentoService);
  private readonly fb = inject(FormBuilder);
  private readonly objetivoService = inject(ObjetivoService);

  planejamentos = signal<Planejamento[]>([]);
  pdis = signal<Pdi[]>([]);
  carregando = signal(false);
  salvandoPlanejamento = signal(false);
  salvandoPdi = signal(false);
  salvandoObjetivo = signal(false);
  carregandoObjetivos = signal(false);
  erroCarregamento = signal('');
  erroPlanejamento = signal('');
  erroPdi = signal('');
  erroObjetivos = signal('');
  sucessoObjetivo = signal('');
  sucesso = signal('');
  modalAberto = signal<'planejamento' | 'pdi' | null>(null);
  planejamentoEmEdicao = signal<Planejamento | null>(null);
  pdiEmEdicao = signal<Pdi | null>(null);
  planejamentoDosObjetivos = signal<Planejamento | null>(null);
  objetivosDoPlanejamento = signal<ObjetivoEstrategico[]>([]);
  pdiExcluindoId = signal<number | null>(null);
  planejamentoExcluindoId = signal<number | null>(null);

  readonly pdisOrdenados = computed(() =>
    [...this.pdis()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
  );

  readonly formularioPlanejamento = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(100), Validators.pattern(/\S/)]],
    data_inicio: ['', Validators.required],
    data_fim: ['', Validators.required],
    status: this.fb.nonNullable.control<'Vigente' | 'Expirado'>('Vigente', Validators.required),
  });

  readonly formularioObjetivo = this.fb.nonNullable.group({
    codigo: ['', [Validators.required, Validators.maxLength(8), Validators.pattern(/\S/)]],
    descricao: ['', [Validators.required, Validators.pattern(/\S/)]],
  });

  readonly formularioPdi = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(100), Validators.pattern(/\S/)]],
    data_inicio: ['', Validators.required],
    data_fim: ['', Validators.required],
    status: this.fb.nonNullable.control<'Vigente' | 'Expirado'>('Vigente', Validators.required),
    planejamento: [0, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.carregarPlanejamentos();
  }

  carregarPlanejamentos(): void {
    this.carregando.set(true);
    this.erroCarregamento.set('');
    let pendentes = 2;
    const concluirCarregamento = () => {
      pendentes -= 1;
      if (pendentes === 0) this.carregando.set(false);
    };

    this.service.listarPlanejamentos().pipe(finalize(concluirCarregamento)).subscribe({
      next: planejamentos => this.planejamentos.set(planejamentos),
      error: () => this.erroCarregamento.set('Não foi possível carregar os planejamentos. Tente novamente.'),
    });
    this.service.listarPdis().pipe(finalize(concluirCarregamento)).subscribe({
      next: pdis => this.pdis.set(pdis),
      error: () => this.erroCarregamento.set('Não foi possível carregar os PDIs. Tente novamente.'),
    });
  }

  abrirModal(tipo: 'planejamento' | 'pdi'): void {
    this.sucesso.set('');
    this.erroPlanejamento.set('');
    this.erroPdi.set('');
    this.planejamentoEmEdicao.set(null);
    this.pdiEmEdicao.set(null);
    if (tipo === 'planejamento') {
      this.formularioPlanejamento.reset({
        nome: '',
        data_inicio: '',
        data_fim: '',
        status: 'Vigente',
      });
    } else {
      this.formularioPdi.reset({
        nome: '',
        data_inicio: '',
        data_fim: '',
        status: 'Vigente',
        planejamento: 0,
      });
    }
    this.modalAberto.set(tipo);
  }

  editarPlanejamento(planejamento: Planejamento): void {
    this.sucesso.set('');
    this.erroPlanejamento.set('');
    this.planejamentoEmEdicao.set(planejamento);
    this.pdiEmEdicao.set(null);
    this.formularioPlanejamento.reset({
      nome: planejamento.nome,
      data_inicio: planejamento.data_inicio,
      data_fim: planejamento.data_fim,
      status: planejamento.status,
    });
    this.modalAberto.set('planejamento');
  }

  editarPdi(pdi: Pdi): void {
    this.sucesso.set('');
    this.erroPdi.set('');
    this.pdiEmEdicao.set(pdi);
    this.planejamentoEmEdicao.set(null);
    this.formularioPdi.reset({
      nome: pdi.nome,
      data_inicio: pdi.data_inicio,
      data_fim: pdi.data_fim,
      status: pdi.status,
      planejamento: pdi.planejamento,
    });
    this.modalAberto.set('pdi');
  }

  fecharModal(): void {
    if (this.salvandoPlanejamento() || this.salvandoPdi()) return;
    this.modalAberto.set(null);
  }

  @HostListener('document:keydown.escape')
  fecharModalComEscape(): void {
    if (this.planejamentoDosObjetivos()) {
      this.fecharObjetivos();
      return;
    }
    this.fecharModal();
  }

  nomePlanejamento(id: number): string {
    return this.planejamentos().find(planejamento => planejamento.id === id)?.nome
      ?? 'Planejamento não encontrado';
  }

  quantidadePdis(planejamentoId: number): number {
    return this.pdis().filter(pdi => pdi.planejamento === planejamentoId).length;
  }

  quantidadeObjetivos(planejamento: Planejamento): number {
    return planejamento.quantidade_objetivos ?? this.objetivosDoPlanejamento().filter(
      objetivo => objetivo.planejamento === planejamento.id,
    ).length;
  }

  planejamentoTemIniciativas(planejamentoId: number): boolean {
    return this.pdis().some(
      pdi => pdi.planejamento === planejamentoId && (pdi.quantidade_iniciativas ?? 0) > 0,
    );
  }

  podeExcluirPlanejamento(planejamento: Planejamento): boolean {
    return this.quantidadeObjetivos(planejamento) === 0 &&
      !this.planejamentoTemIniciativas(planejamento.id);
  }

  abrirObjetivos(planejamento: Planejamento): void {
    this.planejamentoDosObjetivos.set(planejamento);
    this.objetivosDoPlanejamento.set([]);
    this.erroObjetivos.set('');
    this.sucessoObjetivo.set('');
    this.formularioObjetivo.reset({ codigo: '', descricao: '' });
    this.carregandoObjetivos.set(true);
    this.objetivoService.get().pipe(finalize(() => this.carregandoObjetivos.set(false))).subscribe({
      next: objetivos => this.objetivosDoPlanejamento.set(
        objetivos
          .filter(objetivo => objetivo.planejamento === planejamento.id)
          .sort((a, b) => a.codigo.localeCompare(b.codigo, 'pt-BR')),
      ),
      error: erro => {
        console.error('Erro ao carregar objetivos do planejamento:', erro);
        this.erroObjetivos.set('Não foi possível carregar os objetivos deste planejamento.');
      },
    });
  }

  fecharObjetivos(): void {
    if (this.salvandoObjetivo()) return;
    this.planejamentoDosObjetivos.set(null);
    this.erroObjetivos.set('');
    this.sucessoObjetivo.set('');
  }

  salvarObjetivo(): void {
    const planejamento = this.planejamentoDosObjetivos();
    if (!planejamento || this.salvandoObjetivo()) return;
    this.formularioObjetivo.markAllAsTouched();
    this.erroObjetivos.set('');
    this.sucessoObjetivo.set('');
    if (this.formularioObjetivo.invalid) return;

    const valores = this.formularioObjetivo.getRawValue();
    this.salvandoObjetivo.set(true);
    this.objetivoService.criar({
      codigo: valores.codigo.trim(),
      descricao: valores.descricao.trim(),
      planejamento: planejamento.id,
    }).pipe(finalize(() => this.salvandoObjetivo.set(false))).subscribe({
      next: objetivo => {
        this.objetivosDoPlanejamento.update(objetivos =>
          [...objetivos, objetivo].sort((a, b) => a.codigo.localeCompare(b.codigo, 'pt-BR')),
        );
        this.planejamentos.update(planejamentos =>
          planejamentos.map(item => item.id === planejamento.id
            ? { ...item, quantidade_objetivos: (item.quantidade_objetivos ?? 0) + 1 }
            : item,
          ),
        );
        this.formularioObjetivo.reset({ codigo: '', descricao: '' });
        this.sucessoObjetivo.set('Objetivo cadastrado com sucesso.');
      },
      error: erro => {
        console.error('Erro ao cadastrar objetivo:', erro);
        this.erroObjetivos.set(this.mensagemErro(erro, 'Não foi possível cadastrar o objetivo.'));
      },
    });
  }

  excluirPlanejamento(planejamento: Planejamento): void {
    if (!this.podeExcluirPlanejamento(planejamento) || this.planejamentoExcluindoId() !== null) return;
    if (!window.confirm(`Excluir o planejamento "${planejamento.nome}"? Os PDIs sem iniciativas vinculadas também serão removidos.`)) return;

    this.planejamentoExcluindoId.set(planejamento.id);
    this.erroCarregamento.set('');
    this.service.excluirPlanejamento(planejamento.id)
      .pipe(finalize(() => this.planejamentoExcluindoId.set(null)))
      .subscribe({
        next: () => {
          this.planejamentos.update(items => items.filter(item => item.id !== planejamento.id));
          this.pdis.update(items => items.filter(item => item.planejamento !== planejamento.id));
          this.sucesso.set('Planejamento excluído com sucesso.');
        },
        error: erro => {
          console.error('Erro ao excluir planejamento:', erro);
          this.erroCarregamento.set(this.mensagemErro(erro, 'Não foi possível excluir o planejamento.'));
        },
      });
  }

  excluirPdi(pdi: Pdi): void {
    if ((pdi.quantidade_iniciativas ?? 0) > 0 || this.pdiExcluindoId() !== null) return;
    if (!window.confirm(`Excluir o PDI "${pdi.nome}"?`)) return;

    this.pdiExcluindoId.set(pdi.id);
    this.erroCarregamento.set('');
    this.service.excluirPdi(pdi.id)
      .pipe(finalize(() => this.pdiExcluindoId.set(null)))
      .subscribe({
        next: () => {
          this.pdis.update(items => items.filter(item => item.id !== pdi.id));
          this.sucesso.set('PDI excluído com sucesso.');
        },
        error: erro => {
          console.error('Erro ao excluir PDI:', erro);
          this.erroCarregamento.set(this.mensagemErro(erro, 'Não foi possível excluir o PDI.'));
        },
      });
  }

  statusClass(status: string): string {
    return status === 'Vigente' ? 'status-vigente' : 'status-expirado';
  }

  salvarPlanejamento(): void {
    if (this.salvandoPlanejamento()) return;
    this.formularioPlanejamento.markAllAsTouched();
    this.erroPlanejamento.set('');
    this.sucesso.set('');

    const { nome, data_inicio, data_fim, status } = this.formularioPlanejamento.getRawValue();
    if (this.formularioPlanejamento.invalid) return;
    if (data_fim < data_inicio) {
      this.erroPlanejamento.set('A data final não pode ser anterior à data inicial.');
      return;
    }

    this.salvandoPlanejamento.set(true);
    const dados = { nome: nome.trim(), data_inicio, data_fim, status };
    const planejamentoEditado = this.planejamentoEmEdicao();
    const requisicao = planejamentoEditado
      ? this.service.atualizarPlanejamento(planejamentoEditado.id, dados)
      : this.service.criarPlanejamento(dados);
    requisicao
      .pipe(finalize(() => this.salvandoPlanejamento.set(false)))
      .subscribe({
        next: planejamentoSalvo => {
          this.planejamentos.update(lista => [
            ...lista.filter(item => item.id !== planejamentoSalvo.id),
            planejamentoSalvo,
          ].sort((a, b) => a.data_inicio.localeCompare(b.data_inicio)));
          this.formularioPlanejamento.reset({
            nome: '',
            data_inicio: '',
            data_fim: '',
            status: 'Vigente',
          });
          this.planejamentoEmEdicao.set(null);
          this.modalAberto.set(null);
          this.sucesso.set(
            planejamentoEditado ? 'Planejamento atualizado com sucesso.' : 'Planejamento criado com sucesso.',
          );
        },
        error: erro =>
          this.erroPlanejamento.set(
            this.mensagemErro(
              erro,
              planejamentoEditado
                ? 'Não foi possível atualizar o planejamento.'
                : 'Não foi possível criar o planejamento.',
            ),
          ),
      });
  }

  salvarPdi(): void {
    if (this.salvandoPdi()) return;
    this.formularioPdi.markAllAsTouched();
    this.erroPdi.set('');
    this.sucesso.set('');

    const valores = this.formularioPdi.getRawValue();
    if (this.formularioPdi.invalid) return;
    if (valores.data_fim < valores.data_inicio) {
      this.erroPdi.set('A data final não pode ser anterior à data inicial.');
      return;
    }

    const planejamento = this.planejamentos().find(item => item.id === Number(valores.planejamento));
    if (
      planejamento &&
      (valores.data_inicio < planejamento.data_inicio || valores.data_fim > planejamento.data_fim)
    ) {
      this.erroPdi.set('O período do PDI deve estar dentro do período do planejamento escolhido.');
      return;
    }

    this.salvandoPdi.set(true);
    const dados = {
      nome: valores.nome.trim(),
      data_inicio: valores.data_inicio,
      data_fim: valores.data_fim,
      status: valores.status,
      planejamento: Number(valores.planejamento),
    };
    const pdiEditado = this.pdiEmEdicao();
    const requisicao = pdiEditado
      ? this.service.atualizarPdi(pdiEditado.id, dados)
      : this.service.criarPdi(dados);
    requisicao
      .pipe(finalize(() => this.salvandoPdi.set(false)))
      .subscribe({
        next: pdiSalvo => {
          this.pdis.update(lista => [
            ...lista.filter(item => item.id !== pdiSalvo.id),
            pdiSalvo,
          ].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')));
          this.formularioPdi.reset({
            nome: '',
            data_inicio: '',
            data_fim: '',
            status: 'Vigente',
            planejamento: 0,
          });
          this.pdiEmEdicao.set(null);
          this.modalAberto.set(null);
          this.sucesso.set(pdiEditado ? 'PDI atualizado com sucesso.' : 'PDI criado com sucesso.');
        },
        error: erro =>
          this.erroPdi.set(
            this.mensagemErro(
              erro,
              pdiEditado ? 'Não foi possível atualizar o PDI.' : 'Não foi possível criar o PDI.',
            ),
          ),
      });
  }

  private mensagemErro(erro: unknown, padrao: string): string {
    if (erro instanceof HttpErrorResponse) {
      const detalhe = erro.error?.detail;
      if (typeof detalhe === 'string') return detalhe;
      if (erro.error && typeof erro.error === 'object') {
        const mensagens = Object.values(erro.error).flatMap(valor =>
          Array.isArray(valor) ? valor : [valor],
        );
        if (mensagens.every(valor => typeof valor === 'string') && mensagens.length) {
          return mensagens.join(' ');
        }
      }
    }
    return padrao;
  }
}
