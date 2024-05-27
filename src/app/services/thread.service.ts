import { Injectable, inject } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { arrayUnion, collection, doc, getDoc, onSnapshot, query, setDoc, updateDoc } from 'firebase/firestore';
import { Firestore, getFirestore } from '@angular/fire/firestore';
import { initializeApp } from '@angular/fire/app';
import { getAuth } from 'firebase/auth';
import { Observable, BehaviorSubject } from 'rxjs';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class ThreadService {
  firestoreService = inject(FirestoreService);
  firestore: Firestore = inject(Firestore);
  downloadService = inject(StorageService);
  app = initializeApp(this.firestoreService.firebaseConfig);
  auth = getAuth(this.app);
  db = getFirestore(this.app);
  channelDB = collection(this.firestore, 'Channels');
  currentChatId: any;
  currentGroupId: any;
  chatDatas: any[] = [];
  ownMessage = false;
  chatLength:number | undefined;
  closeTab = true;

  private currentChannelDataSubject = new BehaviorSubject<any>(null);
  currentChannelData$ = this.currentChannelDataSubject.asObservable();


  constructor() { }


  async getCurrentThread() {
    //  await this.createThreadSubCollection()
  }




  /**
   * This function creates the subcollection 'thread' for each sended message. 
   * The variables comes from channelsData Client where the message was sendet and the informations created.
   */
  async createThreadSubCollection(channelId: any, messageId: any, message: string, userId: any, userName: any, imgUrl?:any) {
    const parentDocRef = doc(this.db, 'Channels', channelId, 'chat', messageId);
    const threadCollectionRef = collection(parentDocRef, 'thread');
    try {
      // Verwende die chatId als Dokumenten-ID und füge ein leeres Dokument zur Subcollection hinzu
      await setDoc(doc(threadCollectionRef, messageId), {
        message: message,
        time: messageId,
        emoji: [],
        user: {
          id: userId,
          name: userName
        },
        fileUrl: imgUrl || '',
      });
    } catch (error) {
      console.error('Fehler beim Erstellen des Dokuments in Subcollection "thread":', error);
    }
  }


  /**
   * This function returns the chat, when open the thread
   */
  getCurrentThreadCollection(channelId: any, messageId: any, currentUserId: any) {
    return new Promise((resolve, reject) => {
      const q = query(collection(this.db, "Channels", channelId, 'chat', messageId, 'thread'));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const chat: any[] = [];
        this.setCurrentChatDatas(querySnapshot, chat, currentUserId)
        resolve(chat);
      }, (error) => {
        console.error('Fehler beim Laden der Daten:', error);
        reject(error);
      });
    });
  }


  /**
   * This function set the from snapshot to the variables
   */
  setCurrentChatDatas(querySnapshot: any, chat: any, currentUserId: any) {
    querySnapshot.forEach((doc: any) => {
      const message = doc.data();
      chat.push(message);
      this.chatDatas = chat;
      this.controllIfOwnMessageSend(message, currentUserId)
    });
  }


  /**
   * This feature controls whether the message displayed in the chat is sent by the logged in user or by another user. (to present your own messages in the correct style)
   */
  controllIfOwnMessageSend(message: any, currentUserId: any) {
    if (message.user && message.user.id) {
      const userId = message.user.id;
      if (currentUserId !== userId) {
        this.ownMessage = false;
        message.ownMessage = false;
      } else if (currentUserId === userId) {
        this.ownMessage = true
        message.ownMessage = true
      }
    }
  }


  /**
   * This function retrieves the current message to edit it
   */
  async getMessageForEdit(messageId: any) {
    const docRef = doc(this.db, "Channels", this.currentGroupId, 'chat', this.currentChatId, 'thread', messageId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      let message = docSnap.data()['message']
      return message

    } else {
      // docSnap.data() will be undefined in this case
      console.log("No such document!");
    }
  }


    /**
   * This function saves the edited message
   */
 async editMessage( messageId:any, message:any, fileUrl?: any){
  const docRef = doc(this.db, "Channels", this.currentGroupId, 'chat', this.currentChatId, 'thread', messageId);
  await updateDoc(docRef, {
    message: message,
    fileUrl: fileUrl || ''
  });
}


  /**
   * This function saved the message in the thread subcollection
   */
  async sendMessageToThread(timeStamp: string, message: string, userId: string,  imgUrl?: any) {
    const chatRef = doc(this.db, "Channels", this.currentGroupId, 'chat', this.currentChatId, 'thread', timeStamp);
    let userData = await this.firestoreService.getUserDataById(userId);
    if (userData) {
      let userName = userData['name'];
      let avatar = userData['avatar'];
      try {
       await this.setMessageDocument(chatRef, message, userId, userName, timeStamp, avatar,  imgUrl)
       await this.updateAnswerCount(this.currentGroupId, this.currentChatId, timeStamp)
      } catch (error) {
        console.error("Fehler beim Erstellen des Chat-Dokuments:", error);
      }
    } else {
      console.log('Benutzerdaten nicht gefunden');
    }
  }


  async getImgForDelete(messageId:any){
    const chatRef = doc(this.db, "Channels", this.currentGroupId, 'chat', this.currentChatId, 'thread', messageId);
    const docSnap = await getDoc(chatRef);

    if (docSnap.exists()) {
      let file = docSnap.data()['fileUrl']
      return file

    } else {
      // docSnap.data() will be undefined in this case
      console.log("No such document!");
    }
  }


   /**
   * This function update the answer count in the chat db. The getCurrentLength... function get the length of the current Thread and return it to this variable .
   */
  async updateAnswerCount(channelId:any, messageId:any, timeStamp:any){
    let answersCount =  await this.getCurrentThreadCollectionLength(channelId, messageId)
    const channelRef = doc(this.db, "Channels", channelId, 'chat', messageId);
    await updateDoc(channelRef, {
      answer: answersCount,
      lastMessage: timeStamp,

    });
  }


  /**
   * This function download the avatar link if an user use a own avatar and sets the avatar to the user object 
   */
  async loadProfilePictures(user: any) {
    if (user.avatar === 'ownPictureDA') {
      const profilePictureURL = `gs://dabubble-51e17.appspot.com/${user.id}/ownPictureDA`;
      try {
        const downloadedImageUrl = await this.downloadService.downloadImage(profilePictureURL);
        // Weisen Sie die heruntergeladenen Bild-URL direkt dem Benutzerobjekt zu
        user.avatar = downloadedImageUrl;
      } catch (error) {
        console.error('Error downloading user profile picture:', error);
      }
    }
  }


  /**
   * Sets a new message document in the specified chat reference.
   */
  async setMessageDocument(chatRef: any, message: string, userId: string, userName: string, timeStamp: string, avatar: any, imgUrl?:any) {
    await setDoc(chatRef, {
      message: message,
      user: {
        id: userId,
        name: userName,
        avatar: avatar
      },
      time: timeStamp,
      emoji: [],
      fileUrl: imgUrl || '',
    });
  }


  setCurrentChannelData(currentChannelData: any) {
    this.currentChannelDataSubject.next(currentChannelData);
  }


  /**
   * This function returns the chat, when open the thread
   */
  async getCurrentThreadCollectionLength(channelId:any, messageId: any): Promise<number> {
    return new Promise((resolve, reject) => {
      const q = query(collection(this.db, "Channels", channelId, 'chat', messageId, 'thread'));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const chatLength = querySnapshot.size; // Anzahl der Dokumente im Thread
        this.chatLength = chatLength
        resolve(chatLength);
      }, (error) => {
        console.error('Fehler beim Laden der Daten:', error);
        reject(error);
      });
    });
  }


  /**
   * This function updatet the edit message in the thread too
   */
 async updateEditMessage(channelId:any ,messageId:any, message:any, fileUrl?:any){
    const docRef = doc(this.db, "Channels", channelId, 'chat', messageId, 'thread', messageId);
    await updateDoc(docRef, {
      message: message,
      fileUrl: fileUrl || '',
    });
  }


 async addEmojiToMessage(timeStamp:any, emoji:any, userId:any){
    let userData = await this.firestoreService.getUserDataById(userId);
    if (userData) {
      let userName = userData['name'];
      const docRef = doc(this.db, "Channels", this.currentGroupId, 'chat', this.currentChatId, 'thread', timeStamp);
      

      const docSnap = await getDoc(docRef);
      
      // Überprüfen, ob das Dokument existiert
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Überprüfen, ob 'emoji' ein Array ist und das erwartete Format hat
        if (Array.isArray(data['emoji'])) {
          // Überprüfen, ob der Benutzer bereits auf das Emoji reagiert hat
          const existingEmojiIndex = data['emoji'].findIndex((e: any) => e.emoji === emoji);
          
          if (existingEmojiIndex !== -1) {
            // Emoji existiert bereits
            const existingEmoji = data['emoji'][existingEmojiIndex];
            const userIndex = existingEmoji.userNames.indexOf(userName);
            
            if (userIndex !== -1) {
              // Benutzer hat bereits auf das Emoji reagiert, den Count verringern und Benutzername entfernen
              existingEmoji.count--;
              existingEmoji.userNames.splice(userIndex, 1);
            } else {
              // Benutzer hat noch nicht auf das Emoji reagiert, den Count erhöhen und Benutzername hinzufügen
              existingEmoji.count++;
              existingEmoji.userNames.push(userName);
            }
            
            // Aktualisierte Emoji-Daten in der Datenbank speichern
            await updateDoc(docRef, { emoji: data['emoji'] });
          } else {
            // Emoji ist neu, hinzufügen
            await updateDoc(docRef, {
              emoji: arrayUnion({
                emoji: emoji,
                userNames: [userName],
                count: 1
              })
            });
          }
        } else {
          // 'emoji' ist nicht im erwarteten Format
          console.error("Emoji-Daten sind nicht im erwarteten Format.");
        }
      }
    }
   
    
    
  }
}
