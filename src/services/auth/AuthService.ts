import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../firebase'; 
import type { IUserRepository } from '../../repos/interfaces/IUserRepository';
import type { User } from '../../models/User';

export class AuthService {
  private users: IUserRepository;

  constructor(users: IUserRepository) {
    this.users = users;
  }

  async login(email: string, password: string): Promise<User> {
    // 1. Autenticar contra Firebase Auth (Nube)
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // 2. Buscar el perfil en Firestore usando el UID
    const user = await this.users.getById(uid);

    if (!user) {
      // Si entra a Firebase pero no tiene doc en Firestore
      await signOut(auth); 
      throw new Error('Usuario sin perfil asignado en el sistema.');
    }

    // 3. Validar que esté activo en el sistema
    if (user.isActive === false) {
      await signOut(auth);
      throw new Error('Cuenta desactivada por administración.');
    }

    return user;
  }

  async logout(): Promise<void> {
    await signOut(auth);
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.getById(id);
  }
}