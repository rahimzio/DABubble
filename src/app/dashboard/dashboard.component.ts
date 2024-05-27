import { Component, inject, AfterViewInit, ViewChild, HostListener} from '@angular/core';
import { HeadDashboardComponent } from './head-dashboard/head-dashboard.component';
import { SidenavDashboardComponent } from './sidenav-dashboard/sidenav-dashboard.component';
import { ChatDashboardComponent } from './chat-dashboard/chat-dashboard.component';
import { FirestoreService } from '../services/firestore.service';
import { ActivatedRoute } from '@angular/router';
import { User } from '../../models/user.class';
import { StorageService } from '../services/storage.service';
import { ThreadComponent } from './thread/thread.component';
import { DirectChatComponent } from './direct-chat/direct-chat.component';
import { GroupChatComponent } from './group-chat/group-chat.component';
import { CommonModule } from '@angular/common';
import { LogInService } from '../services/log-in.service';
import { ThreadService } from '../services/thread.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [HeadDashboardComponent, SidenavDashboardComponent, ChatDashboardComponent, ThreadComponent, DirectChatComponent, GroupChatComponent, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})

export class DashboardComponent {
  constructor(private route: ActivatedRoute) { }
  firestoreService = inject(FirestoreService)
  downloadService = inject(StorageService)
  loginService = inject(LogInService)
  threadService = inject(ThreadService)
  userId: any;
  users: User[] = [];
  profilePictureReady: boolean = false;
  @ViewChild('sidenav') sidenav!: SidenavDashboardComponent;
  groupChatVisible: boolean = false;
  directChatVisible: boolean = false;
  currentGroupChat!: string;
  currentDirectChat!: string;
  sidenavVisible: boolean = true;
  

  ngOnInit(): void {
    this.getIdFromURL();
    this.firestoreService.checkIfUserOnline(this.userId);
    this.loginService.introProhibet = true;
  }

  ngAfterViewInit(): void {
    this.firestoreService.getAllUsers().then(users => {
      // Handle users data
      this.users = users;
    }).catch(error => {
      console.error('Fehler beim Abrufffen der Benutzerdaten:', error);
    });
  }


  /**
   * This function get the id from the current logged in user from the url
   */
  getIdFromURL() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id != null) {
      this.userId = id;
    }
  }


  /**
  * This function sets the boolean to true or false to show with ngIf the right chat variant
  */
  handleGroupChatVisibility(event: boolean) {
    this.groupChatVisible = event;
    this.updateSidenavVisibility();
  }


  /**
   * This function sets the boolean to true or false to show with ngIf the right chat variant
   */
  handleDirectChatVisibility(event: boolean) {
    this.directChatVisible = event;
    this.updateSidenavVisibility();
  }


  /**
   * handle the current group id
   */
  handleCurrentGroupId(id: string) {
    this.currentGroupChat = id;
    this.updateSidenavVisibility();
  }

  /**
   * handle the current direct chat id
   */
  handleDirectChatId(id: string) {
    this.currentDirectChat = id;
    this.updateSidenavVisibility();
  }

  /**
   * update the sidenav visibility if event is clicked and window with is lower 500px
   */
  updateSidenavVisibility(): void {
    const shouldHideSidenav = (window.innerWidth < 500) && (this.groupChatVisible || this.directChatVisible || this.currentGroupChat || this.currentDirectChat);
    this.sidenavVisible = !shouldHideSidenav;
  }

   /**
 * Update the group chat visibility if the window width is lower than 500px.
 */
updateGroupChatVisibility(): void {
  if (window.innerWidth >= 500) {
    return;
  }
  const shouldHideGroupChat = this.groupChatVisible || this.directChatVisible || this.currentGroupChat || this.currentDirectChat;

  if (this.threadService.closeTab === false) {
    this.groupChatVisible = false;
    this.directChatVisible = false;
  } else if(this.threadService.closeTab === true) {
    this.groupChatVisible = true;

  }
}

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    this.checkWindowWidth();
  }

  /**
   * check if window width < 500px
   */
  checkWindowWidth(): void {
    const shouldHideSidenav = this.groupChatVisible || this.directChatVisible || this.currentGroupChat || this.currentDirectChat;
    this.sidenavVisible = window.innerWidth >= 500 || !shouldHideSidenav;
  }

  /**
   * this function make sidnav visible and directChat and groupChat unvisible, after click back funtion in deh head-dashboard (only width lower 500px)
   */
  handleBackClick(): void {
    this.sidenavVisible = true;
    this.directChatVisible = false;
    this.groupChatVisible = false;
    this.threadService.closeTab = true;
  }
}
