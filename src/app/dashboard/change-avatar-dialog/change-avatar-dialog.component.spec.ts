import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeAvatarDialogComponent } from './change-avatar-dialog.component';

describe('ChangeAvatarDialogComponent', () => {
  let component: ChangeAvatarDialogComponent;
  let fixture: ComponentFixture<ChangeAvatarDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChangeAvatarDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChangeAvatarDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
