import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter, Input, inject, ViewChild, ElementRef} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { channel } from '../../../../models/channels.class';
import { FirestoreService } from '../../../services/firestore.service';
import { MatDialog} from '@angular/material/dialog';
import {animate, state, style, transition, trigger} from '@angular/animations';
import { channelDataclientService } from '../../../services/channelsDataclient.service';
import { ActivatedRoute } from '@angular/router';
import { AddUserChannelDialogComponent } from './add-user-channel-dialog/add-user-channel-dialog.component';

@Component({
  selector: 'app-add-channel',
  standalone: true,
  imports: [MatButton, MatIcon, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './add-channel.component.html',
  styleUrl: './add-channel.component.scss',
  animations: [
    trigger('fadeIn', [
      state(
        'void',
        style({
          opacity: 0,
        })
      ),
      transition('void => *', [animate(300)]),
    ]),
  ],
})
export class AddChannelComponent {
  newChannel: channel = new channel();
  @Input() users: any[] = [];
  @ViewChild('channelName') channelName!: ElementRef;
  @ViewChild('validChannelName') validChannelName!: ElementRef;
  @ViewChild('duplicateChannelName') duplicateChannelName!: ElementRef;
  @Output() close = new EventEmitter<void>();
  userOverlay: boolean = false;
  selectedOption: string = '';
  currentName: string = '';
  userList!: any[];
  selectedUser: any[] = [];
  currentUserId: any;
  firestore = inject(FirestoreService);
  channelDataclient = inject(channelDataclientService);
  channelAdmin:any;

  constructor(private route: ActivatedRoute, public dialog: MatDialog) {
    this.getIdFromURL()
  }

  ngAfterViewInit(): void {
    this.addChannelAdmin()
  }

  /**
   * close the overlay
   */
  closeOverlay() {
    this.close.emit();
  }

  /**
   * get user id from the url
   */
  getIdFromURL() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id != null) {
      this.currentUserId = id;
    }
  }

  /**
   * add channel creator as channel admin
   */
  addChannelAdmin() {
    const channelAdmin = this.users.find(user => user.id === this.currentUserId);
    if (channelAdmin) {
      this.selectedUser.push(channelAdmin);
      this.channelAdmin = channelAdmin
    } else {
      console.error('Channel Admin not found with ID:', this.currentUserId);
    }
  }

  /**
   * check the channel name
   */
 async checkFormChannelName() {
    const channelName = this.channelName.nativeElement;
    const validChannelName = this.validChannelName.nativeElement;
    const duplicateChannelName = this.duplicateChannelName.nativeElement;
    if (channelName.validity.valid) {  
      validChannelName.style =  'opacity: 0; display: none;';
    } else {
      validChannelName.style = 'opacity: 1; display: flex;';
    }
    if(await this.channelDataclient.channelNameAlreadyExist(this.newChannel.name)){
      duplicateChannelName.style = 'opacity: 1; display: flex;';
    } else{
      duplicateChannelName.style = 'opacity: 0; display: none;';
    }
     if(!await this.channelDataclient.channelNameAlreadyExist(this.newChannel.name) && channelName.validity.valid ){
      this.openDialog()
      setTimeout(() => {
        this.closeOverlay()
      },500);
    }
  }

  /**
   * open the add user dialog
   */
  openDialog() {
    const dialogRef = this.dialog.open(AddUserChannelDialogComponent, {
      data: {
        channelAdmin: this.channelAdmin,
        channelName: this.newChannel.name,
        description: this.newChannel.description,
        users: this.users
      }
    });
  }
}
