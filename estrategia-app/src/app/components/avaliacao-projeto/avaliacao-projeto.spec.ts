import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AvaliacaoProjeto } from './avaliacao-projeto';

describe('AvaliacaoProjeto', () => {
  let component: AvaliacaoProjeto;
  let fixture: ComponentFixture<AvaliacaoProjeto>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvaliacaoProjeto],
    }).compileComponents();

    fixture = TestBed.createComponent(AvaliacaoProjeto);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
