import { BaseRepository } from './BaseRepository';
import type { User } from '../models/User';
import { query, where, getDocs } from 'firebase/firestore';

export class UsersRepository extends BaseRepository<User> {
  constructor() { super('users'); }

  async getByEmail(email: string): Promise<User | null> {
    const q = query(this.getCollection(), where('email', '==', email));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { ...(doc.data() as User), id: doc.id };
  }
}
