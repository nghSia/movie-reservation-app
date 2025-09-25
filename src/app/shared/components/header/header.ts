import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { AuthService } from '../../../features/auth/services/auth-service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink, RouterModule],
  standalone: true,
  template: `
    <header class="bg-secondary-500 text-white">
      <div class="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 class="text-2xl font-bold">
          <a
            routerLink="/"
            routerLinkActive="text-accent-500 bg-white/10"
            [routerLinkActiveOptions]="{ exact: true }"
            class="px-3 py-2 rounded-lg text-white hover:text-accent-500 hover:bg-white/10 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-300"
          >
            MovApp
          </a>
        </h1>

        <nav>
          <ul class="flex items-center gap-6 md:gap-8 lg:gap-10">
            @if (this.m_currentUser()) {
              @if (this.m_currentUser()?.role === 'USER') {
                <li>
                  <a
                    routerLink="reservation/my-reservation"
                    routerLinkActive="text-accent-500 bg-white/10"
                    class="px-3 py-2 rounded-lg opacity-90 hover:opacity-100 hover:text-accent-500 hover:bg-white/10 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-300"
                  >
                    My reservation
                  </a>
                </li>
              }
              @if (this.m_currentUser()?.role === 'ADMIN') {
                <li>
                  <a
                    routerLink="/admin"
                    routerLinkActive="text-accent-500 bg-white/10"
                    [routerLinkActiveOptions]="{ exact: true }"
                    class="px-3 py-2 rounded-lg opacity-90 hover:opacity-100 hover:text-accent-500 hover:bg-white/10 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-300"
                  >
                    Admin
                  </a>
                </li>
                <li>
                  <a
                    routerLink="/admin/stats"
                    routerLinkActive="text-accent-500 bg-white/10"
                    class="px-3 py-2 rounded-lg opacity-90 hover:opacity-100 hover:text-accent-500 hover:bg-white/10 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-300"
                  >
                    Stats
                  </a>
                </li>
              }
              <li>
                <button
                  routerLink="/home"
                  (click)="logout()"
                  class="px-3 py-2 rounded-lg opacity-90 hover:opacity-100 hover:text-accent-500 hover:bg-white/10 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-300"
                >
                  Logout
                </button>
              </li>
            } @else {
              <li>
                <a
                  routerLink="/auth/login"
                  routerLinkActive="text-accent-500 bg-white/10"
                  class="px-3 py-2 rounded-lg opacity-90 hover:opacity-100 hover:text-accent-500 hover:bg-white/10 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-300"
                >
                  Login
                </a>
              </li>
              <li>
                <a
                  routerLink="/auth/register"
                  routerLinkActive="text-accent-500 bg-white/10"
                  class="px-3 py-2 rounded-lg opacity-90 hover:opacity-100 hover:text-accent-500 hover:bg-white/10 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-300"
                >
                  Register
                </a>
              </li>
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
