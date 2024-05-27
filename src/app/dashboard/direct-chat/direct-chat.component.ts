import { Component, Input, SimpleChanges, ViewChild, inject } from '@angular/core';
import { FirestoreService } from '../../services/firestore.service';
import { CommonModule } from '@angular/common';
import { StorageService } from '../../services/storage.service';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { UserDetailDialogComponent } from '../user-detail-dialog/user-detail-dialog.component';
import { ActivatedRoute } from '@angular/router';
import { EmojiDialogComponent } from '../../emoji-dialog/emoji-dialog.component';
import { DirectChatService } from '../../services/direct-chat.service';
import { FormsModule } from '@angular/forms'
import { MatIconModule } from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import { User } from '../../../models/user.class';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-direct-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatTooltipModule, MatCardModule],
  templateUrl: './direct-chat.component.html',
  styleUrl: './direct-chat.component.scss'
})
export class DirectChatComponent {
  @Input() currentChatPartnerId!: string;
  fireStoreService = inject(FirestoreService)
  downloadService = inject(StorageService);
  currentChatPartnerData: any;
  currentUserData: any;
  directChatService = inject(DirectChatService);
  currentUserId: any;
  editedMessageIndex: number | null = null;
  messageForEdit: any;
  showButton: boolean[] = Array(this.directChatService.chatDatas.length).fill(false);
  dialogReference: MatDialogRef<any> | null = null;
  @ViewChild('editMessageDialog') editMessageDialog: any;
  @ViewChild('reactionInformationDialog') reactionInfo: any;
  @ViewChild('atUserList') atUserList: any;
  message: any;
  currentHoverEmoji: any;
  currentFile!: File | null;
  imgForDelete:any;
  @Input() users: User[] = [];

  constructor(public dialog: MatDialog, private route: ActivatedRoute) {
    this.getIdFromURL()
  }

  /**
   * This function download get the datas from the current user
   */
  async loadCurrentUserDatas() {
    try {
      const data = await this.fireStoreService.getUserDataById(this.currentUserId);
      this.currentUserData = data;
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
    }
  }

  /**
  * get the user-id from the url 
  */
  async getIdFromURL() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id != null) {
      this.currentUserId = id;
    }
    this.loadCurrentUserDatas()
  }

  /**
   * This function checks changes for updating the chat component
   */
  async ngOnChanges(changes: SimpleChanges) {
    if (changes['currentChatPartnerId']) {
      await this.loadCurrentDatas();
      await this.loadProfilePictures();
    }
  }

  /**
   * This function download get the datas from the other user for the Private chat
   */
  async loadCurrentDatas() {
    try {
      const data = await this.fireStoreService.getUserDataById(this.currentChatPartnerId);
      this.currentChatPartnerData = data;
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
    }
    await this.loadCurrentChat()
  }

  /**
   * load current chat datas
   */
  async loadCurrentChat() {
    await this.directChatService.getCurrentChats(this.currentUserId, this.currentChatPartnerId);
  }

  /**
   * This function checks if the user used a own profile picture and downloaded the url with the function from downloadService. After that the currentUser will be updatet.
   */
  async loadProfilePictures() {
    try {
      if (this.currentChatPartnerData && typeof this.currentChatPartnerData === 'object' && this.currentChatPartnerData.avatar === 'ownPictureDA') {
        const chatPartnerProfilePictureURL = `gs://dabubble-51e17.appspot.com/${this.currentChatPartnerData.id}/ownPictureDA`;
        try {
          await this.setProfilePictureToChatPartner(chatPartnerProfilePictureURL);
        } catch (error) {
          console.error('Error downloading chat partner profile picture:', error);
        }
      }

      if (this.currentUserData && typeof this.currentUserData === 'object' && this.currentUserData.avatar === 'ownPictureDA') {
        const currentUserProfilePictureURL = `gs://dabubble-51e17.appspot.com/${this.currentUserData.id}/ownPictureDA`;
        try {
          await this.setProfilePictureToCurrentUser(currentUserProfilePictureURL);
        } catch (error) {
          console.error('Error downloading current user profile picture:', error);
        }
      }
    } catch (error) {
      console.error('Error loading profile pictures:', error);
    }
  }

  /**
   * This function push the right url for own profile pictures to the user 
   */
  async setProfilePictureToChatPartner(profilePictureURL: string) {
    const downloadedImageUrl = await this.downloadService.downloadImage(profilePictureURL);
    this.currentChatPartnerData.avatar = downloadedImageUrl;
  }

  /**
   * This function push the right url for own profile pictures to the  current user 
   */
  async setProfilePictureToCurrentUser(profilePictureURL: string) {
    const downloadedImageUrl = await this.downloadService.downloadImage(profilePictureURL);
    this.currentUserData.avatar = downloadedImageUrl;
  }

  /**
  * open the user detail dialog
  */
  openUserDetail(user: string) {
    const dummyUsersInChannel = [this.currentUserData, this.currentChatPartnerData];
    const dialogConfig = new MatDialogConfig();
    if (window.innerWidth < 500) {
      dialogConfig.width = '100%'; 
      dialogConfig.height = '100%';
      dialogConfig.position = { top: '0', left: '0' };
  } else {
      dialogConfig.position = {
          top: '100px',
          right: '20px'
      };
  }
    dialogConfig.panelClass = 'transparent-dialog';
    dialogConfig.data = {
      user: user,
      userInChannel: {
        usersInChannel: dummyUsersInChannel
      }
    }
    this.dialog.open(UserDetailDialogComponent, dialogConfig);
  }

