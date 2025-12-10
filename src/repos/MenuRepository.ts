import { BaseRepository } from './BaseRepository';
import type { MenuItem } from '../models/MenuItem';

import {
    query,
    where,
    getDocs
} from 'firebase/firestore';

export class MenuRepository extends BaseRepository<MenuItem> {
    constructor() {
        super('products');
    }

    async getByCategory(categoryId: string): Promise<MenuItem[]> {
        const colRef = this.getCollection();
        const q = query(
            colRef,
            where('categoryId', '==', categoryId),
            where('isAvailable', '==', true)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MenuItem));
    }
}
