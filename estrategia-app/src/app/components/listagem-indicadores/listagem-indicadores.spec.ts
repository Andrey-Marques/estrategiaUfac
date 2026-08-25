import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListagemIndicadores } from './listagem-indicadores';

describe('ListagemIndicadores', () => {
  let component: ListagemIndicadores;
  let fixture: ComponentFixture<ListagemIndicadores>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListagemIndicadores],
    }).compileComponents();

    fixture = TestBed.createComponent(ListagemIndicadores);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
