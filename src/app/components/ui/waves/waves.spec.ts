import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Waves } from './waves';

describe('Waves', () => {
  let component: Waves;
  let fixture: ComponentFixture<Waves>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Waves]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Waves);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
