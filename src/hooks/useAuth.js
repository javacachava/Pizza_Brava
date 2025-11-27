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
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // --- VALIDACIÓN DE ESTADO DE USUARIO ---
            if (userData.active === false) {
                console.warn("Usuario desactivado intentó ingresar.");
                setError("Tu cuenta ha sido desactivada. Contacta al administrador.");
                
                // Forzamos el logout si la cuenta está desactivada en Firestore
                await signOut(auth);
                setUser(null);
                setRole(null);
            } else {
                // ✅ MEJORA: Forzar refresco del token
                // Esto actualiza el token JWT local para asegurar que request.auth.token 
                // tenga los claims más recientes (ej. roles, status) para las reglas de seguridad.
                await currentUser.getIdToken(true);

                setRole(userData.role);
                setUser(currentUser);
                setError(null);
            }

          } else {
            console.error("Usuario sin documento en Firestore");
            setError("Usuario no registrado en base de datos.");
            await signOut(auth);
            setUser(null);
          }
        } catch (err) {
          console.error("Error auth:", err);
          setError("Error de conexión. Intente de nuevo.");
          await signOut(auth);
          setUser(null);
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
      console.error("Login error:", err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError("Credenciales incorrectas.");
      } else if (err.code === 'auth/too-many-requests') {
        setError("Cuenta bloqueada temporalmente por intentos fallidos.");
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
      console.error("Error logout:", e);
    }
  };

  return { user, role, loading, error, login, logout };
}