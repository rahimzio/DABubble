import { Component, ElementRef, EventEmitter, Inject, Output, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCard } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { User } from '../../../../models/user.class';
import { FirestoreService } from '../../../services/firestore.service';
import { Router } from '@angular/router';
import { ChangeAvatarDialogComponent } from '../../change-avatar-dialog/change-avatar-dialog.component';
import { CommonModule } from '@angular/common';
import { channelDataclientService } from '../../../services/channelsDataclient.service';

@Component({
  selector: 'app-edit-profile-dialog',
  standalone: true,
  imports: [MatCard, FormsModule, CommonModule],
  templateUrl: './edit-profile-dialog.component.html',
  styleUrl: './edit-profile-dialog.component.scss',
})
export class EditProfileDialogComponent {
  constructor(private dialog: MatDialog, @Inject(MAT_DIALOG_DATA) public data: any, private router: Router) { }

  firestoreService = inject(FirestoreService)
  channelService = inject(channelDataclientService)
  userId: any;
  actualUser: any = new User;
  nameValue: string | undefined;
  mailValue: string | undefined;
  mailFailed = false;

  @ViewChild('profilePicture') profilePicture!: ElementRef;

  async ngOnInit() {
    this.actualUser = this.data.user;
    this.nameValue = this.actualUser.name;
    this.mailValue = this.actualUser.eMail;
    this.userId = this.actualUser.id;
  }

  /**
   * close the dialog complete
   */
  close() {
    this.dialog.closeAll();
  }

  /**
   * save changed User data in DB and close the dialog
   */
  async save() {
    this.actualUser.name = this.nameValue;
    this.actualUser.eMail = this.mailValue;
    await this.firestoreService.updateUserNameAndMail(this.actualUser);
    await this.firestoreService.updateUserName(this.nameValue, this.userId)
   
    this.dialog.closeAll();
  
  }

  /**
   * open a dialog for changing the avatar picture
   */
  changeAvatar() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.position = {
      top: '100px',
      right: '20px'
    };
    dialogConfig.panelClass = 'transparent-dialog';
    dialogConfig.data = {
      user: this.actualUser,
    }
    this.dialog.open(ChangeAvatarDialogComponent, dialogConfig);
  }

  /**
   * Checks if the Email has the right pattern
   */
  checkIfCorrectMailFormat() {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (this.mailValue !== undefined) {
      return emailPattern.test(this.mailValue);
    }
    return false;
  }

}
