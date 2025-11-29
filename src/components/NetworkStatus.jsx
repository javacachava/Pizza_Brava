import React, { useState, useEffect } from "react";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../services/firebase";

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingWrites, setPendingWrites] = useState(false);
  const [user, setUser] = useState(auth.currentUser);

  // 1) Estado de conexión del navegador
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // 2) Escuchar autenticación (para no romper reglas de Firestore)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
    });
    return () => unsub();
  }, []);

  // 3) Listener a Firestore para detectar escrituras pendientes
  useEffect(() => {
    // Si no hay usuario o no hay internet, no escuchamos Firestore
    if (!user || !isOnline) {
      setPendingWrites(false);
      return;
    }

    const q = query(collection(db, "orders"));

    const unsubscribe = onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snapshot) => {
        setPendingWrites(snapshot.metadata.hasPendingWrites);
      },
      (error) => {
        // Si son permisos, no queremos llenar la consola ni romper UX
        if (error.code !== "permission-denied") {
          console.error("NetworkStatus listener error:", error);
        }
        setPendingWrites(false);
      }
    );

    return () => unsubscribe();
  }, [user, isOnline]);

  // Si todo está bien (online y sin pendientes), no mostramos nada
  if (isOnline && !pendingWrites) return null;

  const isOffline = !isOnline;

  const variantClasses = isOffline
    ? "bg-red-900/90 border-red-500/70 text-red-50"
    : "bg-amber-900/90 border-amber-500/70 text-amber-50";

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 md:left-6 md:translate-x-0 px-4 py-2 rounded-full border backdrop-blur-sm shadow-lg flex items-center gap-2 text-xs font-semibold tracking-wide z-40 ${variantClasses}`}
    >
      {isOffline ? (
        <>
          <WifiOff size={16} />
          <span>
            MODO OFFLINE – los pedidos se guardarán localmente y se enviarán al
            reconectar.
          </span>
        </>
      ) : (
        <>
          <RefreshCw size={16} className="animate-spin" />
          <span>Sincronizando cambios pendientes con la nube…</span>
        </>
      )}
    </div>
  );
}
