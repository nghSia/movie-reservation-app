import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen grid place-items-center px-4 sm:px-6 lg:px-8">
      <div
        class="max-w-md w-full space-y-8 bg-white border border-secondary-100 rounded-3xl p-6 shadow-soft"
      >
        <div>
          <h2 class="mt-2 text-center text-3xl font-extrabold text-secondary-900">
            Connexion à votre compte
          </h2>
        </div>

        <form [formGroup]="m_loginForm" (ngSubmit)="onSubmit()" class="mt-6 space-y-6">
          <div>
            <label for="email" class="block text-sm font-medium text-secondary-800">
              Adresse email
            </label>
            <input
              id="email"
              type="email"
              formControlName="email"
              class="mt-1 block w-full px-3 py-2 border border-secondary-200 rounded-xl shadow-sm
                 bg-white text-secondary-900
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300
                 hover:bg-secondary-100 hover:text-secondary-900 transition-colors"
              [class.border-red-500]="isFieldInvalid('email')"
            />
            @if (isFieldInvalid('email')) {
              <p class="mt-1 text-sm text-red-600">
                {{ getFieldError('email') }}
              </p>
            }
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-secondary-800">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              formControlName="password"
              class="mt-1 block w-full px-3 py-2 border border-secondary-200 rounded-xl shadow-sm
                 bg-white text-secondary-900
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300
                 hover:bg-secondary-100 hover:text-secondary-900 transition-colors"
              [class.border-red-500]="isFieldInvalid('password')"
            />
            @if (isFieldInvalid('password')) {
              <p class="mt-1 text-sm text-red-600">
                {{ getFieldError('password') }}
              </p>
            }
          </div>

          <div>
            <button
              type="submit"
              [disabled]="m_loginForm.invalid || m_loading()"
              class="w-full px-4 py-2 rounded-lg font-semibold
                 bg-primary-500 text-white
                 hover:bg-secondary-100 hover:text-secondary-900
                 transition-colors focus:outline-none
                 focus-visible:ring-2 focus-visible:ring-primary-300
                 disabled:opacity-50"
            >
              @if (m_loading()) {
                <span
                  class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"
                ></span>
                Connexion en cours...
              } @else {
                Se connecter
              }
            </button>
          </div>

          @if (m_error()) {
            <div class="bg-red-50 border border-red-200 rounded-xl p-4">
              <p class="text-sm text-red-600">{{ m_error() }}</p>
            </div>
          }
        </form>
      </div>
    </div>
  `,
})
export class Login {
  private m_formbuilder = inject(FormBuilder);
  private s_authService = inject(AuthService);
  private c_router = inject(Router);

  m_loginForm: FormGroup;
  m_loading = signal(false);
  m_error = signal<string>('');

  /** Constructor */
  constructor() {
    this.m_loginForm = this.m_formbuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  /** Handle form submission for login */
  onSubmit() {
    if (this.m_loginForm.valid) {
      this.m_loading.set(true);
      this.m_error.set('');

      this.s_authService.login(this.m_loginForm.value).subscribe({
        next: (user) => {
          this.m_loading.set(false);
          this.c_router.navigate(['/home']);
          this.s_authService.setCurrentUser(user);
        },
        error: (err) => {
          this.m_loading.set(false);
          this.m_error.set(err.message || 'Erreur de connexion');
        },
      });
    }
  }

  /** Check if a form field is invalid and touched */
  isFieldInvalid(fieldName: string): boolean {
    const v_field = this.m_loginForm.get(fieldName);
    return !!(v_field && v_field.invalid && (v_field.dirty || v_field.touched));
  }

  /** Get the error message for a specific form field */
  getFieldError(fieldName: string): string {
    const v_field = this.m_loginForm.get(fieldName);
    if (v_field?.errors) {
      if (v_field.errors['required']) return 'Ce champ est requis';
      if (v_field.errors['email']) return "Format d'email invalide";
      if (v_field.errors['minlength'])
        return `Minimum ${v_field.errors['minlength'].requiredLength} caractères`;
    }
    return '';
  }
}
