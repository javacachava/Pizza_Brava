import { UsersRepository } from '../../repos/UsersRepository';
import { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

import type { User } from '../../models/User';

export class UsersAdminService {
  private repo = new UsersRepository();
  private auth = getAuth();

  async listAll(): Promise<User[]> {
    return this.repo.getAll();
  }

  async createUser(email: string, password: string, name: string, role: User['role'] = 'cashier') {
    const userCred = await createUserWithEmailAndPassword(this.auth, email, password);
    const uid = userCred.user.uid;
    await this.repo.create({
      id: uid,
      email,
      name,
      role,
      isActive: true,
      createdAt: new Date()
    } as any);
    return uid;
  }

  async resetPassword(email: string) {
    return sendPasswordResetEmail(this.auth, email);
  }

  async updateUser(id: string, data: Partial<User>) {
    return this.repo.update(id, data);
  }

  async toggleActive(id: string, value: boolean) {
    return this.repo.update(id, { isActive: value });
  }
}
