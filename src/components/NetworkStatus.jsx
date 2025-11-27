import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingWrites, setPendingWrites] = useState(false);

  useEffect(() => {
    // 1. Escuchar estado de conexión del navegador
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 2. Escuchar si hay escrituras pendientes en Firestore (Cola offline)
    // Escuchamos la colección 'orders' para metadatos
    // NOTA: includeMetadataChanges: true es la clave aquí
    const q = query(collection(db, "orders"));
    const unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
      setPendingWrites(snapshot.metadata.hasPendingWrites);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  if (isOnline && !pendingWrites) return null; // Todo normal, no mostrar nada

  return (
    <div className={`fixed bottom-0 left-0 right-0 p-2 text-xs font-bold flex justify-center items-center gap-2 z-50 transition-colors ${
      !isOnline ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
    }`}>
      {!isOnline ? (
        <>
          <WifiOff size={16} /> 
          MODO OFFLINE - Los pedidos se guardarán localmente
        </>
      ) : (
        <>
          <RefreshCw size={16} className="animate-spin" />
          Sincronizando cambios pendientes...
        </>
      )}
    </div>
  );
}