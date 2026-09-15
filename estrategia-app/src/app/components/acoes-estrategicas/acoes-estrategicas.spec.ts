import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcoesEstrategicas } from './acoes-estrategicas';

describe('AcoesEstrategicas', () => {
  let component: AcoesEstrategicas;
  let fixture: ComponentFixture<AcoesEstrategicas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AcoesEstrategicas],
    }).compileComponents();

    fixture = TestBed.createComponent(AcoesEstrategicas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
