import { Component, Inject, inject } from '@angular/core';
import { MatCard, MatCardContent, MatCardHeader } from '@angular/material/card';
import { StorageService } from '../../services/storage.service';
import { FirestoreService } from '../../services/firestore.service';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-change-avatar-dialog',
  standalone: true,
  imports: [MatCard, MatCardHeader, MatCardContent, CommonModule],
  templateUrl: './change-avatar-dialog.component.html',
  styleUrl: './change-avatar-dialog.component.scss',
})
export class ChangeAvatarDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<ChangeAvatarDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  uploadService = inject(StorageService);
  firestore = inject(FirestoreService);
  avatar: any | string = 'assets/img/avatars/profile-blank.svg';
  selectOwnPicture: boolean = false;
  actualUser: any;
  userId = '';

  async ngOnInit() {
    this.actualUser = this.data.user;
    this.avatar = this.actualUser.avatar;
    this.userId = this.actualUser.id;
  }

  /**
   * save selected Avatar to Firestore DB and redirect to the login
   */
  updateAvatar() {
    if (this.selectOwnPicture) {
      this.uploadService.uploadImg();
    }
    this.controllIfOwnPictureUsed();

    this.close();
  }

  /**
   * Upload a picture by press Datei Hochladen button
   * @param event 1
   */
  uploadOwnAvatar(event: any) {
    this.uploadService.avatarSelected(event, this.userId);
    this.ownPicturePreView(event);
    this.selectOwnPicture = true;
  }

  /**
   * change the avatar picture name by click
   * @param event html id
   */
  selectNewAvatar(event: MouseEvent) {
    const clickedElement = event.target as HTMLElement;
    const id = clickedElement.id;
    this.avatar = id;
    this.actualUser.avatar = id;
    this.selectOwnPicture = false;
  }

  /**
   * This function controls, if the user use a own profilepicture or not. This is for upload a synonym for our avatar:'ownPictureDA' in DB.
   */
  controllIfOwnPictureUsed() {
    if (this.selectOwnPicture) {
      this.firestore.updateUserAvatar(this.userId, 'ownPictureDA');
    } else if (!this.selectOwnPicture) {
      this.firestore.updateUserAvatar(this.userId, this.avatar);
    }
  }

  /**
   * shows the chosen picture as preview in the dialog
   */
  ownPicturePreView(event: any) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image')) {
      const reader = new FileReader(); // Erstelle ein FileReader-Objekt
      reader.onload = () => {
        this.avatar = reader.result;
      };
      reader.readAsDataURL(file); // Lese das Bild als Daten-URL
    }
  }

  /**
   * close the dialog complete
   */
  close() {
    this.dialogRef.close();
  }
}
