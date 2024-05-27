

import { Injectable, inject, NgZone } from '@angular/core';
import { Firestore,  getFirestore } from '@angular/fire/firestore';
import {  FirebaseError, initializeApp } from '@angular/fire/app';
import { getAuth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { User } from '../../models/user.class';
import { addDoc, collection, doc, setDoc, } from "firebase/firestore";
import { FirestoreService } from './firestore.service';

@Injectable({
  providedIn: 'root'
})
export class CreateAccountService {

  constructor(private router: Router, public ngZone: NgZone) { }

  firestoreService = inject(FirestoreService)
  firestore: Firestore = inject(Firestore)
  app = initializeApp(this.firestoreService.firebaseConfig);
  auth = getAuth(this.app);
  db = getFirestore(this.app)
  users = new User;


  /**
   * This function create user with firestore auth and use the userDatas from create-accout component
   * @param  email 
   * @param password 
   * @param userDatas 
   */
  async createUserWithEmailAndPassword(email: string, password: string, userDatas: any): Promise<string | void> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;
      let userid = user.uid
      
      this.setDocForDataBase(userid, userDatas);
      this.setDirectMessageDatas(userid, userDatas)
      this.ngZone.run(() => {
        this.router.navigate(['/select-avatar/' + userid]);
      });
    } catch (error) {
      if (error instanceof FirebaseError) {
        return 'Diese e-Mail Adresse ist bereits in Verwendung!';
      } else {
        return 'Ein unbekannter Fehler ist aufgetreten.';
      }
    }
  }


  /**
   * This function sets the datas for the database and connect it with the userid
   * @param userid 
   * @param userDatas 
   * @returns the JSON for the Databe
   */
async setDocForDataBase(userid:string, userDatas:any){
 return await setDoc(doc(this.db, "Users", userid), {
    name: userDatas.name,
    email: userDatas.eMail,
    avatar: userDatas.avatar,
    id: userid,
    isOnline: false,
    channels: [],
  });
}

/**
 * Sets the direct message datas to the storage
 */
async setDirectMessageDatas(userid:string, userDatas:any){
  await setDoc(doc(this.db, "Direct-Message", userid), {
    name: userDatas.name,
    email: userDatas.eMail,
    avatar: userDatas.avatar,
    id: userid,
    isOnline: false,
  });
}
}
