import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

export function useMenu() {
  const [menuItems, setMenuItems] = useState([]);
  
  useEffect(() => {
    const loadMenu = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "menuItems"));
        const items = [];
        querySnapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() });
        });
        setMenuItems(items.filter(i => i.isActive !== false));
      } catch (error) {
        console.error("Error al cargar menú:", error);
      }
    };
    loadMenu();
  }, []);

  return { menuItems };
}