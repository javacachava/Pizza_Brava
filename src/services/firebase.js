import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBrDyjHHE8Fut5xJWnxexj6rtax-Jsvdqs",
  authDomain: "pizza-brava-dev.firebaseapp.com",
  projectId: "pizza-brava-dev",
  storageBucket: "pizza-brava-dev.firebasestorage.app",
  messagingSenderId: "118092051274",
  appId: "1:118092051274:web:17c2c7bc778079ca3a87b3",
  measurementId: "G-2RYZ83SFSY"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// --- HABILITAR MODO OFFLINE ---
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
      console.warn("Persistencia fallida: Múltiples pestañas abiertas.");
  } else if (err.code == 'unimplemented') {
      console.warn("El navegador no soporta persistencia offline.");
  }
});