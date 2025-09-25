import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-footer',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <footer class="bg-secondary-900 text-secondary-100">
      <div class="container mx-auto px-4 py-10">
        <div class="grid gap-8 md:grid-cols-3">
          <div>
            <a
              routerLink="/"
              routerLinkActive="text-accent-500"
              [routerLinkActiveOptions]="{ exact: true }"
              class="inline-flex items-center gap-2 px-3 py-2 rounded-lg
                     hover:bg-secondary-100 hover:text-secondary-900 transition-colors"
            >
              <span class="text-lg font-semibold">MovApp</span>
            </a>
            <p class="mt-3 text-sm text-secondary-300">
              Réserve tes séances en quelques clics. Horaires en temps réel, sièges numérotés.
            </p>
          </div>

          <nav>
            <h3 class="text-sm font-semibold uppercase tracking-wide text-secondary-300 mb-3">
              Navigation
            </h3>
            <ul class="grid grid-cols-2 gap-y-2 gap-x-6">
              <li>
                <a
                  routerLink="/home"
                  routerLinkActive="text-accent-500"
                  class="inline-block px-3 py-2 rounded-lg hover:bg-secondary-100 hover:text-secondary-900 transition-colors"
                >
                  Accueil
                </a>
              </li>
              <li>
                <a
                  routerLink="/reservation"
                  routerLinkActive="text-accent-500"
                  class="inline-block px-3 py-2 rounded-lg hover:bg-secondary-100 hover:text-secondary-900 transition-colors"
                >
                  Réservations
                </a>
              </li>
              <li>
                <a
                  routerLink="/admin"
                  routerLinkActive="text-accent-500"
                  class="inline-block px-3 py-2 rounded-lg hover:bg-secondary-100 hover:text-secondary-900 transition-colors"
                >
                  Admin
                </a>
              </li>
              <li>
                <a
                  routerLink="/admin/stats"
                  routerLinkActive="text-accent-500"
                  class="inline-block px-3 py-2 rounded-lg hover:bg-secondary-100 hover:text-secondary-900 transition-colors"
                >
                  Stats
                </a>
              </li>
              <li>
                <a
                  routerLink="/auth/login"
                  routerLinkActive="text-accent-500"
                  class="inline-block px-3 py-2 rounded-lg hover:bg-secondary-100 hover:text-secondary-900 transition-colors"
                >
                  Login
                </a>
              </li>
              <li>
                <a
                  routerLink="/auth/register"
                  routerLinkActive="text-accent-500"
                  class="inline-block px-3 py-2 rounded-lg hover:bg-secondary-100 hover:text-secondary-900 transition-colors"
                >
                  Register
                </a>
              </li>
            </ul>
          </nav>

          <div>
            <h3 class="text-sm font-semibold uppercase tracking-wide text-secondary-300 mb-3">
              Informations
            </h3>
            <ul class="space-y-2">
              <li>
                <a
                  routerLink="/legal/terms"
                  class="inline-block px-3 py-2 rounded-lg hover:bg-secondary-100 hover:text-secondary-900 transition-colors"
                  >Conditions d’utilisation</a
                >
              </li>
              <li>
                <a
                  routerLink="/legal/privacy"
                  class="inline-block px-3 py-2 rounded-lg hover:bg-secondary-100 hover:text-secondary-900 transition-colors"
                  >Confidentialité</a
                >
              </li>
              <li>
                <a
                  routerLink="/contact"
                  class="inline-block px-3 py-2 rounded-lg hover:bg-secondary-100 hover:text-secondary-900 transition-colors"
                  >Contact</a
                >
              </li>
            </ul>
          </div>
        </div>

        <div
          class="mt-10 border-t border-white/10 pt-4 flex flex-col md:flex-row items-center justify-between gap-3"
        >
          <p class="text-xs text-secondary-300">
            © {{ m_currentYear }} MovApp. Tous droits réservés.
          </p>
          <div class="flex items-center gap-3">
            <a
              href="#"
              class="px-3 py-1.5 rounded-lg text-xs hover:bg-secondary-100 hover:text-secondary-900 transition-colors"
              >Twitter</a
            >
            <a
              href="#"
              class="px-3 py-1.5 rounded-lg text-xs hover:bg-secondary-100 hover:text-secondary-900 transition-colors"
              >Instagram</a
            >
            <a
              href="#"
              class="px-3 py-1.5 rounded-lg text-xs hover:bg-secondary-100 hover:text-secondary-900 transition-colors"
              >Facebook</a
            >
          </div>
        </div>
      </div>
    </footer>
  `,
})
export class Footer {
  /** Get current year */
  m_currentYear = new Date().getFullYear();
}
