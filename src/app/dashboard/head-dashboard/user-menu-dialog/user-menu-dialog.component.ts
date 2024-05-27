import { Component, Inject, inject } from '@angular/core';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialog, MatDialogActions, MatDialogConfig, MatDialogContent, MatDialogModule, MatDialogTitle } from '@angular/material/dialog';
import { LogInService } from '../../../services/log-in.service';
import {  Router } from '@angular/router';
import { UserProfileDialogComponent } from '../user-profile-dialog/user-profile-dialog.component';

@Component({
  selector: 'app-user-menu-dialog',
  standalone: true,
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatButton, MatButtonModule, MatDialogModule, MatCard],
  templateUrl: './user-menu-dialog.component.html',
  styleUrl: './user-menu-dialog.component.scss'
})
export class UserMenuDialogComponent {
  constructor( private router: Router, private dialog: MatDialog, private profileDialog: MatDialog, @Inject(MAT_DIALOG_DATA) public data:any){}
  logOutService = inject(LogInService)

  /**
   * log out the actual user
   */
  logOut(){
    this.logOutService.logOut();
    setTimeout(() => {
      this.dialog.closeAll();
      this.logOutService.introProhibet = false;
      this.router.navigate(['/']);
    }, 1500);
  }

  /**
   * open Profile dialog for the actual logged in user
   */
  openProfile(){
    const dialogConfig = new MatDialogConfig();
    if (window.innerWidth < 500) {
      dialogConfig.width = '100%'; 
      dialogConfig.height = '100%';
      dialogConfig.maxWidth = '100vw';
      dialogConfig.maxHeight = '100vh';
  } else {
      dialogConfig.position = {
          top: '100px',
          right: '20px'
      };
  }
    dialogConfig.panelClass = 'transparent-dialog';
    dialogConfig.data = {
      user: this.data.user,
    }
    this.dialog.open(UserProfileDialogComponent, dialogConfig);
  }
}
