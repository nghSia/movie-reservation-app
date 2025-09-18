import { computed, Injectable, signal } from '@angular/core';
import { LoginRequest, RegisterRequest, User } from '../models/user.model';
import { delay, Observable, of, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private v_currentUser = signal<User | null>(null);
  public v_currentUser$ = this.v_currentUser.asReadonly();

  public v_isAdmin = computed(() => this.v_currentUser()?.role === 'ADMIN');

  private v_userMocks: User[] = [
    {
      id: 1,
      email: 'admin@example.com',
      role: 'ADMIN',
    },
    {
      id: 2,
      email: 'user@example.com',
      role: 'USER',
    },
  ];

  private v_passWords: Record<string, string> = {
    'admin@example.com': 'admin',
    'user@example.com': 'user',
  };

  constructor() {
    this.loadUsersFromStorage();

    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      this.v_currentUser.set(JSON.parse(savedUser));
    }
  }

  login(p_credentials: LoginRequest): Observable<User> {
    const v_user = this.v_userMocks.find((u) => u.email === p_credentials.email);
    const v_password = this.v_passWords[p_credentials.email];

    if (v_user && v_password === p_credentials.password) {
      return of(v_user).pipe(delay(500));
    } else {
      return throwError(() => new Error('Email ou mot de passe incorrect'));
    }
  }

  register(p_userData: RegisterRequest): Observable<User> {
    const v_existingUser = this.v_userMocks.find((u) => u.email === p_userData.email);
    if (v_existingUser) {
      return throwError(() => new Error('Cet email est déjà utilisé'));
    }

    const v_newUser: User = {
      id: this.v_userMocks.length + 1,
      email: p_userData.email,
      role: 'USER',
    };

    this.v_userMocks.push(v_newUser);
    this.v_passWords[p_userData.email] = p_userData.password;

    this.saveUsersToStorage();

    return of(v_newUser).pipe(delay(500));
  }

  logout(): void {
    this.v_currentUser.set(null);
    localStorage.removeItem('currentUser');
  }

  getCurrentUser(): User | null {
    return this.v_currentUser();
  }

  getAllUsers(): Observable<User[]> {
    return of(this.v_userMocks).pipe(delay(300));
  }

  deleteUser(userId: number): Observable<void> {
    const v_index = this.v_userMocks.findIndex((u) => u.id === userId);
    if (v_index !== -1) {
      const v_deletedUser = this.v_userMocks[v_index];
      this.v_userMocks.splice(v_index, 1);
      if (v_deletedUser && v_deletedUser.email) {
        delete this.v_passWords[v_deletedUser.email];
      }
      this.saveUsersToStorage();
      return of(void 0).pipe(delay(300));
    }
    return throwError(() => new Error('Utilisateur non trouvé'));
  }

  getToken(): string | null {
    const v_user = this.v_currentUser();
    return v_user ? `mock-token-${v_user.id}` : null;
  }

  setCurrentUser(user: User): void {
    this.v_currentUser.set(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  private saveUsersToStorage(): void {
    localStorage.setItem('users', JSON.stringify(this.v_userMocks));
    localStorage.setItem('usersPassword', JSON.stringify(this.v_passWords));
  }

  private loadUsersFromStorage(): void {
    const savedUsers = localStorage.getItem('users');
    const savedPasswords = localStorage.getItem('usersPassword');

    if (savedUsers && savedPasswords) {
      this.v_userMocks = JSON.parse(savedUsers);
      this.v_passWords = JSON.parse(savedPasswords);
    }
  }

  clearAllUserData(): void {
    localStorage.removeItem('users');
    localStorage.removeItem('usersPassword');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    this.loadUsersFromStorage();
  }
}
