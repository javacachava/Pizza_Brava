import { BaseRepository } from '../BaseRepository';
import type { User } from '../../models/User';
import type { IUserRepository } from '../interfaces/IUserRepository';
import { supabase } from '../../services/supabase';

export class UsersRepository extends BaseRepository<User> implements IUserRepository {
  constructor() { super('users'); }

  async getById(id: string): Promise<User | null> { return super.getById(id); }

  async getByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
       // Si no existe devuelve null limpio
       if (error.code === 'PGRST116') return null;
       throw error;
    }
    return data as User;
  }

  async getAll(): Promise<User[]> { return super.getAll(); }

  async create(u: Partial<User>): Promise<User> {
    // Si viene ID (desde auth), úsalo. Si no, Supabase genera uno.
    const payload = { 
        ...u, 
        created_at: new Date().toISOString(), 
        is_active: u.isActive ?? true 
    };
    return super.create(payload as any);
  }

  async update(id: string, partial: Partial<User>): Promise<void> { return super.update(id, partial); }

  async delete(id: string): Promise<void> { return super.delete(id); }
}