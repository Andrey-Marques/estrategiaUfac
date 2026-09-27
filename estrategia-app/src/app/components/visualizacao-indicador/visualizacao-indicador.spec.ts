import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisualizacaoIndicador } from './visualizacao-indicador';

describe('VisualizacaoIndicador', () => {
  let component: VisualizacaoIndicador;
  let fixture: ComponentFixture<VisualizacaoIndicador>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisualizacaoIndicador],
    }).compileComponents();

    fixture = TestBed.createComponent(VisualizacaoIndicador);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
