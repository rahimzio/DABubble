import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { FirestoreService } from '../services/firestore.service';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { User } from '../../models/user.class';
import { CommonModule } from '@angular/common';
import { StorageService } from '../services/storage.service';
import { LogInService } from '../services/log-in.service';

@Component({
  selector: 'app-select-avatar',
  standalone: true,
  imports: [MatCardModule, RouterModule, CommonModule],
  templateUrl: './select-avatar.component.html',
  styleUrl: './select-avatar.component.scss',
})
export class SelectAvatarComponent {
  uploadService = inject(StorageService)
  firestore = inject(FirestoreService);
  loginService = inject(LogInService)
  userId = '';
  actualUser: any;
  name!: string;
  avatar: any | string = 'assets/img/avatars/profile-blank.svg';
  selectSucceed: boolean = false;
  selectOwnPicture: boolean = false;


  constructor(private route: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {
    this.getIdFromURL();
    this.firestore
      .getUserDataById(this.userId)
      .then((data) => {
        this.actualUser = new User(data);

        if (this.actualUser) {
          this.name = this.actualUser.name;
          this.showAvatar();
        }
      })
      .catch((error) => {
        console.log('Fehler beim Laden des Benutzers: ', error);
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
   * save the avatar picture name in the varialbe avatar, which show it in the html form.
   */
  showAvatar() {
    if (this.actualUser.avatar) {
      this.avatar = this.actualUser.avatar;
    }
  }

  /**
   * change the avatar picture name by click
   * @param event html id
   */
  selectNewAvatar(event: MouseEvent) {
    const clickedElement = event.target as HTMLElement;
    const id = clickedElement.id;
    this.avatar = id;
    this.actualUser.avatar = id;
    this.selectOwnPicture = false;
  }

  /**
   * save selected Avatar to Firestore DB and redirect to the login
   */
  updateAvatar() {
    this.uploadService.uploadImg();
    this.selectSucceed = true;
    this.controllIfOwnPictureUsed()

    setTimeout(() => {
      this.loginService.introProhibet = true;
      this.router.navigate(['/']);
    }, 1500);

  }

  /**
   * This function controls, if the user use a own profilepicture or not. This is for upload a synonym for our avatar:'ownPictureDA' in DB.
   */
  controllIfOwnPictureUsed() {
    if (this.selectOwnPicture) {
      this.firestore.updateUserAvatar(this.userId, 'ownPictureDA');
    } else if (!this.selectOwnPicture) {
      this.firestore.updateUserAvatar(this.userId, this.avatar);
    }
  }

  /**
   * upload a own avatar picture to the db
   */
  uploadOwnAvatar(event: any) {
    this.uploadService.avatarSelected(event, this.userId);
    this.ownPicturePreView(event);
    this.selectOwnPicture = true;
  }

  /**
   * shows the chosen avatar pic as preview
   */
  ownPicturePreView(event: any) {
    const file = event.target.files[0]; // Zugriff auf das ausgewählte Bild
    if (file && file.type.startsWith('image')) {
      const reader = new FileReader(); // Erstelle ein FileReader-Objekt
      reader.onload = () => {
        this.avatar = reader.result;
      };
      reader.readAsDataURL(file); // Lese das Bild als Daten-URL
    }
  }
}
