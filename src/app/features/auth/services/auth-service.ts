import { computed, Injectable, signal } from '@angular/core';
import { delay, Observable, of, throwError } from 'rxjs';
import { LoginRequest, RegisterRequest, User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private v_currentUser = signal<User | null>(null);
  public v_currentUser$ = this.v_currentUser.asReadonly();
  public v_isAdmin = computed(() => this.v_currentUser()?.role === 'ADMIN');

  /** Mock user data */
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
    'admin@example.com': 'admin123',
    'user@example.com': 'user123',
  };

  constructor() {
    this.loadUsersFromStorage();

    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      this.v_currentUser.set(JSON.parse(savedUser));
    }
  }

  /** login into existing user account */
  login(p_credentials: LoginRequest): Observable<User> {
    const v_user = this.v_userMocks.find((u) => u.email === p_credentials.email);
    const v_password = this.v_passWords[p_credentials.email];

    if (v_user && v_password === p_credentials.password) {
      return of(v_user).pipe(delay(500));
    } else {
      return throwError(() => new Error('Email ou mot de passe incorrect'));
    }
  }

  /** register a new user */
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

  /** Logout the current user */
  logout(): void {
    this.v_currentUser.set(null);
    localStorage.removeItem('currentUser');
  }

  /** Get the current logged-in user */
  getCurrentUser(): User | null {
    return this.v_currentUser();
  }

  /** Get all users */
  getAllUsers(): Observable<User[]> {
    return of(this.v_userMocks).pipe(delay(300));
  }

  /** delete a user */
  deleteUser(p_userId: number): Observable<void> {
    const v_index = this.v_userMocks.findIndex((u) => u.id === p_userId);
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

  /** Get a mock token for the current user */
  getToken(): string | null {
    const v_user = this.v_currentUser();
    return v_user ? `mock-token-${v_user.id}` : null;
  }

  /** Set the current user and save to local storage */
  setCurrentUser(p_user: User): void {
    this.v_currentUser.set(p_user);
    localStorage.setItem('currentUser', JSON.stringify(p_user));
  }

  /** Save user data to local storage */
  private saveUsersToStorage(): void {
    localStorage.setItem('users', JSON.stringify(this.v_userMocks));
    localStorage.setItem('usersPassword', JSON.stringify(this.v_passWords));
  }

  /** Load user data from local storage */
  private loadUsersFromStorage(): void {
    const v_savedUsers = localStorage.getItem('users');
    const v_savedPasswords = localStorage.getItem('usersPassword');

    if (v_savedUsers && v_savedPasswords) {
      this.v_userMocks = JSON.parse(v_savedUsers);
      this.v_passWords = JSON.parse(v_savedPasswords);
    }
  }

  /** Clear all user data from local storage (for testing purposes) */
  clearAllUserData(): void {
    localStorage.removeItem('users');
    localStorage.removeItem('usersPassword');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    this.loadUsersFromStorage();
  }
}
