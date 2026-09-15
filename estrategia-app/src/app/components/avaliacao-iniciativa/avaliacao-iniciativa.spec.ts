import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AvaliacaoIniciativa } from './avaliacao-iniciativa';

describe('AvaliacaoIniciativa', () => {
  let component: AvaliacaoIniciativa;
  let fixture: ComponentFixture<AvaliacaoIniciativa>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvaliacaoIniciativa],
    }).compileComponents();

    fixture = TestBed.createComponent(AvaliacaoIniciativa);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
