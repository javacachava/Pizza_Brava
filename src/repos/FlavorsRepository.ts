import { BaseRepository } from './BaseRepository';
import type { Flavor } from '../models/Flavor';
import { query, orderBy, getDocs } from 'firebase/firestore';

export class FlavorsRepository extends BaseRepository<Flavor> {
  constructor() { super('flavors'); }

  async getAllOrdered(): Promise<Flavor[]> {
    const q = query(this.getCollection(), orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ ...(d.data() as Flavor), id: d.id }));
  }
}
