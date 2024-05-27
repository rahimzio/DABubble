import { Injectable, inject } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { Firestore, getFirestore } from '@angular/fire/firestore';
import { initializeApp } from '@angular/fire/app';
import { QuerySnapshot, addDoc, arrayUnion, collection, doc, getDoc, getDocs, onSnapshot, query, setDoc, updateDoc } from 'firebase/firestore';


@Injectable({
  providedIn: 'root'
})
export class DirectChatService {


  firestoreService = inject(FirestoreService);
  firestore: Firestore = inject(Firestore);
  app = initializeApp(this.firestoreService.firebaseConfig);
  db = getFirestore(this.app);
  channelDB = collection(this.firestore, 'Channels');
  chatDatas: any[] = [];
  ownMessage = false;


  constructor() { }

  /**
   * start functions to send a message for direct chats
   */
  async sendChat(currentUserId: any, chatPartnerId: any, timeStamp: any, message: any, imgUrl?: any,) {
    await this.createDirectMessageCollection(currentUserId, chatPartnerId, timeStamp);
    await this.saveMessageAtCurrentUserDB(currentUserId, chatPartnerId, timeStamp, message, imgUrl)
    await this.saveMessateAtChatPartnerDB(currentUserId, chatPartnerId, timeStamp, message, imgUrl)
  }

  /**
   *Control if the direct message collection exist, and if not create a message collection
   */
  async createDirectMessageCollection(currentUserId: any, chatPartnerId: any, timeStamp: any) {
    const userDocRef = doc(this.db, 'Direct-Message', currentUserId);
    const chatPartnerSubcollectionRef = collection(userDocRef, chatPartnerId);
    const chatDocRef = doc(chatPartnerSubcollectionRef, timeStamp.toString())
    try {
      // Überprüfen, ob die Subkollektion für den Chat-Partner bereits existiert
      const collectionRef = await getDocs(chatPartnerSubcollectionRef);
      if (!collectionRef.empty) {
      } else {
        // Subkollektion für den Chat-Partner erstellen
        await setDoc(chatDocRef, {});
      }
    } catch (error) {
      console.error("Fehler beim Überprüfen der Subkollektion:", error);
    }
  }

/**
 * Save the message at the current user collection
 */
  async saveMessageAtCurrentUserDB(currentUserId: any, chatPartnerId: any, timeStamp: any, message: any, fileUrl?: any) {
    const userDocRef = doc(this.db, 'Direct-Message', currentUserId);
    const chatPartnerSubcollectionRef = collection(userDocRef, chatPartnerId);
    const chatDocRef = doc(chatPartnerSubcollectionRef, timeStamp.toString())
    await this.setMessageDocument(currentUserId, chatDocRef, message, timeStamp, fileUrl);
  }

/**
 * Save the message at the chat partner collection
 */
  async saveMessateAtChatPartnerDB(currentUserId: any, chatPartnerId: any, timeStamp: any, message: any, fileUrl?: any) {
    const userDocRef = doc(this.db, 'Direct-Message', chatPartnerId);
    const chatPartnerSubcollectionRef = collection(userDocRef, currentUserId);
    const chatDocRef = doc(chatPartnerSubcollectionRef, timeStamp.toString())
    await this.setMessageDocument(currentUserId, chatDocRef, message, timeStamp, fileUrl);
  }

/**
 * Set the message Objet for the db
 */
  async setMessageDocument(currentUserId: any, chatDocRef: any, message: any, timeStamp: any, fileUrl?: any) {
    let userData = await this.firestoreService.getUserDataById(currentUserId);
    if (userData) {
      let userName = userData['name'];

      await setDoc(chatDocRef, {
        message: message,
        user: {
          id: currentUserId,
          name: userName
        },
        time: timeStamp,
        emoji: [],
        fileUrl: fileUrl || ''
      });
    }
  }



  /**
   * This function download the datas from the subcollection with liveUpdate for the chat
   */
  async getCurrentChats(currentUserId: string, chatPartnerId: any): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const q = query(collection(this.db, "Direct-Message", currentUserId, chatPartnerId));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const chat: any[] = [];
        this.chatDatas = chat;
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
   * This function saves the edited message
   */
  async editMessage(currentUserId: any, chatPartnerId: any, message: any, messageId: any, fileUrl?: any) {
    const userDocRef = doc(this.db, 'Direct-Message', currentUserId);
    const chatPartnerSubcollectionRef = collection(userDocRef, chatPartnerId);
    const chatDocRef = doc(chatPartnerSubcollectionRef, messageId.toString())
    await updateDoc(chatDocRef, {
      message: message,
      fileUrl: fileUrl || ''
    });
    await this.editMessageAtChatPartner(currentUserId, chatPartnerId, message, messageId, fileUrl)
  }

/**
 * Update the edited message, if a user edit a message
 */
  async editMessageAtChatPartner(currentUserId: any, chatPartnerId: any, message: any, messageId: any, fileUrl?: any) {
    const userDocRef = doc(this.db, 'Direct-Message', chatPartnerId);
    const chatPartnerSubcollectionRef = collection(userDocRef, currentUserId);
    const chatDocRef = doc(chatPartnerSubcollectionRef, messageId.toString())
    await updateDoc(chatDocRef, {
      message: message,
      fileUrl: fileUrl || ''
    });
  }


