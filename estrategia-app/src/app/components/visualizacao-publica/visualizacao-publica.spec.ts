import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisualizacaoPublica } from './visualizacao-publica';

describe('VisualizacaoPublica', () => {
  let component: VisualizacaoPublica;
  let fixture: ComponentFixture<VisualizacaoPublica>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisualizacaoPublica],
    }).compileComponents();

    fixture = TestBed.createComponent(VisualizacaoPublica);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
