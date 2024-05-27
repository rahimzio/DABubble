import {
  Component,
  ElementRef,
  ViewChild,
  viewChild,
  Renderer2,
  inject,
  Input,
  Output,
  EventEmitter,
  ViewChildren,
  QueryList,
  OnDestroy,
  HostListener,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import {
  state,
  trigger,
  animate,
  style,
  transition,
} from '@angular/animations';
import { FirestoreService } from '../../services/firestore.service';
import { AddChannelComponent } from './add-channel/add-channel.component';
import { StorageService } from '../../services/storage.service';
import { User } from '../../../models/user.class';
import { ActivatedRoute } from '@angular/router';
import { channelDataclientService } from '../../services/channelsDataclient.service';
import { Subscription } from 'rxjs';
import { SharedServiceService } from '../../services/shared-service.service';
import { FormsModule } from '@angular/forms';
import { channel } from '../../../models/channels.class';

@Component({
  selector: 'app-sidenav-dashboard',
  standalone: true,
  imports: [CommonModule, AddChannelComponent, FormsModule],
  templateUrl: './sidenav-dashboard.component.html',
  styleUrl: './sidenav-dashboard.component.scss',
  animations: [
    trigger('menuVisibility', [
      state('visible', style({ opacity: 1, height: '*' })),
      state('hidden', style({ opacity: 0, height: '0px' })),
      transition('visible <=> hidden', [animate('200ms ease-in-out')]), // Adjust duration and timing as needed
    ]),
  ],
})
export class SidenavDashboardComponent implements OnDestroy {
  private subscription: Subscription| undefined;
  firestoreService = inject(FirestoreService);
  downloadService = inject(StorageService);
  channelService = inject(channelDataclientService);
  channelOverlay: boolean = false;
  userIds: any;
  currentUserId: any;
  profilePicturesLoaded: boolean = false;
  addChannelOverlay: boolean = false;
  channelsmenu: boolean = true;
  userMenu: boolean = true;
  channelNames: any;
  searchTerm: string = '';
  filteredChannels: channel[] = [];
  filteredUsers: any[] = [];
  filteredMessages: any[] = []
  channels: channel[] = [];

  @Input() users: User[] = [];
  @ViewChildren('profilePicture') profilePictures!: QueryList<ElementRef>;
  @ViewChildren('statusLight') statusLights!: QueryList<ElementRef>;
  @Output() groupChatEvent = new EventEmitter<boolean>();
  @Output() directChatEvent = new EventEmitter<boolean>();
  @Output() clickedChannelIdEvent = new EventEmitter<string>();
  @Output() clickedUserIdEvent = new EventEmitter<string>();

  constructor(private route: ActivatedRoute, private sharedService: SharedServiceService) {
    this.subscription = this.sharedService.selectedUserId$.subscribe(userId => {
      if (userId) {
        this.openDirectChat(userId);
      }
    });
  }

  sidenavIsHide: boolean = false;
  imageUrl: string = 'assets/img/close-menu.svg';

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (window.innerWidth < 950) {
      this.sidenavIsHide = true;
    } else {
      this.sidenavIsHide = false;
    }
  }

  /**
   *this function toggle the variable sidenavIsHide to true, if sidenav closed
   */
  toggleSidenav() {
    this.sidenavIsHide = !this.sidenavIsHide;
  }

  /**
   * change the src für the "Workspace Menü" button bei hover it
   */
  onMouseEnter(): void {
    if (!this.sidenavIsHide) {
      this.imageUrl = 'assets/img/close-menu-hover.svg';
    } else {
      this.imageUrl = 'assets/img/open-menu-hover.svg';
    }
  }

  /**
  * change the src für the "Workspace Menü" button bei hover it
  */
  onMouseLeave(): void {
    if (!this.sidenavIsHide) {
      this.imageUrl = 'assets/img/close-menu.svg';
    } else {
      this.imageUrl = 'assets/img/open-menu.svg';
    }
  }

  /**
   * This function downloaded the userdata and starts the imagedownloadfunction. After this, the datas are rendering at html
   */
  ngAfterViewInit(): void {
    this.getIdFromURL();
    this.channels = this.channelService.channels
    this.firestoreService
      .getAllUsers()
      .then(async (users) => {
        // Laden Sie die Bilder aus dem Storage für jeden Benutzer
        await this.loadProfilePictures(users);

        // Handle users data
        this.users = users;
      })
      .catch((error) => {
        console.error('Fehler beim Abrufffen der Benutzerdaten:', error);
      });

     this.downloadChannels(this.currentUserId);
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
   * toggle the channel menu
   */
  togglechannelsMenu() {
    this.channelsmenu = !this.channelsmenu;
  }

  /**
   * toggle the user menu
   */
  toggleUsersMenu() {
    this.userMenu = !this.userMenu;
  }

  /**
   * toggle the sidenav
   */
  toggleChannelOverlay() {
    this.channelOverlay = !this.channelOverlay;
  }

  /**
   * get the user id from the url
   */
  getIdFromURL() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id != null) {
      this.currentUserId = id;
    }
  }
  async downloadChannels(userId: any) {
    await this.channelService.getUserChannelId(userId);
  }

  /**
   * open the group chat by id
   */
  openGroupChat(id: any) {
    this.directChatEvent.emit(false);
    this.groupChatEvent.emit(true);
    this.clickedChannelIdEvent.emit(id);
  }

  /**
   * open the direct chat by id
   */
  openDirectChat(id: any) {
    this.groupChatEvent.emit(false);
    this.directChatEvent.emit(true);
    this.clickedUserIdEvent.emit(id);
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
   * open a message
   */
  openUserMessage(id: any) {
    this.groupChatEvent.emit(false);
    this.directChatEvent.emit(true);
    this.clickedUserIdEvent.emit(id);
    this.searchTerm = '';
  }

  /**
   * open the channel by id
   */
  openChannel(id: any) {
    this.directChatEvent.emit(false);
    this.groupChatEvent.emit(true);
    this.clickedChannelIdEvent.emit(id);
    this.searchTerm = '';
  }
}
