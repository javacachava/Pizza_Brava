import { BaseRepository } from './BaseRepository';
import type { Category } from '../models/Category';

import {
    query,
    orderBy,
    getDocs
} from 'firebase/firestore';

export class CategoryRepository extends BaseRepository<Category> {
    constructor() {
        super('categories');
    }

    async getAllOrdered(): Promise<Category[]> {
        const colRef = this.getCollection();
        const q = query(colRef, orderBy('order', 'asc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Category));
    }
}
