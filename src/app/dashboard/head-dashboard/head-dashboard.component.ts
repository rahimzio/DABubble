import { Component, ElementRef, Input, Output, ViewChild, inject, EventEmitter } from '@angular/core';
import { ActivatedRoute, Router, } from '@angular/router';
import { StorageService } from '../../services/storage.service';
import { FirestoreService } from '../../services/firestore.service';
import { User } from '../../../models/user.class';
import { MatDialogConfig } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { UserMenuDialogComponent } from './user-menu-dialog/user-menu-dialog.component';
import { channel } from '../../../models/channels.class';
import { channelDataclientService } from '../../services/channelsDataclient.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-head-dashboard',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './head-dashboard.component.html',
  styleUrl: './head-dashboard.component.scss'
})
export class HeadDashboardComponent {

  firestoreService = inject(FirestoreService)
  downloadService = inject(StorageService)
  channelService = inject(channelDataclientService)
  userId = '';
  actualUser: any;
  name: any;
  @ViewChild('profilePicture') profilePicture!: ElementRef;
  channels: channel[] = [];
  users: any
  profilePicturesLoaded: boolean = false;
  filteredChannels: channel[] = [];
  filteredUsers: any[] = [];
  filteredMessages: any[] = []
  searchTerm: string = '';
  @Input() groupChatVisible: boolean = false;
  @Input() directChatVisible: boolean = false;
  @Input() sidenavVisible: boolean = true;
  @Output() backClicked = new EventEmitter<void>();

  @Output() groupChatEvent = new EventEmitter<boolean>();
  @Output() directChatEvent = new EventEmitter<boolean>();
  @Output() clickedChannelIdEvent = new EventEmitter<string>();
  @Output() clickedUserIdEvent = new EventEmitter<string>();

  constructor(private route: ActivatedRoute, private router: Router, public dialog: MatDialog) { }

  ngOnInit(): void {
    this.firestoreService.changedUserName$.subscribe(() => {
      this.downloadProfileDatas(); // Funktion in der Komponente ausführen
    });
    this.getIdFromURL();
    this.downloadProfileDatas();
    this.channels = this.channelService.channels
    this.firestoreService.getAllUsers().then(async (users) => {
      await this.loadProfilePictures(users);
      this.users = users;
    })
      .catch((error) => {
        console.error('Fehler beim Abrufffen der Benutzerdaten:', error);
      });
  }

  /**
    * read UserID from the Url.
  */
  getIdFromURL() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id != null) {
      this.userId = id;
    }
  }

  /**
   * this function load all user informations by user-id
   * @param userID 
   */
  async downloadProfileDatas() {
    await this.firestoreService
      .getUserDataById(this.userId)
      .then((data) => {
        this.actualUser = new User(data);
        if (this.actualUser) {
          this.name = this.actualUser.name;
        }
      })
      .catch((error) => {
        console.error('Fehler beim Laden des Benutzers: ', error);
      });
    this.controlIfOwnPictureUsed(this.userId)
  }

  /**
   * this function checks if the user use an uploaded or standard avatar picture
   * @param userID 
   */
  async controlIfOwnPictureUsed(userID: any) {
    if (this.actualUser.avatar === 'ownPictureDA') {
      await this.downloadService.downloadAvatar(userID);
    } else if (this.profilePicture && this.profilePicture.nativeElement) {
      this.profilePicture.nativeElement.src = this.actualUser.avatar;
    } else {
      console.error('Das Bild-Element wurde nicht richtig initialisiert.');
    }
  }

  /**
   * this function opens the user menu dialog
   */
  openDialog() {
    let user = this.actualUser;
    if (user.avatar == 'ownPictureDA') {
      user.avatar = this.downloadService.downloadedProfileImg;
    }
    const dialogConfig = new MatDialogConfig();
    dialogConfig.position = {
      top: '100px',
      right: '20px',
    };
    dialogConfig.panelClass = 'transparent-dialog';
    dialogConfig.data = {
      user: user,
    }
    this.dialog.open(UserMenuDialogComponent, dialogConfig);
  }

  /**
   * This function controls if the user use a own profile picture and the downloaded the image . After this the array Alluser is updatet.
   */
  async loadProfilePictures(users: User[]) {
    let allProfilePicturesLoaded = true; // Annahme: Alle Bilder sind zunächst geladen
    for (const user of users) {
      if (user.avatar === 'ownPictureDA') {
        const profilePictureURL = `gs://dabubble-51e17.appspot.com/${user.id}/ownPictureDA`;
        try {
          const downloadedImageUrl = await this.downloadService.downloadImage(
            profilePictureURL
          );
          // Weisen Sie die heruntergeladenen Bild-URL dem Benutzerobjekt zu
          user.avatar = downloadedImageUrl;
        } catch (error) {
          console.error('Error downloading user profile picture:', error);
          allProfilePicturesLoaded = false; // Setzen Sie den Zustand auf falsch, wenn ein Bild nicht geladen werden konnte
        }
      }
    }
    this.profilePicturesLoaded = allProfilePicturesLoaded; // Setzen Sie das Flag basierend auf dem Ladezustand der Bilder
  }

  /**
   * filter channels and users by name
   */
  filterChannelsAndUsers() {
    if (this.searchTerm) {
      if (this.searchTerm.startsWith('@')) {
        this.filteredChannels = [];
        this.filteredUsers = this.users.filter((user: { name: string; }) => {
          return user.name.toLowerCase().includes(this.searchTerm.substring(1).toLowerCase());
        });
      } else if (this.searchTerm.startsWith('#')) {
        this.filteredUsers = [];
        this.filteredChannels = this.channels.filter(channel => {
          return channel.name.toLowerCase().includes(this.searchTerm.substring(1).toLowerCase()) ||
            channel.id.toLowerCase().includes(this.searchTerm.substring(1).toLowerCase());
        });
      } else {
        // Wenn weder '@' noch '#' am Anfang stehen, nach beiden suchen
        this.filteredChannels = this.channels.filter(channel => {
          return channel.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            channel.id.toLowerCase().includes(this.searchTerm.toLowerCase());
        });

        this.filteredUsers = this.users.filter((user: { name: string; id: string; }) => {
          return user.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            user.id.toLowerCase().includes(this.searchTerm.toLowerCase());
        });
        // Durchsuchen der Nachrichten im Array this.allChatMessages
      this.filteredMessages = this.channelService.allChatMessages.filter((message: { message: string; }) => {
        return message && message.message && typeof message.message === 'string' &&
          message.message.toLowerCase().includes(this.searchTerm.toLowerCase());
      });
    }
  } else {
    this.filteredChannels = this.channels;
    this.filteredUsers = this.users;
    this.filteredMessages = this.channelService.allChatMessages;
  }
  }

  /**
   * open a message by id
   */
  openUserMessage(id: any) {
    this.groupChatEvent.emit(false);
    this.directChatEvent.emit(true);
    this.clickedUserIdEvent.emit(id);
    this.searchTerm = '';
  }

  /**
   * open a channel by id
   */
  openChannel(id: any) {
    this.directChatEvent.emit(false);
    this.groupChatEvent.emit(true);
    this.clickedChannelIdEvent.emit(id);
    this.searchTerm = '';
  }
}


