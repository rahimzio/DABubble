import { Component, ElementRef, Inject, ViewChild, inject } from '@angular/core';
import { MatCard } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogRef, } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FirestoreService } from '../../../services/firestore.service';
import { StorageService } from '../../../services/storage.service';
import { User } from '../../../../models/user.class';
import { channelDataclientService } from '../../../services/channelsDataclient.service';

@Component({
  selector: 'app-show-member-dialog',
  standalone: true,
  imports: [MatCard, MatIconModule, MatButtonModule, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './show-member-dialog.component.html',
  styleUrl: './show-member-dialog.component.scss'
})
export class ShowMemberDialogComponent {
  constructor(private dialog: MatDialog, @Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<ShowMemberDialogComponent>) {
    this.users = data.allUsers
  }

  onlineStatusMap: Map<string, boolean> = new Map<string, boolean>();
  channelData: any;
  usersInChannel: any;
  channelId: any;
  showMemberSection = true;
  addMemberSection = false;
  currentName: any;
  selectedOption: string = '';
  userList!: any[];
  users: any[] = [];
  selectedUser: any[] = [];
  @ViewChild('userListDialog') userListDialog: any;
  @ViewChild('userInput') userInput!: ElementRef<HTMLInputElement>;
  dialogReference: MatDialogRef<any> | null = null;
  fireStoreService = inject(FirestoreService)
  downloadService = inject(StorageService)
  channelService = inject(channelDataclientService)


  async ngOnInit() {
    this.channelData = this.data.channelData
    this.usersInChannel = this.channelData.usersInChannel
    this.channelId = this.channelData.id
    this.showRightSection()
    await this.loadProfilePictures(this.users)
    this.filterUsersInChannel();
  }

  /**
   * This function sets the variable for the ngif to show the right sections
   */
  showRightSection(){
    this.showMemberSection = this.data.showMemberSection;
    this.addMemberSection = this.data.addMemberSection;
  }

  /**
   * This function filters out users who are already in the channel
   */
  filterUsersInChannel() {
    if (this.data.channelData && this.data.channelData.usersInChannel) {
      const usersInChannelIds = this.usersInChannel.map((user: any) => user.id);
      this.users = this.users.filter(user => !usersInChannelIds.includes(user.id));
    }
  }

  /**
   * close the dialog
   */
  closeDialog() {
    this.dialogRef.close()
  }

  /**
   * open the member section
   */
  openAddMemberSection() {
    this.showMemberSection = false;
    this.addMemberSection = true;
  }

  /**
   * This function is always activated when typing to filter the user search
   */
  showUser() {
    this.openUserDialog();

    if (this.isInputEmpty()) {
      this.showAllUsers()
    } else {
      this.filterByName()
    }
  }

  /**
   * @returns requirements for filterfunction
   */
  isInputEmpty() {
    return !this.currentName || this.currentName.trim() === ''
  }

  /**
   * @returns  all users except those already selected
   */
  showAllUsers() {
    return this.userList = this.users.filter(user => !this.selectedUser.some(selected => selected.id === user.id));
  }

  /**
   * @returns the filtered name
   */
  filterByName() {
    return this.userList = this.users.filter((user) => {
      const userClean = user.name.replace(/\s/g, '');
      const userCleanSmall = userClean.toLowerCase();
      if (userCleanSmall.includes(this.currentName)) {
        return user;
      }
    }).filter(user => !this.selectedUser.some(selected => selected.id === user.id));
  }

  /**
  * Adds a user to the selected users list based on the provided user ID
  */
  chooseUser(userId: string) {
    const userToAdd = this.users.filter(user => user.id === userId);
    if (userToAdd.length > 0) {
      this.selectedUser.push(...userToAdd);
    } else {
      console.error('User not found with ID:', userId);
    }
    this.showUser()
  }

/**
 * This function opens the userList dialog to add an User to the Channel
 */
  openUserDialog() {
    if (!this.dialogReference) {
      const dialogConfig = new MatDialogConfig();
      dialogConfig.hasBackdrop = true;
      dialogConfig.backdropClass = 'cdk-overlay-transparent-backdrop'
      if (this.data && this.data.mouseEventData) {
        this.setUserDialogPosition(dialogConfig)
      }
      dialogConfig.autoFocus = false; // Dialog erhält keinen Fokus automatisch
      dialogConfig.closeOnNavigation = true; // Dialog bleibt ge
      this.dialogReference = this.dialog.open(this.userListDialog, dialogConfig);

      this.dialogFocusSettings()
    }
  }

  /**
   * @returns the position for the user Dialog under the input field
   */
  setUserDialogPosition(dialogConfig: MatDialogConfig<any>) {
    const mouseEventData = this.data.mouseEventData;
    const offsetLeft = 370;
    const offsetY = 155;
    return dialogConfig.position = { top: `${mouseEventData.clientY + offsetY}px`, left: `${mouseEventData.clientX - offsetLeft}px` };
  }

 /** 
  * Sets up focus behavior for the dialog when opened and closed.
  */
  dialogFocusSettings() {
    if (this.dialogReference) {
      this.dialogReference.afterOpened().subscribe(() => {
        this.userInput.nativeElement.focus();
      });

      this.dialogReference.afterClosed().subscribe(() => {
        this.dialogReference = null;
      });
    }
  }

  /**
   * Prevent Closing the userlist dialog, when click on inputfield for searching user
   */
  preventDialogClose(event: MouseEvent): void {
    event.stopPropagation(); 
  }

  /**
   * This function controls if the user use a own profile picture and the downloaded the image . After this the array Alluser is updatet.
   */
  async loadProfilePictures(users: User[]) {
    for (const user of users) {
      if (user.avatar === 'ownPictureDA') {
        const profilePictureURL = `gs://dabubble-51e17.appspot.com/${user.id}/ownPictureDA`;
        try {
          const downloadedImageUrl = await this.downloadService.downloadImage(
            profilePictureURL
          );
          user.avatar = downloadedImageUrl;
        } catch (error) {
          console.error('Error downloading user profile picture:', error);
        }
      }
    }
  }

  /**
  * This function removes the selected user for the Channel 
  */
  removeSelectedUser(userId: any) {
    this.selectedUser = this.selectedUser.filter(user => user.id !== userId);
  }

  /**
   * This function launches the necessary functions to add a user to a channel
   */
  async addUserToChannel(channelId: any) {
    await this.channelService.addUserToChannel(channelId, this.selectedUser);
    for (const user of this.selectedUser) {
      await this.fireStoreService.updateUsersChannels(user.id, channelId)
    }
    this.closeDialog()
  }

  /**
   * check if user is online
   */
  isUserOnline(userId: string): boolean {
    if (this.onlineStatusMap.has(userId)) {
      const status = this.onlineStatusMap.get(userId);
      if (typeof status === 'boolean') {
        return status;
      } else {
        return false; // Default-Wert, falls der Status nicht definiert ist
      }
    } else {
      const user = this.users.find(user => user.id === userId);
      const isOnline = user ? user.isOnline : false;
      this.onlineStatusMap.set(userId, isOnline);
      return isOnline;
    }
  }
}
