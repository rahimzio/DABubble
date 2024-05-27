import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResetPasswortComponent } from './reset-passwort.component';

describe('ResetPasswortComponent', () => {
  let component: ResetPasswortComponent;
  let fixture: ComponentFixture<ResetPasswortComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResetPasswortComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ResetPasswortComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
