import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      
      if (currentUser) {
        try {
          // Intentamos leer el rol del usuario
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setRole(userData.role);
            setUser(currentUser);
            setError(null);
          } else {
            // Usuario existe en Auth pero no en Firestore (Error de datos)
            console.error("Usuario sin documento en colección 'users'");
            setError("Usuario no registrado en base de datos.");
            await signOut(auth); // Desloguear para evitar limbo
            setUser(null);
          }
        } catch (err) {
          // Error de Permisos o Red
          console.error("Error verificando rol:", err);
          setError("Error de conexión o permisos. Intente de nuevo.");
          await signOut(auth); // IMPORTANTE: Desloguear para permitir reintento
          setUser(null);
        }
      } else {
        // No hay usuario
        setUser(null);
        setRole(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // No hacemos nada más aquí, el onAuthStateChanged se encarga del resto
    } catch (err) {
      console.error("Login error:", err);
      // Mensajes de error amigables
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError("Correo o contraseña incorrectos.");
      } else if (err.code === 'auth/too-many-requests') {
        setError("Demasiados intentos fallidos. Espere unos minutos.");
      } else {
        setError("Error al iniciar sesión.");
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setRole(null);
      setUser(null);
    } catch (e) {
      console.error("Error al salir:", e);
    }
  };

  return { user, role, loading, error, login, logout };
}