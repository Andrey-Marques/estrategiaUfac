import { DomSanitizer } from '@angular/platform-browser';
import { AvaliacaoIndicador } from './avaliacao-indicador';
import { RevisaoEdicao } from '../../model/revisaoEdicao';

const original = { ano: '2026', meta_prevista: '75', meta_alcancada: '55' };
const nova = { ano: '2024', meta_prevista: '3', meta_alcancada: '1' };

describe('Metas propostas na avaliação do indicador', () => {
  let component: AvaliacaoIndicador;
  beforeEach(() => { component = new AvaliacaoIndicador({} as DomSanitizer); });
  function revisao(anteriores: unknown[], propostas: unknown[]) {
    component.revisao = { status: 'PENDENTE', diferencas: { evolucao_indicador: { anterior: anteriores, proposto: propostas } } } as unknown as RevisaoEdicao;
  }
  it('mostra somente a meta adicionada sem repetir a existente', () => {
    revisao([original], [original, nova]);
    expect(component.metasPropostas).toEqual([nova]);
    expect(component.revisao!.diferencas['evolucao_indicador'].proposto).toEqual([original, nova]);
  });
  it('mostra linhas alteradas e compara com o snapshot anterior', () => {
    const alterada = { ...original, meta_alcancada: '60' };
    revisao([original, nova], [alterada, nova]);
    expect(component.metasPropostas).toEqual([alterada]);
  });
  it('ignora reordenação, ids e diferenças de tipo entre número e texto', () => {
    revisao([original, nova], [nova, { ...original, id: 99, ano: 2026, meta_prevista: 75, meta_alcancada: 55 }]);
    expect(component.metasPropostas).toEqual([]);
  });
  it('reconhece uma ocorrência adicional de uma linha repetida', () => {
    revisao([original], [original, original]);
    expect(component.metasPropostas).toEqual([original]);
  });
  it('não mostra metas quando a revisão não altera o monitoramento', () => {
    component.revisao = null;
    expect(component.metasPropostas).toEqual([]);
  });
});
