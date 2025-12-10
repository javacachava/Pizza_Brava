import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";
import { getAnalytics } from "firebase/analytics";

// Configuración oficial de Firebase (credenciales reales)
const firebaseConfig = {
  apiKey: "AIzaSyBrDyjHHE8Fut5xJWnxexj6rtax-Jsvdqs",
  authDomain: "pizza-brava-dev.firebaseapp.com",
  projectId: "pizza-brava-dev",
  storageBucket: "pizza-brava-dev.firebasestorage.app",
  messagingSenderId: "118092051274",
  appId: "1:118092051274:web:17c2c7bc778079ca3a87b3",
  measurementId: "G-2RYZ83SFSY"
};

// Inicializar Firebase solo una vez (manejo de Vite + HMR)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Exportar servicios
export const db = getFirestore(app);
export const auth = getAuth(app);
export const functions = getFunctions(app);

// Analytics (solo en producción y navegador, no localhost)
if (typeof window !== "undefined" && location.hostname !== "localhost") {
  getAnalytics(app);
}

// NOTA IMPORTANTE:
// Se han eliminado las líneas de "connectAuthEmulator" y "connectFirestoreEmulator"
// para cumplir con la REGLA 2: El proyecto debe conectarse a la base de datos REAL,
// no a emuladores locales vacíos.

export default app;