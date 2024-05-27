import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { User } from '../../models/user.class';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CreateAccountService } from '../services/create-account.service';
import { RouterModule } from '@angular/router';
import { LogInService } from '../services/log-in.service';

@Component({
  selector: 'app-create-account',
  standalone: true,
  imports: [MatCardModule, FormsModule, CommonModule, RouterModule],
  templateUrl: './create-account.component.html',
  styleUrl: './create-account.component.scss',
})
export class CreateAccountComponent {
  createAccountService = inject(CreateAccountService);
  loginService = inject(LogInService);
  newUser = new User();
  nameFailed = false;
  mailFailed = false;
  pswFailed = false;
  dataprotectionFailed = false;
  isAgreed!: boolean;
  disableButton = true;
  errorMessage: any;


  ngOnInit(): void {
    this.loginService.introProhibet = true;
  }

  /**
   * Create a user and save in db
   */
  createAccount() {
    if (
      this.checkNameInputNotEmpty() &&
      this.checkIfCorrectMailFormat() &&
      this.checkCorrectPasswordFormat() &&
      this.checkDataprotectionIsSet()
    ) {
      this.disableButton = false;
      this.createAccountService.createUserWithEmailAndPassword(
        this.newUser.eMail,
        this.newUser.password,
        this.newUser
      ).then(errorMessage => {
        if (errorMessage) {
          this.errorMessage = errorMessage;
        }
      });
    }
  }

  /**
   * validate name is not empty
   */
  checkNameInputNotEmpty() {
    this.nameFailed = this.newUser.name.length <= 4;
    return !this.nameFailed;
  }

  /**
   * validate email is not empty
   */
  checkIfCorrectMailFormat() {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    this.mailFailed = !(
      this.newUser.eMail.match(emailPattern) && this.newUser.eMail.length > 6
    );
    return !this.mailFailed;
  }

  /**
   * validate password is not empty and longer than 7 characters
   */
  checkCorrectPasswordFormat() {
    this.pswFailed = this.newUser.password.length < 8;
    return !this.pswFailed;
  }

  /**
   * validate dataprotection button is set
   */
  checkDataprotectionIsSet() {
    this.dataprotectionFailed = !this.isAgreed;
    return !this.dataprotectionFailed;
  }

  /**
 * This function checks if the inputs are emtpy and enable it, if the inputs are not
 */
  checkButtonDisabled() {
    this.disableButton = !(this.newUser.name.length > 0 && this.newUser.eMail.length > 0 && this.newUser.password.length > 0 && this.isAgreed);
  }
}
