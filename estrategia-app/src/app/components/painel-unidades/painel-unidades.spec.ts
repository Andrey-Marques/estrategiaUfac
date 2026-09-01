import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PainelUnidades } from './painel-unidades';

describe('PainelUnidades', () => {
  let component: PainelUnidades;
  let fixture: ComponentFixture<PainelUnidades>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PainelUnidades],
    }).compileComponents();

    fixture = TestBed.createComponent(PainelUnidades);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
