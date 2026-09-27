import { DestroyRef, inject, signal } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { EMPTY, catchError, switchMap, tap } from 'rxjs';
import { AcoesEstrategicasService, DetalhesPublicos, TipoAcaoEstrategica } from './acoes-estrategicas.service';

registerLocaleData(localePt, 'pt-BR');

export function carregarDetalhePublico<T extends TipoAcaoEstrategica>(tipo: T) {
  const service = inject(AcoesEstrategicasService);
  const registro = signal<DetalhesPublicos[T] | null>(null);
  const carregando = signal(true);
  const erro = signal('');

  inject(ActivatedRoute).paramMap.pipe(
    switchMap(params => {
      registro.set(null);
      erro.set('');
      carregando.set(true);
      const id = Number(params.get('id'));
      if (!Number.isSafeInteger(id) || id <= 0) {
        erro.set('Registro inválido. Volte à listagem e selecione uma ação.');
        carregando.set(false);
        return EMPTY;
      }
      return service.detalhe(tipo, id).pipe(
        tap(dados => { registro.set(dados); carregando.set(false); }),
        catchError(falha => {
          erro.set(falha.status === 404
            ? 'Registro não encontrado ou indisponível para consulta pública.'
            : 'Não foi possível carregar os dados. Tente novamente mais tarde.');
          carregando.set(false);
          return EMPTY;
        }),
      );
    }),
    takeUntilDestroyed(inject(DestroyRef)),
  ).subscribe();

  return { registro, carregando, erro };
}
