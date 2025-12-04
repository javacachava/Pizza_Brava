// src/services/firebase.js
import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// 1. Cargar configuración
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// 2. VALIDACIÓN DE SEGURIDAD CRÍTICA
const requiredKeys = ["apiKey", "authDomain", "projectId", "appId"];
const missingKeys = requiredKeys.filter(key => !firebaseConfig[key]);

if (missingKeys.length > 0) {
  // Esto lanzará el error a la pantalla gracias al ErrorBoundary
  throw new Error(
    `FALTAN CLAVES DE FIREBASE: ${missingKeys.join(", ")}. \n\n` +
    `Asegúrate de haber creado el archivo .env con las variables VITE_FIREBASE_...`
  );
}

// 3. Inicializar Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  throw new Error(`Error al inicializar Firebase: ${error.message}`);
}

// 4. Habilitar persistencia (funciona sin internet)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const auth = getAuth(app);