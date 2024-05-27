import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Location } from '@angular/common';
import { LogInService } from '../services/log-in.service';

@Component({
  selector: 'app-dataprotection',
  standalone: true,
  imports: [RouterModule, MatCardModule, MatIconModule, MatButtonModule],
  templateUrl: './dataprotection.component.html',
  styleUrl: './dataprotection.component.scss',
})
export class DataprotectionComponent {
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
