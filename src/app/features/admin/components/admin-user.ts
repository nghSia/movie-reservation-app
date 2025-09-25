import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth/services/auth-service';

type Role = 'USER' | 'ADMIN';
interface User {
  id: number;
  email: string;
  name?: string;
  role: Role;
}

@Component({
  standalone: true,
  selector: 'app-admin-users',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 max-w-5xl mx-auto text-secondary-900">
      <h1 class="text-2xl font-bold mb-4">Gestion des utilisateurs</h1>

      <div class="flex flex-wrap gap-3 justify-between items-center mb-4">
        <input
          [ngModel]="m_research()"
          (ngModelChange)="m_research.set($event)"
          placeholder="Rechercher (email, nom)"
          class="bg-white border border-secondary-200 rounded-xl px-3 py-2 w-80 max-w-full
             focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300
             hover:bg-secondary-100 hover:text-secondary-900 transition-colors"
        />
        <div class="text-sm text-secondary-600">Total: {{ filtered().length }}</div>
      </div>

      <div class="overflow-x-auto rounded-2xl border border-secondary-200 bg-white">
        <table class="w-full text-sm">
          <thead class="bg-secondary-50 text-secondary-700">
            <tr class="border-b border-secondary-200">
              <th class="text-left px-4 py-3">ID</th>
              <th class="text-left px-4 py-3">Email</th>
              <th class="text-left px-4 py-3">Nom</th>
              <th class="text-left px-4 py-3">Rôle</th>
              <th class="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (v_user of filtered(); track v_user.id) {
              <tr class="border-t border-secondary-100">
                <td class="px-4 py-3 hover:bg-secondary-100 transition-colors">{{ v_user.id }}</td>
                <td class="px-4 py-3 hover:bg-secondary-100 transition-colors">
                  {{ v_user.email }}
                </td>
                <td class="px-4 py-3 hover:bg-secondary-100 transition-colors">
                  {{ v_user.name || '—' }}
                </td>

                <td class="px-4 py-3">
                  <select
                    class="bg-white border border-secondary-200 rounded-lg px-2 py-1
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300
                       hover:bg-secondary-100 hover:text-secondary-900 transition-colors"
                    [disabled]="v_user.id === m_currentUserId()"
                    [ngModel]="v_user.role"
                    (ngModelChange)="onChangeRole(v_user, $event)"
                  >
                    <option [ngValue]="'USER'">USER</option>
                    <option [ngValue]="'ADMIN'">ADMIN</option>
                  </select>
                </td>

                <td class="px-4 py-3 text-right">
                  <button
                    class="px-3 py-1 rounded-lg
                       bg-primary-500 text-white border border-primary-500
                       hover:bg-secondary-100 hover:text-secondary-900 transition-colors
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-200
                       disabled:opacity-50 disabled:cursor-not-allowed"
                    [disabled]="v_user.id === m_currentUserId()"
                    (click)="onDelete(v_user)"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5" class="px-4 py-8 text-center text-secondary-500">
                  Aucun utilisateur
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class AdminUsers {
  private s_authService = inject(AuthService);

  /** Search term */
  m_research = signal('');

  /** load all users */
  constructor() {
    this.s_authService.loadUsers();
  }

  /** Set all users */
  private m_users = computed<User[]>(() => this.s_authService.v_users$());

  /** Current user Id */
  m_currentUserId = computed(() => Number(this.s_authService.v_currentUser$?.()?.id ?? NaN));

  /** Filer search user */
  filtered = computed(() => {
    const v_searchTerm = (this.m_research() ?? '').toLowerCase().trim();
    const v_currentUser = this.m_currentUserId();
    const base = this.m_users().filter((v_user) => Number(v_user.id) !== v_currentUser);
    if (!v_searchTerm) return base;
    return base.filter(
      (v_user) =>
        (v_user.email ?? '').toLowerCase().includes(v_searchTerm) ||
        (v_user.name ?? '').toLowerCase().includes(v_searchTerm),
    );
  });

  /** On user role update */
  onChangeRole(u: User, role: Role) {
    this.s_authService.updateUserRole(u.id, role);
  }

  /** On user delte */
  onDelete(u: User) {
    if (u.id === this.m_currentUserId()) return;
    this.s_authService.deleteUser(u.id);
  }
}
