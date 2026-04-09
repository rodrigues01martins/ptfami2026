import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBPDb_B8dVoyqE76cYeMW5xFuKBFhjHDoE",
  authDomain: "://firebaseapp.com",
  projectId: "fami2026",
  storageBucket: "fami2026.firebasestorage.app",
  messagingSenderId: "708564516153",
  appId: "1:708564516153:web:28e1c6df35bd660330bce8",
  measurementId: "G-6GEKDYVLJP"
};
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

export const handleFirestoreError = (error: any) => {
  console.error("Erro no Firestore:", error);
  return "Ocorreu um erro ao acessar os dados. Verifique sua conexão.";
};
