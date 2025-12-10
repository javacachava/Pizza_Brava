import {
    collection,
    getDocs,
    doc,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc
} from 'firebase/firestore';

import type { DocumentData } from 'firebase/firestore';
import { db } from '../services/firebase';

export abstract class BaseRepository<T> {
    protected collectionName: string;

    constructor(collectionName: string) {
        this.collectionName = collectionName;
    }

    protected getCollection() {
        return collection(db, this.collectionName);
    }

    async getAll(): Promise<T[]> {
        const colRef = this.getCollection();
        const snapshot = await getDocs(colRef);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as unknown as T));
    }

    async getById(id: string): Promise<T | null> {
        const docRef = doc(db, this.collectionName, id);
        const snapshot = await getDoc(docRef);
        return snapshot.exists()
            ? ({ id: snapshot.id, ...snapshot.data() } as unknown as T)
            : null;
    }

    async create(data: Omit<T, 'id'>): Promise<string> {
        const colRef = this.getCollection();
        const docRef = await addDoc(colRef, data as DocumentData);
        return docRef.id;
    }

    async update(id: string, data: Partial<T>): Promise<void> {
        const docRef = doc(db, this.collectionName, id);
        await updateDoc(docRef, data as DocumentData);
    }

    async delete(id: string): Promise<void> {
        const docRef = doc(db, this.collectionName, id);
        await deleteDoc(docRef);
    }
}
