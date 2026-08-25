import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TelaLogin } from './tela-login';

describe('TelaLogin', () => {
  let component: TelaLogin;
  let fixture: ComponentFixture<TelaLogin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TelaLogin],
    }).compileComponents();

    fixture = TestBed.createComponent(TelaLogin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
