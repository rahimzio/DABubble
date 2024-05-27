import { Component, Input, inject, SimpleChanges, ElementRef, ViewChild, Output, EventEmitter } from '@angular/core';
import { channelDataclientService } from '../../services/channelsDataclient.service';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogConfig, MatDialogClose, MatDialogRef, } from '@angular/material/dialog';
import { EditGroupChannelDialogComponent } from './edit-group-channel-dialog/edit-group-channel-dialog.component';
import { FormsModule } from '@angular/forms'
import { ActivatedRoute } from '@angular/router';
import { FirestoreService } from '../../services/firestore.service';
import { ShowMemberDialogComponent } from './show-member-dialog/show-member-dialog.component';
import { UserDetailDialogComponent } from '../user-detail-dialog/user-detail-dialog.component';
import { User } from '../../../models/user.class';
import { MatIconModule } from '@angular/material/icon';
import { ThreadService } from '../../services/thread.service';
import { EmojiDialogComponent } from '../../emoji-dialog/emoji-dialog.component';
import { StorageService } from '../../services/storage.service';
import {MatTooltipModule} from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';


@Component({
  selector: 'app-group-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogClose, MatIconModule, MatTooltipModule, MatCardModule],
  templateUrl: './group-chat.component.html',
  styleUrl: './group-chat.component.scss',
})
export class GroupChatComponent {
  @Input() currentId!: string;
  chatService = inject(channelDataclientService);
  fireStoreService = inject(FirestoreService);
  threadService = inject(ThreadService);
  storageService = inject(StorageService)
  currentChannelData: any;
  currentChat: any;
  message: any;
  yourMessage: any;
  currentUserId: any;
  @Input() users: User[] = [];
  showButton: boolean[] = Array(this.chatService.chatDatas.length).fill(false);
  showReaction: boolean[] = Array(this.chatService.chatDatas.length).fill(false);
  @ViewChild('editMessageDialog') editMessageDialog: any;
  @ViewChild('reactionInformationDialog') reactionInfo: any;
  @ViewChild('atUserList') atUserList: any;
  dialogReference: MatDialogRef<any> | null = null;
  editedMessageIndex: number | null = null;
  messageForEdit: any;
  imgForDelete: any;
  currentHoverEmoji: any;
  currentFile!: File | null;
  @Output() threadEvent = new EventEmitter<void>();


  constructor(public dialog: MatDialog, private route: ActivatedRoute, private elementRef: ElementRef,) {
    this.getIdFromURL()
  }

