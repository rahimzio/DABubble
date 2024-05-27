import { Injectable, inject, NgZone } from '@angular/core';
import { Firestore, getFirestore } from '@angular/fire/firestore';
import { initializeApp } from '@angular/fire/app';
import { getAuth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { User } from '../../models/user.class';
import { QuerySnapshot, addDoc, arrayUnion, collection, doc, getDoc, getDocs, onSnapshot, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { FirestoreService } from './firestore.service';
import { channel } from '../../models/channels.class';
import { Channel } from 'diagnostics_channel';
import { Observable } from 'rxjs';
import { ThreadService } from './thread.service';

@Injectable({
  providedIn: 'root',
})
export class channelDataclientService {
  constructor() { }

  firestoreService = inject(FirestoreService);
  firestore: Firestore = inject(Firestore);
  threadService = inject(ThreadService)
  app = initializeApp(this.firestoreService.firebaseConfig);
  auth = getAuth(this.app);
  db = getFirestore(this.app);
  channelDB = collection(this.firestore, 'Channels');
  channelIds = [];
  channels: channel[] = [];
  chatDatas: any[] = [];
  ownMessage = false;
  chatLength!: number;
  allChatMessages: any;
  private unsubscribe: (() => void) | undefined;


  /**
   * this function stores a new Channel in firestore
   * @param channel 
   */
  async storeNewChannel(channel: any) {
    const channelQuery = query(collection(this.db, 'Channels'), where('name', '==', channel.name));
    const channelSnapshot = await getDocs(channelQuery);

    if (channelSnapshot.empty) {
      try {
        const simplifiedUsersInChannel = this.convertUsersInChannel(
          channel.usersInChannel
        );

        const docRef = await addDoc(collection(this.db, 'Channels'), {
          id: channel.id,
          name: channel.name,
          description: channel.description,
          creator: channel.creator,
          usersInChannel: simplifiedUsersInChannel,
        });
        let channelId = docRef.id
        await this.updateChannelId(channelId)
        for (const user of simplifiedUsersInChannel) {
          await this.firestoreService.updateUsersChannels(user.id, channelId);
        }

        await this.createChatCollection(channelId, channel.creator)

      } catch (error) {
        console.log('Error writing document: ', error);
      }

    } else {
      console.log('Ein Kanal mit diesem Namen existiert bereits.');
    }
  }

 async channelNameAlreadyExist(name:string) {
    const channelQuery = query(collection(this.db, 'Channels'), where('name', '==', name));
    const channelSnapshot = await getDocs(channelQuery);

    if (!channelSnapshot.empty) {
      return true;
    }else {
      return false;
    }
  }


  /**
  * This function create a subcollection which is called 'chat' for the chat function
  */
  async createChatCollection(collectionId: string, creator: string) {
    const timeStamp = Date.now();
    const parentDocRef = doc(this.db, 'Channels', collectionId);
    const chatCollectionRef = collection(parentDocRef, 'chat');

    // Erstelle ein Dokument mit dem Timestamp als Dokument-ID
    const chatDocRef = doc(chatCollectionRef, timeStamp.toString());

    // Setze die Daten für das Dokument
    await setDoc(chatDocRef, {
      time: timeStamp,
      creator: creator,
      welcomeMessage: true,
    });
  }

  /**
   * This function sets the document with the timestamp as id. This doc has the information for the chats 
   */
  async sendChat(channelId: string, timeStamp: string, message: string, userId: string, imgUrl?: any) {
    const chatRef = doc(this.db, "Channels", channelId, 'chat', timeStamp);
    let userData = await this.firestoreService.getUserDataById(userId);
    if (userData) {
      let userName = userData['name'];
      let answers = 0;
      try {
        this.setMessageDocument(chatRef, message, userId, userName, timeStamp, answers, channelId, imgUrl,)
        this.threadService.createThreadSubCollection(channelId, timeStamp, message, userId, userName, imgUrl);
        this.updateAnswerCount(channelId, timeStamp)
      } catch (error) {
        console.error("Fehler beim Erstellen des Chat-Dokuments:", error);
      }
    } else {
      console.log('Benutzerdaten nicht gefunden');
    }
  }


  /**
   * This function update the answer count. The thread service function get the length of the current Thread and return it to this variable .
   */
  async updateAnswerCount(channelId: any, messageId: any) {
    let answersCount = await this.threadService.getCurrentThreadCollectionLength(channelId, messageId)
    const channelRef = doc(this.db, "Channels", channelId, 'chat', messageId);
    await updateDoc(channelRef, {
      answer: answersCount
    });
  }


  /**
   * Sets a new message document in the specified chat reference.
   */
  async setMessageDocument(chatRef: any, message: string, userId: string, userName: string, timeStamp: string, answers: number, channelId: string, imgUrl?: any,) {
    await setDoc(chatRef, {
      message: message,
      user: {
        id: userId,
        name: userName
      },
      time: timeStamp,
      emoji: [],
      answers: answers,
      fileUrl: imgUrl || '',
      channelId: channelId,
    });
  }


  async updateChannelId(channelId: any) {
    const channelRef = doc(this.db, "Channels", channelId);
    await updateDoc(channelRef, {
      id: channelId
    });
  }


  /**
   * Convert the usersInChannel object in a storeable object for Firestore
   * @param usersInChannel
   * @returns storeable object
   */
  convertUsersInChannel(usersInChannel: any[]): any[] {
    return usersInChannel.map((user) => ({
      name: user.name,
      eMail: user.eMail,
      avatar: user.avatar,
      id: user.id,
    }));
  }


  async getAllChannels() {
    const querySnapshot = await getDocs(this.channelDB);
    querySnapshot.forEach((doc) => {
      const channelData = doc.data();
      const newChannel = new channel(channelData);
      this.channels.push(newChannel);
    });
  }


  async getAllMessages() {
    const allChatMessages: { id: string; }[] = []; // Array zum Speichern aller Chat-Nachrichten

    // Schleife durch die angegebenen Kanal-IDs
    for (const channelId of this.channelIds) {
      const channelDocRef = doc(this.firestore, 'Channels', channelId);
      const messagesSnapshot = await getDocs(collection(channelDocRef, 'chat'));

      // Für jeden Kanal alle Nachrichten durchlaufen
      messagesSnapshot.forEach((messageDoc) => {
        const messageData = messageDoc.data();
        const newMessage = { id: messageDoc.id, ...messageData };
        allChatMessages.push(newMessage); // Neue Nachricht zum Array hinzufügen
      });
    }

    // Speichern Sie das Array der Chat-Nachrichten in der Instanzvariablen
    this.allChatMessages = allChatMessages;
  }


  /**
  * This function returns the Ids for the Channels, which show at the sideNav
  * @param id 
  */
  async getUserChannelId(id: any) {

    this.unsubscribe = onSnapshot(doc(this.db, "Users", id), (doc) => {
      const UserData = doc.data();

      if (UserData) {
        const channels = UserData['channels']
        this.channelIds = channels
        this.getChannels()
        return channels
      }
    });
  }

  stopSubscription() {
    if (this.unsubscribe) {
      this.unsubscribe(); // Beendet das Abonnement
    }
  }


  /**
   * This function starts, when clicked on leave channel button
   */
  async leaveChannel(userId: any, channelId: any) {
    await this.deleteLeavedUserInCannel(channelId, userId)
    this.deleteChannelIdAtUserDb(channelId, userId)

    //Funktion für user in channel auch hier noch einfügen

  }


  /**
   * This function filtered the id from the channels array and push the new array to the update function in firestore service 
   */
  async deleteChannelIdAtUserDb(channelId: any, userId: any) {
    let filteredChannel = this.channelIds.filter((id: any) => id !== channelId);
    this.channelIds = filteredChannel;
    this.channels = [...filteredChannel];
    this.channels = []
    await this.firestoreService.updateUserChannelsIfDeleteOne(userId, filteredChannel);
  }


  /**
   * This function updates the Users in channel and delete the leaved user from the Channeldb 
   */
  async deleteLeavedUserInCannel(channelId: any, userId: any) {
    const channelRef = doc(this.db, "Channels", channelId);
    const unsub = onSnapshot(channelRef, (channelDoc) => {
      if (channelDoc.exists()) {
        const channelData = channelDoc.data() as channel;
        let usersInChannel = channelData.usersInChannel;
        usersInChannel = usersInChannel.filter((user: any) => user.id !== userId);

        updateDoc(channelRef, { usersInChannel: usersInChannel });
        this.channels = []
      } else {
        console.log("Kanal mit ID", channelId, "nicht gefunden.");
      }
    });
  }


  /***
  * This function gets all chanels from the current user with the getUserChannelIds() ids.
  */
  async getChannels() {    
    this.channels = []
    for (const channelId of this.channelIds) {
      if (!this.channels.find(channel => channel.id === channelId)) {
        const unsub = onSnapshot(doc(this.db, "Channels", channelId), (channelDoc) => {
          if (channelDoc.exists()) {
            const channelData = channelDoc.data() as channel;;
            this.controlExistingChannels(channelData)
          } else {
            console.log("Kanal mit ID", channelId, "nicht gefunden.");
          }
        });
      }
    }
    await this.getAllMessages()
  }


  /**
   * This feature uses a filtering feature to prevent multiple channels from being created at the same time with the same ID. 
   * This means that a channel can be edited without duplicate channels
   */
  controlExistingChannels(channelData: any) {
    const existingChannelIndex = this.channels.findIndex(channel => channel.id === channelData['id']);
    if (existingChannelIndex !== -1) {
      // Wenn der Kanal bereits im Array vorhanden ist, aktualisiere seine Daten
      this.channels[existingChannelIndex] = channelData;
    } else {
      const newChannel = new channel(channelData); // Neues channel-Objekt erstellen
      this.channels.push(newChannel); // Das neue channel-Objekt zum Array hinzufügen
    }
  }


  /**
   * This function waits for the channeldatas which is get by id and returns the datas. Used at the group-chat-component.
   */
  async getCurrentChannel(id: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const docRef = doc(this.firestore, 'Channels', id);

      const unsub = onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          resolve(data);
        } else {
          console.log('Der Kanal mit der ID', id, 'existiert nicht.');
          resolve(null);
        }
      });
    });
  }


  /**
   * This function download the datas from the subcollection with liveUpdate for the chat
   */
  async getCurrentChats(id: string, currentUserId: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const q = query(collection(this.db, "Channels", id, 'chat'));
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
   * Update the channel name in DB
   */
  async updateChannelName(id: string, name: string) {
    const channelRef = doc(this.db, "Channels", id);
    await updateDoc(channelRef, {
      name: name,
    });
    this.channels = []
    await this.getChannels()
  }

  /**
   * Update the channel description in DB
   */
  async updateChannelDescription(id: string, description: string) {
    const channelRef = doc(this.db, "Channels", id);
    await updateDoc(channelRef, {
      description: description,
    });
    this.channels = []
    await this.getChannels()
  }


  /**
   * This function add the userarray to the channel
   */
  async addUserToChannel(id: any, users: any[]) {
    const channelRef = doc(this.db, "Channels", id);

    for (const user of users) {
      await updateDoc(channelRef, {
        usersInChannel: arrayUnion({
          name: user.name,
          id: user.id,
          eMail: user.eMail,
          avatar: user.avatar
        })
      });
    }
  }

  /**
   * This function returns the chat, when open the thread
   */
  async getCurrentThreadCollectionLength(messageId: any): Promise<number> {
    return new Promise((resolve, reject) => {
      const q = query(collection(this.db, "Channels", this.threadService.currentGroupId, 'chat', messageId, 'thread'));
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
   * This function retrieves the current message to edit it
   */
  async getMessageForEdit(channelId: any, messageId: any) {
    const docRef = doc(this.db, "Channels", channelId, 'chat', messageId);
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
   * This function retrieves the current message to edit it
   */
  async getImgForDelete(channelId: any, messageId: any) {
    const docRef = doc(this.db, "Channels", channelId, 'chat', messageId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      let file = docSnap.data()['fileUrl']
      return file

    } else {
      // docSnap.data() will be undefined in this case
      console.log("No such document!");
    }
  }


  /**
   * This function saves the edited message
   */
  async editMessage(channelId: any, messageId: any, message: any, fileUrl?: any) {
    const docRef = doc(this.db, "Channels", channelId, 'chat', messageId);
    await updateDoc(docRef, {
      message: message,
      fileUrl: fileUrl || ''
    });
    await this.threadService.updateEditMessage(channelId, messageId, message, fileUrl)
  }


  async addEmojiToMessage(channelId: any, messageId: any, emoji: any, userId: any) {
    let userData = await this.firestoreService.getUserDataById(userId);
    if (userData) {
      let userName = userData['name'];
      const docRef = doc(this.db, "Channels", channelId, 'chat', messageId);

      // Dokument abrufen
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
