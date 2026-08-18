import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormularioIniciativas } from './formulario-iniciativas';

describe('FormularioIniciativas', () => {
  let component: FormularioIniciativas;
  let fixture: ComponentFixture<FormularioIniciativas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormularioIniciativas],
    }).compileComponents();

    fixture = TestBed.createComponent(FormularioIniciativas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
