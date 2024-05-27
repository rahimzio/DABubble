import { Component, Inject } from '@angular/core';
import { MatCard } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-emoji-dialog',
  standalone: true,
  imports: [MatCard],
  templateUrl: './emoji-dialog.component.html',
  styleUrl: './emoji-dialog.component.scss',
})
export class EmojiDialogComponent {
  constructor(private dialog: MatDialog, @Inject(MAT_DIALOG_DATA) public data: any, private dialogRef: MatDialogRef<EmojiDialogComponent>) {}

  selectedEmoji: string = "";

  /**
   * pics a selected emoji
   * @param id 
   */
  emojiClick(id: string) {
    const emoji = document.getElementById(id)?.innerHTML;

    if(emoji){
    this.selectedEmoji = emoji;
    }
    this.close();
  }

  /**
   * close the dialog complete
   */
  close() {
    this.dialogRef.close(this.selectedEmoji);
  }
}
