import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaginaPdi } from './pagina-pdi';

describe('PaginaPdi', () => {
  let component: PaginaPdi;
  let fixture: ComponentFixture<PaginaPdi>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginaPdi],
    }).compileComponents();

    fixture = TestBed.createComponent(PaginaPdi);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
