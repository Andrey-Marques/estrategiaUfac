import { Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, RouterLink } from '@angular/router';

interface ItemBreadcrumb {
  titulo: string;
  rota?: string;
  queryParams?: Params;
}

@Component({
  selector: 'app-breadcrumb',
  imports: [RouterLink],
  templateUrl: './breadcrumb.html',
  styleUrl: './breadcrumb.scss',
})
export class Breadcrumb {
  private readonly route = inject(ActivatedRoute);
  private readonly parametros = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  readonly titulo = input('Visualização');

  readonly itens = computed<ItemBreadcrumb[]>(() => {
    const caminho = this.route.snapshot.routeConfig?.path ?? '';
    const params = this.parametros();
    const unidade = Number(params.get('unidade'));
    const temUnidade = Number.isSafeInteger(unidade) && unidade > 0;
    const painel: ItemBreadcrumb = { titulo: 'Painel de Unidades', rota: '/painel-unidades' };
    const paginas: Record<string, string> = {
      'painel-unidades': 'Painel de Unidades',
      'pagina-pe': 'Planejamento Estratégico',
      'pagina-pdi': 'Plano de Desenvolvimento Institucional',
    };
    if (paginas[caminho]) return [{ titulo: paginas[caminho] }];

    const itens: ItemBreadcrumb[] = temUnidade ? [painel] : [];
    if (caminho === 'acoes-estrategicas') {
      return [...itens, { titulo: 'Ações Estratégicas' }];
    }

    const abas: Record<string, string> = {
      'visualizacao-projeto/:id': 'projetos',
      'visualizacao-iniciativa/:id': 'iniciativas',
      'visualizacao-indicador/:id': 'indicadores',
    };
    if (!abas[caminho]) return [];

    // O contexto viaja na URL, inclusive após recarregar ou compartilhar o detalhe.
    const queryParams: Params = { aba: abas[caminho] };
    if (temUnidade) queryParams['unidade'] = unidade;
    return [...itens, {
      titulo: 'Ações Estratégicas', rota: '/acoes-estrategicas', queryParams,
    }, { titulo: this.titulo() }];
  });
}
