import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDICljsUW0fO0UJFKeVCsnzW83EbEwlICM",
  authDomain: "fami2026.firebaseapp.com",
  projectId: "fami2026",
  storageBucket: "fami2026.firebasestorage.app",
  messagingSenderId: "708564516153",
  appId: "1:708564516153:web:b600235aeff1869f30bce8",
  measurementId: "G-TCXXDCEQML"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
