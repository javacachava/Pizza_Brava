import { BaseRepository } from './BaseRepository';
import type { Size } from '../models/Size';
import { query, orderBy, getDocs } from 'firebase/firestore';

export class SizesRepository extends BaseRepository<Size> {
  constructor() { super('sizes'); }

  async getAllOrdered(): Promise<Size[]> {
    const q = query(this.getCollection(), orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ ...(d.data() as Size), id: d.id }));
  }
}
