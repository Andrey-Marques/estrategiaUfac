import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaginaPe } from './pagina-pe';

describe('PaginaPe', () => {
  let component: PaginaPe;
  let fixture: ComponentFixture<PaginaPe>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginaPe],
    }).compileComponents();

    fixture = TestBed.createComponent(PaginaPe);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
