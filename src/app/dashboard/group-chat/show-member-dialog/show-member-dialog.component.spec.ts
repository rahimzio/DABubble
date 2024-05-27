import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowMemberDialogComponent } from './show-member-dialog.component';

describe('ShowMemberDialogComponent', () => {
  let component: ShowMemberDialogComponent;
  let fixture: ComponentFixture<ShowMemberDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowMemberDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ShowMemberDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
