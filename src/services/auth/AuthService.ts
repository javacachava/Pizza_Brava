import { supabase } from '../supabase';
import type { IUserRepository } from '../../repos/interfaces/IUserRepository';
import type { User } from '../../models/User';

export class AuthService {
  private users: IUserRepository;

  constructor(users: IUserRepository) {
    this.users = users;
  }

  async login(email: string, password: string): Promise<User> {
    // 1. Autenticar contra Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user || !data.user.email) throw new Error('No se pudo obtener el usuario.');

    // 2. CORRECCIÓN: Buscar por EMAIL, no por ID.
    // Esto conecta tu usuario 'user_admin' con la cuenta de Auth, aunque los IDs sean diferentes.
    const user = await this.users.getByEmail(data.user.email);

    if (!user) {
      await this.logout();
      throw new Error('Usuario sin perfil asignado en el sistema.');
    }

    // 3. Validar estado
    if (user.isActive === false) {
      await this.logout();
      throw new Error('Cuenta desactivada por administración.');
    }

    return user;
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  }

  // Método auxiliar para buscar por email directamente
  async getUserByEmail(email: string): Promise<User | null> {
    return this.users.getByEmail(email);
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.getById(id);
  }
}