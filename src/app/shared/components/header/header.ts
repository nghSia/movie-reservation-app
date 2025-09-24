import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../features/auth/services/auth-service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink],
  standalone: true,
  template: `
    <header class="bg-pink-600 text-white p-4">
      <div class="container mx-auto flex justify-between items-center">
        <h1 class="text-2xl font-bold ">
          <a routerLink="/" class="hover:text-blue-200">MovApp</a>
        </h1>
        <nav>
          <ul class="flex space-x-4">
            @if (this.m_currentUser()) {
              <li>
                <a routerLink="reservation/my-reservation" class="hover:text-blue-200"
                  >My reservation</a
                >
              </li>
              @if (this.m_currentUser()?.role === 'ADMIN') {
                <li><a routerLink="/admin" class="hover:text-blue-200">Admin</a></li>
              }
              <li><button (click)="logout()" class="hover:text-blue-200">Logout</button></li>
            } @else {
              <li><a routerLink="/auth/login" class="hover:text-blue-200">Login</a></li>
              <li><a routerLink="/auth/register" class="hover:text-blue-200">Register</a></li>
            }
          </ul>
        </nav>
      </div>
    </header>
  `,
})
export class Header {
  private s_authService = inject(AuthService);
  public c_router = inject(Router);

  m_currentUser = this.s_authService.v_currentUser$;

  /** Constructor */
  constructor() {
    this.m_currentUser = this.s_authService.v_currentUser$;
  }

  /** Logout the current user */
  logout() {
    this.s_authService.logout();
    this.c_router.navigate(['/auth/login']);
  }
}
