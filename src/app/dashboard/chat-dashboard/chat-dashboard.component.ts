import { Component, ViewChild, ElementRef, HostListener, inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ThreadComponent } from '../thread/thread.component';
import { channelDataclientService } from '../../services/channelsDataclient.service';

channelDataclientService
@Component({
  selector: 'app-chat-dashboard',
  standalone: true,
  imports: [MatIconModule, MatButtonModule,CommonModule],
  templateUrl: './chat-dashboard.component.html',
  styleUrl: './chat-dashboard.component.scss'
})
export class ChatDashboardComponent {
  color: boolean = false;
  isSmallScreen: boolean = false;
  channels:any;
  testChannel: any;
  channelService = inject(channelDataclientService)
  @ViewChild('emojiPicker') emojiPicker!: ElementRef;

  ngOnInit(): void {
    this.getAllChannels();
  }

  /**
   * load all channels from db
   */
  async getAllChannels() {
    try {
      this.channels = await this.channelService.getAllChannels(); // Warten Sie, bis die Daten zurückgegeben werden
      this.testChannel = this.channels[0];
    } catch (error) {
      console.error('Fehler beim Abrufen der Kanäle: ', error);
    }
  }

  @ViewChild(ThreadComponent) threadComponent!: ThreadComponent;
  
    @HostListener('window:resize', ['$event'])
    onResize(event: any) {
      this.checkScreenSize();
    }
  
    constructor() {
      this.checkScreenSize();
    }
  
    /**
     * check if screensize is lower than 770px
     */
    checkScreenSize() {
      if(typeof window !== 'undefined'){
      this.isSmallScreen = window.innerWidth < 770;
      }
    }
  
    /**
     * open the thread component
     */
    openThread() {
      if (this.threadComponent) {
        this.threadComponent.closeTab = false;
      } else {
        console.error('threadComponent wurde nicht gefunden oder nicht initialisiert.');
      }
    }
}
