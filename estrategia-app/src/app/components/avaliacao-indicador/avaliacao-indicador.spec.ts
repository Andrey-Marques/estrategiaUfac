import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AvaliacaoIndicador } from './avaliacao-indicador';

describe('AvaliacaoIndicador', () => {
  let component: AvaliacaoIndicador;
  let fixture: ComponentFixture<AvaliacaoIndicador>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvaliacaoIndicador],
    }).compileComponents();

    fixture = TestBed.createComponent(AvaliacaoIndicador);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