/**
* open the emojiDialog and insert the returned emoji in the textarea field
*/
  openEmojiDialog(event: MouseEvent, addEmojiToTextArea: boolean, addEmojiReaction: boolean, messageId?: any,) {
    const offsetY = 300;
    const dialogConfig = new MatDialogConfig();
    dialogConfig.position = { top: `${event.clientY - offsetY}px`, left: `${event.clientX}px` };
    dialogConfig.backdropClass = 'cdk-overlay-transparent-backdrop';

    this.dialog.open(EmojiDialogComponent, dialogConfig).afterClosed().subscribe((selectedEmoji: string | undefined) => {
      if (selectedEmoji && addEmojiToTextArea) {
        const textarea = document.getElementById('answer') as HTMLTextAreaElement;
        const startPos = textarea.selectionStart;
        const endPos = textarea.selectionEnd;

        const textBeforeCursor = textarea.value.substring(0, startPos);
        const textAfterCursor = textarea.value.substring(endPos, textarea.value.length);
        textarea.value = textBeforeCursor + selectedEmoji + textAfterCursor;

        const newCursorPosition = startPos + selectedEmoji.length;
        textarea.setSelectionRange(newCursorPosition, newCursorPosition);

        textarea.dispatchEvent(new Event('input'));

        textarea.focus();
      }
      if (selectedEmoji && addEmojiReaction) {
        this.directChatService.addEmojiToMessage(this.currentChatPartnerId, this.currentUserId, messageId, selectedEmoji)
      }
    });
  }

  /**
   * send message to chat
   */
  async sendChat() {
    let timeStamp = Date.now()

    if (this.currentFile) {
      const imgUrl = await this.downloadService.uploadToPrivateRef(this.currentFile, this.currentChatPartnerId, this.currentUserId)

      await this.directChatService.sendChat(this.currentUserId, this.currentChatPartnerId, timeStamp, this.message, imgUrl);
      this.currentFile = null;
      this.message = ''
    } else
      await this.directChatService.sendChat(this.currentUserId, this.currentChatPartnerId, timeStamp, this.message);
    this.message = ''
  }

  /**
   * sent answer with enter key to the chat
   */
  onEnterPressed(event:any): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      this.sendChat();
      event.preventDefault(); 
    }
  }

  /**
   * cancle edit dialog
   */
  cancelEdit() {
    this.editedMessageIndex = null;
  }

  /**
   * save the edit user details
   */
  async saveEdit(messageId: any, message: any, img?:any) {
    await this.directChatService.editMessage(this.currentUserId, this.currentChatPartnerId, message, messageId, img)
    this.editedMessageIndex = null;
  }

  /**
   * delete the image
   */
  deleteImg(){
    this.imgForDelete = ''
  }

  /**
    * This function open the dialog for the button to edit a Message
    * @param event mouseclick
    * @param i index
    */
  openEditMessageDialog(event: MouseEvent, i: number) {
    this.dontLeaveHover(i)
    if (!this.dialogReference) {
      const dialogConfig = new MatDialogConfig();
      dialogConfig.hasBackdrop = true;
      dialogConfig.backdropClass = 'cdk-overlay-transparent-backdrop'
      this.setEditMessageDialogPosition(event, dialogConfig)
      this.dialogReference = this.dialog.open(this.editMessageDialog, dialogConfig);

      this.dialogReference.afterClosed().subscribe(() => {
        this.dialogReference = null; // Setzen Sie this.dialogReference auf null, wenn der Dialog geschlossen wurde
        this.showButton[i] = false;
      });
    }
  }

  /**
   * This function returns the position of the mouseclick
   * @param event mouseclick
   * @returns position of the mouseclick
   */
  setEditMessageDialogPosition(event: MouseEvent, dialogConfig: MatDialogConfig<any>,) {
    const offsetLeft = 0;
    const offsetY = 0;
    return dialogConfig.position = { top: `${event.clientY + offsetY}px`, left: `${event.clientX - offsetLeft}px` };
  }

  /**
   * This function sets the showbutton variable to true with timeout, because the (mouseleave) sets the variable with delay of false. Its for the
   * design when dialog edit message is open the hover effect doesnt go away
   * @param i index of message 
   */
  dontLeaveHover(i: number) {
    setTimeout(() => {
      this.showButton[i] = true;
    }, 3);
  }

  /**
   * edit a created message
   */
  async editMessage(messageId: any, messageIndex: number) {
    let message = await this.directChatService.getMessageForEdit(this.currentUserId, this.currentChatPartnerId, messageId)
    let img = await this.directChatService.getImgForDelete(this.currentUserId, this.currentChatPartnerId, messageId)
    this.editedMessageIndex = messageIndex;
    this.messageForEdit = message;
    this.imgForDelete = img;
    this.dialogReference?.close()
  }

  /**
   * opens the reaction dialog 
   */
  openReactionDialog(event: MouseEvent, emoji: any) {
    this.currentHoverEmoji = emoji; // Speichere die ausgewählte Emoji-Option
    if (!this.dialogReference) {
      const dialogConfig = new MatDialogConfig();
      dialogConfig.hasBackdrop = false;
      dialogConfig.autoFocus = false;
      dialogConfig.disableClose = true;
      dialogConfig.backdropClass = 'cdk-overlay-transparent-backdrop'
      this.setOpenReactionDialogPosition(event, dialogConfig)
      this.dialogReference = this.dialog.open(this.reactionInfo, dialogConfig);

      this.dialogReference.afterClosed().subscribe(() => {
        this.dialogReference = null;
      });
    }
  }

    /**
    * This function returns the position of the mouseclick
    * @param event mouseclick
    * @returns position of the mouseclick
    */
  setOpenReactionDialogPosition(event: MouseEvent, dialogConfig: MatDialogConfig<any>,) {
    const offsetLeft = 0;
    const offsetY = 125;
    return dialogConfig.position = { top: `${event.clientY - offsetY}px`, left: `${event.clientX - offsetLeft}px` };
  }

  /**
   * close the reaction dialog
   */
  closeReactionDialog() {
    if (this.dialogReference) {
      this.dialogReference.close();
    }
  }

  /**
   * add a reation to a message
   */
  addCurrentReaction(messageId: any, selectedEmoji: any) {
    this.directChatService.addEmojiToMessage(this.currentChatPartnerId, this.currentUserId, messageId, selectedEmoji)
    this.closeReactionDialog()
  }

  /**
   * add a quick reaction to a message
   */
  addQuickReaction(thumbsUp: boolean, thumbsDown: boolean, messageId: any) {
    let selectedEmoji: string;
    if (thumbsUp) {
      selectedEmoji = "👍"
      this.directChatService.addEmojiToMessage(this.currentChatPartnerId, this.currentUserId, messageId, selectedEmoji)
    } else if (thumbsDown) {
      selectedEmoji = "👎";
      this.directChatService.addEmojiToMessage(this.currentChatPartnerId, this.currentUserId, messageId, selectedEmoji)
    }
  }

  /**
   * open the file picker 
   */
  openFilePicker(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (event: any) => {
      const files = event.target.files;
      this.currentFile = files
      if (files && files.length > 0) {
        const file = files[0]; // Nehmen Sie die erste ausgewählte Datei
        if (this.message) {
          this.message += `\nDatei ausgewählt: ${file.name}`;
        } else {
          this.message = `Datei ausgewählt: ${file.name}`;
        }
      }
    };
    input.click();
  }

  /**
   * Show the userlist to add the name to textarea
   */
  async callMember(event: MouseEvent){
    await this.loadAllProfilePictures(this.users)
    const dialogConfig = new MatDialogConfig();
    dialogConfig.data = {
      mouseEventData: {
        clientX: event.clientX,
        clientY: event.clientY
      },
    }
    if (window.innerWidth < 500) {
      dialogConfig.width = '100%';
      dialogConfig.height = '100%';
      dialogConfig.maxWidth = '100vw';
      dialogConfig.maxHeight = '100vh';
    } else {
      const offsetLeft = 0;
      const offsetY = 200;
      dialogConfig.position = { top: `${event.clientY - offsetY}px`, left: `${event.clientX - offsetLeft}px` };
    }
    this.dialog.open(this.atUserList, dialogConfig);
  }

  /**
   * This function controls if the user use a own profile picture and the downloaded the image . After this the array Alluser is updatet.
   */
  async loadAllProfilePictures(users: User[]) {
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
   * Add the name to textarea
   */
  userToTextarea(name:string){
    if (!this.message) {
      this.message = '';
  }
  this.message += `@ ${name}`;
  this.dialog.closeAll();
  }
}
