import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // 'admin' | 'cocina' | 'recepcion'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        try {
          // Buscar el rol en la colección 'users' de Firestore
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setRole(userDoc.data().role);
            setUser(currentUser);
          } else {
            // Si no tiene rol definido, asignar uno por defecto o error
            setError("Usuario sin rol asignado.");
            await signOut(auth);
          }
        } catch (err) {
          console.error("Error verificando rol:", err);
          setError("Error de conexión.");
        }
      } else {
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
    } catch (err) {
      console.error(err);
      setError("Credenciales inválidas.");
    }
  };

  const logout = async () => {
    await signOut(auth);
    setRole(null);
    setUser(null);
  };

  return { user, role, loading, error, login, logout };
}