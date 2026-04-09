import {initializeApp} from 'firebase/app';
import {getAuth} from 'firebase/auth';
import {getFirestore} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBPDb_B8dVoYqE76cYeMW5xFuKBFhjHDoE",
  authDomain: "fami2026.firebaseapp.com",
  projectId: "fami2026",
  storageBucket: "fami2026.firebasestorage.app",
  messagingSenderId: "708564516153",
  appId: "1:708564516153:web:28e1c6df35bd660330bce8"
};

const app=initializeApp(firebaseConfig);
export const auth=getAuth(app);
export const db=getFirestore(app);
