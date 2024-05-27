import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditGroupChannelDialogComponent } from './edit-group-channel-dialog.component';

describe('EditGroupChannelDialogComponent', () => {
  let component: EditGroupChannelDialogComponent;
  let fixture: ComponentFixture<EditGroupChannelDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditGroupChannelDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EditGroupChannelDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
