import { Component, EventEmitter, HostListener, Input, Output, ViewChild, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { channelDataclientService } from '../../services/channelsDataclient.service';
import { ThreadService } from '../../services/thread.service';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms'
import { ActivatedRoute } from '@angular/router';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { EmojiDialogComponent } from '../../emoji-dialog/emoji-dialog.component';
import { StorageService } from '../../services/storage.service';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { User } from '../../../models/user.class';
import { FirestoreService } from '../../services/firestore.service';

@Component({
  selector: 'app-thread',
  standalone: true,
  imports: [MatCardModule, CommonModule, MatIconModule, FormsModule, MatTooltip],
  templateUrl: './thread.component.html',
  styleUrl: './thread.component.scss'
})
export class ThreadComponent {
  isSmallScreen: boolean = false;
  closeTab: boolean = false;
  chatService = inject(channelDataclientService);
  threadService = inject(ThreadService);
  storageService = inject(StorageService)
  fireStoreService = inject(FirestoreService)
  currentUserId: any;
  message: any;
  showButton: boolean[] = Array(this.threadService.chatDatas.length).fill(false);
  currentChannelData: any;
  currentHoverEmoji: any;
  messageForEdit: any;
  imgForDelete: any;
  @ViewChild('reactionInformationDialog') reactionInfo: any;
  @ViewChild('editMessageDialog') editMessageDialog: any;
  @ViewChild('atUserList') atUserList: any;
  dialogReference: MatDialogRef<any> | null = null;
  currentFile!: File | null;
  @Input() users: User[] = [];
  @Output() closedThread = new EventEmitter<void>();
  editedMessageIndex: number | null = null;

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    // this.checkScreenSize();
  }

  constructor(private route: ActivatedRoute, private dialog: MatDialog) {
    // this.checkScreenSize();
    this.getIdFromURL();
    this.subscribeToCurrentChannelData();
  }

  private subscribeToCurrentChannelData(): void {
    this.threadService.currentChannelData$.subscribe(data => {
      if (data) {
        this.currentChannelData = data;
      }
    });
  }

  /**
   * This function get the id from the current logged in user from the url
   */
  getIdFromURL() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id != null) {
      this.currentUserId = id;
    }
  }

  // /**
  //  * check if size screen is lower 1305px
  //  */
  // checkScreenSize() {
  //   if (typeof window !== 'undefined') {
  //     this.isSmallScreen = window.innerWidth < 1305;
  //   }
  // }

  /**
   * hide the tab
   */
  Dnone() {
    this.threadService.closeTab = true;
    this.closedThread.emit()
  }

  /**
   * This function send the message to the threadservice and sets the timestamp as id
   */
  async sendMessageToThread(message: any) {
    let timeStamp = Date.now().toString()
    if (this.currentFile) {
      const imgUrl = await this.storageService.uploadToThreadRef(this.currentFile, timeStamp)
      this.threadService.sendMessageToThread(timeStamp, message, this.currentUserId, imgUrl)
      this.currentFile = null;
      this.message = ''
    } else
      this.threadService.sendMessageToThread(timeStamp, message, this.currentUserId)
    this.message = '';
  }


  openUserDetail(none: any) {

  }

  /**
   * get the user avatar picture
   */
  getUserAvatar(userId: string): string {
    if (this.currentChannelData && this.currentChannelData.usersInChannel) {
      const user = this.currentChannelData.usersInChannel.find((user: any) => user.id === userId);
      return user ? user.avatar : 'assets/img/Logo.svg';
    } else {
      return 'assets/img/Logo.svg';
    }
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
        this.threadService.addEmojiToMessage(messageId, selectedEmoji, this.currentUserId)
      }
    });
  }

  /**
   * add a emoji to the edit message field
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
   * add a emoji to the answer field
   */
  addEmojitoAnswerMessageTextArea(selectedEmoji: any) {
    const textarea = document.getElementById('answerThread') as HTMLTextAreaElement;
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
      this.threadService.addEmojiToMessage(messageId, selectedEmoji, this.currentUserId)
    } else if (thumbsDown) {
      selectedEmoji = "👎"; // Daumen runter Emoji
      this.threadService.addEmojiToMessage(messageId, selectedEmoji, this.currentUserId)
    }
  }

  /**
   * add a reaction to a message 
   */
  addCurrentReaction(messageId: any, selectedEmoji: any) {
    this.threadService.addEmojiToMessage(messageId, selectedEmoji, this.currentUserId)
    this.closeReactionDialog()
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
        this.dialogReference = null; // Setzen Sie this.dialogReference auf null, wenn der Dialog geschlossen wurde
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
   * delete a added image
   */
  deleteImg() {
    this.imgForDelete = ''
  }

  /**
   * cancle the edit field
   */
  cancelEdit() {
    this.editedMessageIndex = null;
  }

  /**
   * save a edited message
   */
  async saveEdit(messageId: any, message: any, img?: any) {
    await this.threadService.editMessage(messageId, message, img)
    this.editedMessageIndex = null;
  }

  async editMessage(messageId: any, messageIndex: number) {
    let message = await this.threadService.getMessageForEdit(messageId)

    this.editedMessageIndex = messageIndex;
    this.messageForEdit = message;
    let img = await this.threadService.getImgForDelete(messageId)
    this.editedMessageIndex = messageIndex;
    this.imgForDelete = img;
    this.dialogReference?.close()
  }

  /**
   * add a answer by hit the enter key
   */
  onEnterPressed(event: any): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      // Enter-Taste wurde gedrückt und Shift-Taste nicht gehalten
      this.sendMessageToThread(this.message);
      event.preventDefault(); // Verhindert einen Zeilenumbruch im Textfeld
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
   * Show the userlist to add the name to textarea
   */
  async callMember(event: MouseEvent) {
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
  userToTextarea(name: string) {
    if (!this.message) {
      this.message = '';
    }
    this.message += `@ ${name}`;
    this.dialog.closeAll();
  }
}
