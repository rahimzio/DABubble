import { Component, ViewChild, ElementRef, inject } from '@angular/core';
import { IntroComponent } from './intro/intro.component';
import { MatCardModule } from '@angular/material/card';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, NgForm } from '@angular/forms';
import { FirestoreService } from '../services/firestore.service';
import { CommonModule } from '@angular/common';
import { LogInService } from '../services/log-in.service';
import { StorageService } from '../services/storage.service';
import { ThreadService } from '../services/thread.service';

@Component({
  selector: 'app-log-in',
  standalone: true,
  imports: [IntroComponent, MatCardModule, RouterModule, FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './log-in.component.html',
  styleUrl: './log-in.component.scss'
})
export class LogInComponent {
  @ViewChild('mailField') mailField!: ElementRef;
  @ViewChild(' passwordMessage') passwordMessage!: ElementRef;

  mail: any;
  password: any;
  disableButton = true;
  loginService = inject(LogInService)
  firestore = inject(FirestoreService)
  uploadService = inject(StorageService)
  threadService = inject(ThreadService)
  

  /**
   * log in function
   */
  async logIn() {
    this.validateCheck()
   await this.loginService.Login(this.mail, this.password) // erst nach dem check 
    this.threadService.closeTab = true;
  }

  /**
   * guest log in
   */
  guestLogin(){
    this.loginService.Login('Guest@mail.com', '12345678')
  }

  /**
   * log in with google function
   */
  async logInWithGoogle(){
   await this.loginService.loginWithGoogle()
   this.threadService.closeTab = true;
  }

  /**
   * form validation for the log in datas
   */
  validateCheck() {
    const mailfield = this.mailField.nativeElement;
    const passwordMessage = this.passwordMessage.nativeElement;
  
    // Benutzerdefinierte Überprüfung der E-Mail-Adresse
    const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i; // 'i' am Ende macht das Muster case-insensitive
  
    if (!emailPattern.test(mailfield.value)) {
      passwordMessage.style.opacity = '1';
    } else {
      passwordMessage.style.opacity = '0';
    }
  }

  /**
   * This function checks if the inputs are emtpy and enable it, if the inputs are not
   */
  checkButtonDisabled() {
    this.disableButton = !(this.mail && this.mail.length > 0 && this.password && this.password.length > 0);
  }
}