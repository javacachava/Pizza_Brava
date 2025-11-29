import { useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1) Cerrar sesión automáticamente al cerrar/recargar la pestaña
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        // Limpieza local: carrito, config y cualquier otra cosa
        localStorage.removeItem("pizza_brava_cart_v2");
        localStorage.removeItem("pizza_brava_config_v2");
        sessionStorage.clear();
      } catch (e) {
        console.warn("Error limpiando storage en beforeunload:", e);
      }

      // Best effort: avisar a Firebase que cierre sesión
      // (no siempre se alcanza a completar, pero ayuda)
      signOut(auth).catch((err) =>
        console.error("Error signOut en beforeunload:", err)
      );
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // 2) Observer de Auth + carga de rol desde Firestore
  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (cancelled) return;
      setLoading(true);

      if (!currentUser) {
        // No hay usuario logueado
        setUser(null);
        setRole(null);
        setError(null);
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          console.error("Usuario sin documento en Firestore");
          setError("Usuario no registrado en base de datos.");
          await signOut(auth);
          if (!cancelled) {
            setUser(null);
            setRole(null);
          }
          setLoading(false);
          return;
        }

        const userData = userSnap.data();

        if (userData.active === false) {
          console.warn("Usuario desactivado intentó ingresar.");
          setError(
            "Tu cuenta ha sido desactivada. Contacta al administrador."
          );
          await signOut(auth);
          if (!cancelled) {
            setUser(null);
            setRole(null);
          }
          setLoading(false);
          return;
        }

        // Refrescar token para tener claims actualizados si algún día los usas
        await currentUser.getIdToken(true);

        if (!cancelled) {
          setUser(currentUser);
          setRole(userData.role || null);
          setError(null);
        }
      } catch (err) {
        console.error("Error en useAuth:", err);
        setError("Error de conexión. Intenta de nuevo.");
        await signOut(auth);
        if (!cancelled) {
          setUser(null);
          setRole(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged se encarga del resto
    } catch (err) {
      console.error("Login error:", err);
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/wrong-password"
      ) {
        setError("Credenciales incorrectas.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Cuenta bloqueada temporalmente por intentos fallidos.");
      } else if (err.code === "auth/user-disabled") {
        setError("Esta cuenta ha sido deshabilitada por el administrador.");
      } else if (err.code === "auth/user-not-found") {
        setError("Usuario no encontrado.");
      } else {
        setError("Error al iniciar sesión.");
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Error logout:", e);
    } finally {
      try {
        localStorage.removeItem("pizza_brava_cart_v2");
        localStorage.removeItem("pizza_brava_config_v2");
        sessionStorage.clear();
      } catch (e) {
        console.warn("Error limpiando storage en logout:", e);
      }
      setUser(null);
      setRole(null);
    }
  };

  return { user, role, loading, error, login, logout };
}
