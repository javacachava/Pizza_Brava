export type UserRole = 'admin' | 'manager' | 'cashier' | 'kitchen' | 'waiter';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt?: Date | any;
  phone?: string;
}
