import { AvaliacaoIniciativa } from './avaliacao-iniciativa';
import { IniciativaEstrategica, totaisCustosIniciativa } from '../../model/iniciativaEstrategica';

const acoes = [
  { nome: 'Primeira', prazo_inicio: '', prazo_fim: '', custo: '1200.50', custo_realizado: '300.25', status: 'ANDAMENTO' },
  { nome: 'Segunda', prazo_inicio: '', prazo_fim: '', custo: '800.25', custo_realizado: 199.75, status: 'ANDAMENTO' },
];

describe('Custos da iniciativa na visualização', () => {
  it('soma os custos estimados e realizados de todas as ações', () => {
    expect(totaisCustosIniciativa(acoes)).toEqual({ estimado: 2000.75, realizado: 500 });
  });
  it('retorna zero quando não há ações e aceita realizado ainda não informado', () => {
    expect(totaisCustosIniciativa()).toEqual({ estimado: 0, realizado: 0 });
    expect(totaisCustosIniciativa([{ ...acoes[0], custo_realizado: undefined }])).toEqual({ estimado: 1200.5, realizado: 0 });
  });
  it('soma centavos sem acumular imprecisão de ponto flutuante', () => {
    expect(totaisCustosIniciativa([{ ...acoes[0], custo: '0.10', custo_realizado: '0.20' }, { ...acoes[1], custo: '0.20', custo_realizado: '0.10' }])).toEqual({ estimado: 0.3, realizado: 0.3 });
  });
  it('o modal privado utiliza o mesmo cálculo e acompanha a iniciativa selecionada', () => {
    const component = new AvaliacaoIniciativa();
    component.iniciativa = { acoes_realizadas: acoes } as IniciativaEstrategica;
    expect(component.custos).toEqual({ estimado: 2000.75, realizado: 500 });
    component.iniciativa = { acoes_realizadas: [] } as unknown as IniciativaEstrategica;
    expect(component.custos).toEqual({ estimado: 0, realizado: 0 });
  });
});
