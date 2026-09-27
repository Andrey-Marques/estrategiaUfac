import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisualizacaoProjeto } from './visualizacao-projeto';

describe('VisualizacaoProjeto', () => {
  let component: VisualizacaoProjeto;
  let fixture: ComponentFixture<VisualizacaoProjeto>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisualizacaoProjeto],
    }).compileComponents();

    fixture = TestBed.createComponent(VisualizacaoProjeto);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
