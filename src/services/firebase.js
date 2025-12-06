import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuración fija para apps móviles (NO usar import.meta.env)
const firebaseConfig = {
  apiKey: "AIzaSyBrDyjHHE8Fut5xJWnxexj6rtax-Jsvdqs",
  authDomain: "pizza-brava-dev.firebaseapp.com",
  projectId: "pizza-brava-dev",
  storageBucket: "pizza-brava-dev.firebasestorage.app",
  messagingSenderId: "118092051274",
  appId: "1:118092051274:web:17c2c7bc778079ca3a87b3",
  measurementId: "G-2RYZ83SFSY"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
