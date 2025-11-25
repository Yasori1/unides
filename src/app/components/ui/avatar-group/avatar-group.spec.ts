import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AvatarGroup } from './avatar-group';

describe('AvatarGroup', () => {
  let component: AvatarGroup;
  let fixture: ComponentFixture<AvatarGroup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvatarGroup]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AvatarGroup);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