  /**
   * get the user id from url
   */
  getIdFromURL() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id != null) {
      this.currentUserId = id;
    }
  }

  /**
   * This function checks if the id is changed by clicked on another channel in sidenav
   */
  async ngOnChanges(changes: SimpleChanges) {
    if (changes['currentId']) {
      await this.loadCurrentDatas();
    }
  }

  /**
   * This function download the channeldatas from the channelService per id.
   */
  async loadCurrentDatas() {
    try {
      const data = await this.chatService.getCurrentChannel(this.currentId);
      this.currentChannelData = data;
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
    }
    await this.loadCurrentChat()
  }

  /**
   * load the current chat from db
   */
  async loadCurrentChat() {
    await this.chatService.getCurrentChats(this.currentId, this.currentUserId);
  }

  /**
   * open the edit dialog
   */
  openEditDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = 'transparent-dialog';
    if (window.innerWidth < 500) {
      dialogConfig.width = '100%';
      dialogConfig.height = '100%';
      dialogConfig.position = { top: '0', left: '0' };
    }
    dialogConfig.data = {
      channelId: this.currentChannelData.id,
      userId: this.currentUserId
    }
    this.dialog.open(EditGroupChannelDialogComponent, dialogConfig);
  }

  /**
   * send the message with the needed information to the chatservice and clears the textarea
   */
  async sendMessage(channelId: string) {
    let timeStamp = Date.now().toString()
    if (this.currentFile) {
      const imgUrl = await this.storageService.uploadToChannelRef(this.currentFile, channelId)
      await this.chatService.sendChat(channelId, timeStamp, this.message, this.currentUserId, imgUrl)
      this.currentFile = null;
      this.message = ''
    } else
      this.chatService.sendChat(channelId, timeStamp, this.message, this.currentUserId)
    this.message = ''
  }

  /**
   * get the user avatar from db
   */
  getUserAvatar(userId: string): string {
    if (this.currentChannelData && this.currentChannelData.usersInChannel) {
      const user = this.currentChannelData.usersInChannel.find((user: any) => user.id === userId);
      return user ? user.avatar : 'assets/img/Logo.svg';
    } else {
      return 'assets/img/Logo.svg'; // Fallback, wenn currentChannelData oder usersInChannel nicht definiert ist
    }
  }

  /**
   * shows all in chat included user in a dialog
   */
  openShowMemberDialog(event: MouseEvent, showMember: boolean, addMember: boolean): void {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.data = {
      channelData: this.currentChannelData,
      allUsers: this.users,
      mouseEventData: {
        clientX: event.clientX,
        clientY: event.clientY
      },
      showMemberSection: showMember,
      addMemberSection: addMember
    }
    if (window.innerWidth < 500) {
      dialogConfig.width = '100%';
      dialogConfig.height = '100%';
      dialogConfig.maxWidth = '100vw';
      dialogConfig.maxHeight = '100vh';
    } else {
      const offsetLeft = 400;
      const offsetY = 20;
      dialogConfig.position = { top: `${event.clientY + offsetY}px`, left: `${event.clientX - offsetLeft}px` };
    }
    this.dialog.open(ShowMemberDialogComponent, dialogConfig);
  }

  /**
   * open a dialog to add a user to chat
   */
  openAddUserDialog(event: MouseEvent): void {
    this.openShowMemberDialog(event, false, true)
  }

  /**
  * open the user detail dialog
  */
  openUserDetail(user: any) {
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
      userInChannel: this.currentChannelData,
    }
    this.dialog.open(UserDetailDialogComponent, dialogConfig);
  }

  /**
   * open the thread component
   */
  openThread(messageId: any) :void{
    this.threadService.closeTab = false;
    this.threadService.currentChatId = messageId;
    this.threadService.currentGroupId = this.currentId
    this.threadService.getCurrentThreadCollection(this.currentId, messageId, this.currentUserId)
    this.threadService.setCurrentChannelData(this.currentChannelData)
    this.threadEvent.emit();
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
   * open the reaction dialog
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
   * close the reaction dialog
   */
  closeReactionDialog() {
    if (this.dialogReference) {
      this.dialogReference.close();
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
    let message = await this.chatService.getMessageForEdit(this.currentId, messageId)
    let img = await this.chatService.getImgForDelete(this.currentId, messageId)
    this.editedMessageIndex = messageIndex;
    this.messageForEdit = message;
    this.imgForDelete = img;
    this.dialogReference?.close()
  }

  /**
   * cancle the edited message
   */
  cancelEdit() {
    this.editedMessageIndex = null;
  }

  /**
   * save a edited message
   */
  async saveEdit(messageId: any, message: any, img?: any) {
    await this.chatService.editMessage(this.currentId, messageId, message, img)
    this.editedMessageIndex = null;
  }

  /**
   * delete a added image
   */
  deleteImg() {
    this.imgForDelete = ''
  }

  /**
  * open the emojiDialog and insert the returned emoji in the textarea field
  */
  openEmojiDialog(event: MouseEvent, addEmojiToTextArea: boolean, addEmojiReaction: boolean, messageId?: any, emojiToEditMessage?: boolean) {
    const offsetY = 300;
    const dialogConfig = new MatDialogConfig();
    dialogConfig.position = { top: `${event.clientY - offsetY}px`, left: `${event.clientX}px` };
    dialogConfig.backdropClass = 'cdk-overlay-transparent-backdrop';
    this.dialog.open(EmojiDialogComponent, dialogConfig).afterClosed().subscribe((selectedEmoji: string | undefined) => {
      if (selectedEmoji && addEmojiToTextArea) {
        if (emojiToEditMessage) {
          this.addEmojitoEditMessageTextArea(selectedEmoji)
        } else if (!emojiToEditMessage) {
          this.addEmojitoAnswerMessageTextArea(selectedEmoji)
        }
      }
      if (selectedEmoji && addEmojiReaction) {
        this.chatService.addEmojiToMessage(this.currentId, messageId, selectedEmoji, this.currentUserId)
      }
    });
  }

  /**
   * add a emoji to a edited message
   */
  addEmojitoEditMessageTextArea(selectedEmoji: any) {
    const textarea = document.getElementById('edit-message') as HTMLTextAreaElement;
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

  /**
   * add a emoji to a answer
   */
  addEmojitoAnswerMessageTextArea(selectedEmoji: any) {
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


  /**
   * add a reaction to a message
   */
  addQuickReaction(thumbsUp: boolean, thumbsDown: boolean, messageId: any) {
    let selectedEmoji: string;
    if (thumbsUp) {
      selectedEmoji = "👍"
      this.chatService.addEmojiToMessage(this.currentId, messageId, selectedEmoji, this.currentUserId)
    } else if (thumbsDown) {
      selectedEmoji = "👎";
      this.chatService.addEmojiToMessage(this.currentId, messageId, selectedEmoji, this.currentUserId)
    }
  }

  /**
   * add a reaction to a message and close the info dialog
   */
  addCurrentReaction(messageId: any, selectedEmoji: any) {
    this.chatService.addEmojiToMessage(this.currentId, messageId, selectedEmoji, this.currentUserId)
    this.closeReactionDialog()
  }

  /**
   * format time stamp
   */
  formatLastMessageTime(lastMessage: any): string {
    const currentTime = new Date();
    const messageTime = new Date(lastMessage);
    if (isNaN(messageTime.getTime())) {
      messageTime.setTime(lastMessage);
    }
    const diffInMilliseconds = currentTime.getTime() - messageTime.getTime();
    const diffInDays = diffInMilliseconds / (1000 * 60 * 60 * 24);
    if (diffInDays < 1) {
      return messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays < 2) {
      return 'Gestern';
    } else {
      return messageTime.toLocaleDateString();
    }
  }

  /**
   * open a file picer to add a image
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
   * add a answer by hit the enter button
   */
  onEnterPressed(event: any): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      this.sendMessage(this.currentChannelData.id);
      event.preventDefault(); // Verhindert einen Zeilenumbruch im Textfeld
    }
  }
  
  /**
   * Show the userlist to add the name to textarea
   */
  async callMember(event: MouseEvent){
    await this.loadProfilePictures(this.users)
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
  async loadProfilePictures(users: User[]) {
    for (const user of users) {
      if (user.avatar === 'ownPictureDA') {
        const profilePictureURL = `gs://dabubble-51e17.appspot.com/${user.id}/ownPictureDA`;
        try {
          const downloadedImageUrl = await this.storageService.downloadImage(
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
