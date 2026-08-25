import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListagemProjetos } from './listagem-projetos';

describe('ListagemProjetos', () => {
  let component: ListagemProjetos;
  let fixture: ComponentFixture<ListagemProjetos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListagemProjetos],
    }).compileComponents();

    fixture = TestBed.createComponent(ListagemProjetos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
