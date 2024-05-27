import { Component, ElementRef, Inject, inject } from '@angular/core';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialog, MatDialogActions, MatDialogConfig, MatDialogContent, MatDialogModule, MatDialogTitle } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { FirestoreService } from '../../../services/firestore.service';
import { User } from '../../../../models/user.class';
import { CommonModule } from '@angular/common';
import { EditProfileDialogComponent } from '../edit-profile-dialog/edit-profile-dialog.component';

@Component({
  selector: 'app-user-profile-dialog',
  standalone: true,
  imports: [MatCard, MatDialogContent, MatDialogActions, MatButton, MatButtonModule, MatDialogModule, MatDialogTitle, CommonModule],
  templateUrl: './user-profile-dialog.component.html',
  styleUrl: './user-profile-dialog.component.scss'
})
export class UserProfileDialogComponent {
  constructor(private router: Router, private dialog: MatDialog, @Inject(MAT_DIALOG_DATA) public data: any) { }
  firestoreService = inject(FirestoreService)
  actualUser: User = new User;

  async ngOnInit() {
    this.actualUser = this.data.user;
  }

  /**
   * close the dialog complete
   */
  close() {
    this.dialog.closeAll();
  }

  /**
   * open the edit user dialog
   */
  openEdit() {
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
      user: this.actualUser,
    }
    this.dialog.open(EditProfileDialogComponent, dialogConfig);
  }
}
