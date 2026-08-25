import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TelaCadastro } from './tela-cadastro';

describe('TelaCadastro', () => {
  let component: TelaCadastro;
  let fixture: ComponentFixture<TelaCadastro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TelaCadastro],
    }).compileComponents();

    fixture = TestBed.createComponent(TelaCadastro);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
