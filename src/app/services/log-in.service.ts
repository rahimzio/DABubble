
import { Injectable, inject, NgZone } from '@angular/core';
import { Firestore, getDoc, getFirestore, } from '@angular/fire/firestore';
import { initializeApp } from '@angular/fire/app';
import { getAuth, signInWithEmailAndPassword, signInWithPopup, signOut } from '@angular/fire/auth';
import { GoogleAuthProvider } from '@angular/fire/auth'
import { Router } from '@angular/router';
import { User } from '../../models/user.class';
import { addDoc, collection, doc, setDoc } from "firebase/firestore";
import { FirestoreService } from './firestore.service';
import { channelDataclientService } from './channelsDataclient.service';


@Injectable({
  providedIn: 'root'
})
export class LogInService {
  constructor(private router: Router, public ngZone: NgZone) { }

  firestoreService = inject(FirestoreService)
  firestore: Firestore = inject(Firestore)
  channelService = inject(channelDataclientService)
  app = initializeApp(this.firestoreService.firebaseConfig);
  auth = getAuth(this.app);
  db = getFirestore(this.app)
  users = new User;
  introProhibet = false;
  logInInvalid = false;

  //-- ----------------------------------- ---Anmelden--------------------------------------------
  // https://www.linkedin.com/pulse/angular-14-firebase-authentication-tutorial-attia-imed/ daraus kommt die anmlede funktion


  /**
   * This function log in the user with firebase Authentication
   */
  async Login(email: string, password: string) {
    try {
      const result = await signInWithEmailAndPassword(this.auth, email, password);
      const user = result.user;
      let userid = user.uid;
      this.routeToDashboard(userid);

    } catch (error) {
      //window.alert('error, anmelden geht nicht');
      this.logInInvalid = true;
    }
  }


  /**
   * This function is called at the log-in.component.html so sign up with google
   */
  async loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(this.auth, provider);
      const user = userCredential.user;
      const userId = user.uid;
      const userDoc = await getDoc(doc(this.db, "Users", userId));
      const userData = this.setUserData(user, userId);



      this.checkUserStatus(userDoc, userId, userData, user);
    } catch (error) {
      console.error('Fehler beim Anmelden mit Google:', error);
    }
  }


  /**
   *This function checks whether the user already exists
   * @param userDoc 
   * @param userId 
   * @param userData 
   */
  checkUserStatus(userDoc: any, userId: any, userData: any, user: any) {
    if (userDoc.exists()) {
      this.routeToDashboard(userId)
    } else {
      this.routeToAvatarPage(userId, userData)
      this.setDirectMessageDatas(user, userId);
    }
  }


  /**
   * This function set Datas for the database for users with google Login
   * @param user Datas from the user with firebase authentication
   * @returns JSON
   */
  setUserData(user: any, userId: any) {
    return {
      name: user.displayName,
      email: user.email,
      avatar: '',
      id: userId,
      isOnline: false,
      channels: [],
    };
  }


  /**
   * Redirects to the dashboard with user ID as the identifier if the user already exists
   * @param logInInvalid is a boolean for the login component.html to show a warning if the login details are incorrect
   */
  routeToDashboard(userId: any) {
    this.ngZone.run(() => {
      this.router.navigate(['/dashboard/' + userId]);
      this.logInInvalid = false;
    });
  }


  /**
   * Redirects to the avatar collection page with user ID as the identifier if the user already does not exist
   */
  async routeToAvatarPage(userId: any, userData: any) {
    await setDoc(doc(this.db, "Users", userId), userData); // Benutzerdaten erstellen
    this.ngZone.run(() => {
      this.router.navigate(['/select-avatar/' + userId]);
    });
  }

  /**
   * Logs the user out
   */
  async logOut() {
    this.channelService.stopSubscription()
    const auth = getAuth();
    signOut(auth).then(() => {
      // Sign-out successful.
    }).catch((error) => {
      // An error happened.
    });
  }

  /**
   * Sets the direct message chat details if the user is registered
   */
  async setDirectMessageDatas(user: any, userId: any) {
    await setDoc(doc(this.db, "Direct-Message", userId), {
      name: user.displayName,
      email: user.email,
      avatar: '',
      id: userId,
      isOnline: false,
    });
  }
}
