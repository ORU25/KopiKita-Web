import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Config web Firebase memang publik; keamanan ada di firestore.rules.
// Sumber: blok `web` di ../kopikita/lib/firebase_options.dart
const app = initializeApp({
  apiKey: 'AIzaSyC-Xs4ye_qvHDObIWpjK5KOMg2ULCdQqiY',
  appId: '1:106186318463:web:eb4ced95a1a5a4ac9f554a',
  messagingSenderId: '106186318463',
  projectId: 'kopikita-dev',
  authDomain: 'kopikita-dev.firebaseapp.com',
  storageBucket: 'kopikita-dev.firebasestorage.app',
});

export const auth = getAuth(app);
export const db = getFirestore(app);
