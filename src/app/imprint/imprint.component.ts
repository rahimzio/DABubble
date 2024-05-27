import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { Location } from '@angular/common';
import { LogInService } from '../services/log-in.service';

@Component({
  selector: 'app-imprint',
  standalone: true,
  imports: [MatCardModule, MatIconModule, RouterModule, MatButtonModule],
  templateUrl: './imprint.component.html',
  styleUrl: './imprint.component.scss',
})
export class ImprintComponent {
  constructor(private location: Location){}
  loginService = inject(LogInService)



  /**
   * go back to the last screen
   */
  goBack(){
    this.location.back();
    this.loginService.introProhibet = true;
  }
}