  /**
   * This function retrieves the current message to edit it
   */
  async getMessageForEdit(currentUserId: any, currentChatPartnerId: any, messageId: any) {
    const userDocRef = doc(this.db, 'Direct-Message', currentUserId);
    const chatPartnerSubcollectionRef = collection(userDocRef, currentChatPartnerId);
    const chatDocRef = doc(chatPartnerSubcollectionRef, messageId.toString())
    const docSnap = await getDoc(chatDocRef);

    if (docSnap.exists()) {
      let message = docSnap.data()['message']
      return message

    } else {
      // docSnap.data() will be undefined in this case
      console.log("No such document!");
    }
  }

/**
 * if an image exist, return it for the option to delete it at the edit message field
 */
  async getImgForDelete(currentUserId: any, currentChatPartnerId: any, messageId: any) {
    const userDocRef = doc(this.db, 'Direct-Message', currentUserId);
    const chatPartnerSubcollectionRef = collection(userDocRef, currentChatPartnerId);
    const chatDocRef = doc(chatPartnerSubcollectionRef, messageId.toString())
    const docSnap = await getDoc(chatDocRef);

    if (docSnap.exists()) {
      let img = docSnap.data()['fileUrl']
      return img

    } else {
      // docSnap.data() will be undefined in this case
      console.log("No such document!");
    }
  }

/**
 * Adds the emoji to a reaction message and controls whether the user has already reacted and whether the emoji already exists in that message
 */
  async addEmojiToMessage(chatPartnerId: any, currentUserId: any, messageId: any, emoji: any) {
    let userData = await this.firestoreService.getUserDataById(currentUserId);
    if (userData) {
      let userName = userData['name'];
      // Dokumentreferenz für die erste Unter-Sammlung
      const userDocRef1 = doc(this.db, 'Direct-Message', currentUserId);
      const chatPartnerSubcollectionRef1 = collection(userDocRef1, chatPartnerId);
      const chatDocRef1 = doc(chatPartnerSubcollectionRef1, messageId.toString());

      // Dokumentreferenz für die zweite Unter-Sammlung
      const userDocRef2 = doc(this.db, 'Direct-Message', chatPartnerId);
      const chatPartnerSubcollectionRef2 = collection(userDocRef2, currentUserId);
      const chatDocRef2 = doc(chatPartnerSubcollectionRef2, messageId.toString());

      // Überprüfen, ob das Dokument in der ersten Unter-Sammlung existiert
      const docSnap1 = await getDoc(chatDocRef1);
      if (docSnap1.exists()) {
        const data = docSnap1.data();
        // Überprüfen, ob 'emoji' ein Array ist und das erwartete Format hat
        if (Array.isArray(data['emoji'])) {
          // Wenn das Array leer ist, initialisiere es mit einem leeren Array
          data['emoji'] = data['emoji'] || [];

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
            // Aktualisierte Emoji-Daten in der ersten Unter-Sammlung speichern
            await updateDoc(chatDocRef1, { emoji: data['emoji'] });
          } else {
            // Emoji ist neu, hinzufügen
            await updateDoc(chatDocRef1, {
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

      // Überprüfen, ob das Dokument in der zweiten Unter-Sammlung existiert
      const docSnap2 = await getDoc(chatDocRef2);
      if (docSnap2.exists()) {
        const data = docSnap2.data();
        // Überprüfen, ob 'emoji' ein Array ist und das erwartete Format hat
        if (Array.isArray(data['emoji'])) {
          // Wenn das Array leer ist, initialisiere es mit einem leeren Array
          data['emoji'] = data['emoji'] || [];

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
            // Aktualisierte Emoji-Daten in der zweiten Unter-Sammlung speichern
            await updateDoc(chatDocRef2, { emoji: data['emoji'] });
          } else {
            // Emoji ist neu, hinzufügen
            await updateDoc(chatDocRef2, {
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
