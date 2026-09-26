import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisualizacaoIniciativa } from './visualizacao-iniciativa';

describe('VisualizacaoIniciativa', () => {
  let component: VisualizacaoIniciativa;
  let fixture: ComponentFixture<VisualizacaoIniciativa>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisualizacaoIniciativa],
    }).compileComponents();

    fixture = TestBed.createComponent(VisualizacaoIniciativa);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
