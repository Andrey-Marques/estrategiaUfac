import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaginaInicial } from './pagina-inicial';

describe('PaginaInicial', () => {
  let component: PaginaInicial;
  let fixture: ComponentFixture<PaginaInicial>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginaInicial],
    }).compileComponents();

    fixture = TestBed.createComponent(PaginaInicial);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
