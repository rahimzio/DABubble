import { Component, Inject, inject } from '@angular/core';
import { MatCard } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { FirestoreService } from '../../../services/firestore.service';
import { channelDataclientService } from '../../../services/channelsDataclient.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-edit-group-channel-dialog',
  standalone: true,
  imports: [MatCard, CommonModule],
  templateUrl: './edit-group-channel-dialog.component.html',
  styleUrl: './edit-group-channel-dialog.component.scss',
})
export class EditGroupChannelDialogComponent {
  constructor(
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  channelId!: string;
  currentChannelData!: any;
  firestoreService = inject(FirestoreService);
  channelsDataclientService = inject(channelDataclientService);
  name!: string;
  description!: string;
  creator!: string;
  isChannelNameEdit: boolean = false;
  isDescriptionEdit: boolean = false;
  updatedDescriptionValue: string = "";
  updatedNameValue: string = "";
  currentUserId!:string;

  async ngOnInit() {
    this.channelId = this.data.channelId;
    this.currentUserId = this.data.userId
    await this.loadCurrentDatas();
    this.name = this.currentChannelData.name;
    this.description = this.currentChannelData.description;
    this.creator = this.currentChannelData.creator;
  }

  /**
   * This function download the channeldatas from the channelService per id.
   */
  async loadCurrentDatas() {
    try {
      const data = await this.channelsDataclientService.getCurrentChannel(
        this.channelId
      );
      this.currentChannelData = data;
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
    }
  }

  /**
   * Close the dialog
   */
  close() {
    this.dialog.closeAll();
  }

  /**
   * open the edit name view
   */
  editName() {
    this.isChannelNameEdit = true;
  }

  /**
   * open the edit description view
   */
  editDescription() {
    this.isDescriptionEdit = true;
  }

  /**
   * save the changed name value
   */
  async saveName() {
    this.isChannelNameEdit = false;
    this.name = this.updatedNameValue;
    await this.channelsDataclientService.updateChannelName(this.channelId, this.name);

  }

  /**
   * save the changed description value
   */
  async saveDescription() {
    this.isDescriptionEdit = false;
    this.description = this.updatedDescriptionValue;
    await this.channelsDataclientService.updateChannelDescription(this.channelId, this.description);
  }

  /**
   * update the description variable with the input value
   * @param event 
   */
  updateDescriptionValue(event: any) {
    this.updatedDescriptionValue = event.target.value;
  }

  /**
   * update the name variable with the input value
   * @param event 
   */
  updateNameValue(event: any) {
    this.updatedNameValue = event.target.value;
  }

  /**
   * leave a channel
   */
  leaveChannel() {
    this.channelsDataclientService.leaveChannel( this.currentUserId, this.channelId)
  }
}
