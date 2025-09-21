import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth-service';

// Validateur personnalisé pour la confirmation de mot de passe
function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  if (password && confirmPassword && password.value !== confirmPassword.value) {
    return { passwordMismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div
      class="min-h-screen text-black flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 rounded-2xl"
    >
      <div class="max-w-md w-full space-y-8">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Créer un compte</h2>
        </div>

        <form [formGroup]="m_registerForm" (ngSubmit)="onSubmit()" class="mt-8 space-y-6">
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700"> Nom complet </label>
            <input
              id="name"
              type="text"
              formControlName="name"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              [class.border-red-500]="isFieldInvalid('name')"
            />
            @if (isFieldInvalid('name')) {
              <p class="mt-1 text-sm text-red-600">
                {{ getFieldError('name') }}
              </p>
            }
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">
              Adresse email
            </label>
            <input
              id="email"
              type="email"
              formControlName="email"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              [class.border-red-500]="isFieldInvalid('email')"
            />
            @if (isFieldInvalid('email')) {
              <p class="mt-1 text-sm text-red-600">
                {{ getFieldError('email') }}
              </p>
            }
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              formControlName="password"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              [class.border-red-500]="isFieldInvalid('password')"
            />
            @if (isFieldInvalid('password')) {
              <p class="mt-1 text-sm text-red-600">
                {{ getFieldError('password') }}
              </p>
            }
          </div>

          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700">
              Confirmer le mot de passe
            </label>
            <input
              id="confirmPassword"
              type="password"
              formControlName="confirmPassword"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              [class.border-red-500]="isFieldInvalid('confirmPassword')"
            />
            @if (isFieldInvalid('confirmPassword')) {
              <p class="mt-1 text-sm text-red-600">
                {{ getFieldError('confirmPassword') }}
              </p>
            }
          </div>

          <div>
            <button
              type="submit"
              [disabled]="m_registerForm.invalid || m_loading()"
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
            >
              @if (m_loading()) {
                <span
                  class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
                ></span>
                Création en cours...
              } @else {
                Créer le compte
              }
            </button>
          </div>

          @if (m_error()) {
            <div class="bg-red-50 border border-red-200 rounded-md p-4">
              <p class="text-sm text-red-600">{{ m_error() }}</p>
            </div>
          }
        </form>
      </div>
    </div>
  `,
})
export class Register {
  private m_formBuilder = inject(FormBuilder);
  private s_authService = inject(AuthService);
  private c_router = inject(Router);

  m_registerForm: FormGroup;
  m_loading = signal(false);
  m_error = signal<string>('');

  /** Constructor */
  constructor() {
    this.m_registerForm = this.m_formBuilder.group(
      {
        name: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: passwordMatchValidator },
    );
  }

  /** Handle form submission for registration */
  onSubmit() {
    if (this.m_registerForm.valid) {
      this.m_loading.set(true);
      this.m_error.set('');

      const { confirmPassword, ...userData } = this.m_registerForm.value;
      void confirmPassword;

      this.s_authService.register(userData).subscribe({
        next: () => {
          this.m_loading.set(false);
          this.c_router.navigate(['/home']);
        },
        error: (err) => {
          this.m_loading.set(false);
          this.m_error.set(err.message || 'Erreur lors de la création du compte');
        },
      });
    }
  }

  /** Check if a form field is invalid and touched */
  isFieldInvalid(p_fieldName: string): boolean {
    const v_field = this.m_registerForm.get(p_fieldName);
    return !!(v_field && v_field.invalid && (v_field.dirty || v_field.touched));
  }

  /** Get the error message for a specific form field */
  getFieldError(p_fieldName: string): string {
    const v_field = this.m_registerForm.get(p_fieldName);
    if (v_field?.errors) {
      if (v_field.errors['required']) return 'Ce champ est requis';
      if (v_field.errors['email']) return "Format d'email invalide";
      if (v_field.errors['minlength'])
        return `Minimum ${v_field.errors['minlength'].requiredLength} caractères`;
      if (v_field.errors['passwordMismatch']) return 'Les mots de passe ne correspondent pas';
    }
    return '';
  }
}
