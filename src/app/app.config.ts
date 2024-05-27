import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getDatabase, provideDatabase } from '@angular/fire/database';
import { provideHttpClient,  withFetch  } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes),
  provideHttpClient(withFetch()),
  provideClientHydration(),
  provideAnimationsAsync(),
  importProvidersFrom(provideFirebaseApp(() => initializeApp({ "projectId": "dabubble-51e17", "appId": "1:185514198211:web:53ebf5cdc18b5567090e76", "databaseURL": "https://dabubble-51e17-default-rtdb.europe-west1.firebasedatabase.app", "storageBucket": "dabubble-51e17.appspot.com", "apiKey": "AIzaSyDiGmIlzMq2kQir6-xnHFX9iOXxH1Wcj8o", "authDomain": "dabubble-51e17.firebaseapp.com", "messagingSenderId": "185514198211", "measurementId": "G-4HJ8MGXTCJ" }))),
  importProvidersFrom(provideAuth(() => getAuth())),
  importProvidersFrom(provideFirestore(() => getFirestore())),
  importProvidersFrom(provideDatabase(() => getDatabase()))],

};
