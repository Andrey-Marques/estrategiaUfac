import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListagemIniciativas } from './listagem-iniciativas';

describe('ListagemIniciativas', () => {
  let component: ListagemIniciativas;
  let fixture: ComponentFixture<ListagemIniciativas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListagemIniciativas],
    }).compileComponents();

    fixture = TestBed.createComponent(ListagemIniciativas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
