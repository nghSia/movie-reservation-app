export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: 'USER' | 'ADMIN';
}
