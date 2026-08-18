import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderPrincipal } from './header-principal';

describe('HeaderPrincipal', () => {
  let component: HeaderPrincipal;
  let fixture: ComponentFixture<HeaderPrincipal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderPrincipal],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderPrincipal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
