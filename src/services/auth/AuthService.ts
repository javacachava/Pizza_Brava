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
    if (!data.user) throw new Error('No se pudo obtener el usuario.');

    const uid = data.user.id;

    // 2. Buscar el perfil en la tabla 'public.users'
    // Nota: Como ya actualizamos el ID en la BD con el script SQL anterior, esto funcionará.
    const user = await this.users.getById(uid);

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

  async getUserById(id: string): Promise<User | null> {
    return this.users.getById(id);
  }
  
  // Método auxiliar para obtener el usuario actual de la sesión
  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    return this.getUserById(user.id);
  }
}