import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoBar } from './info-bar';

describe('InfoBar', () => {
  let component: InfoBar;
  let fixture: ComponentFixture<InfoBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfoBar],
    }).compileComponents();

    fixture = TestBed.createComponent(InfoBar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
