import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../../features/auth/services/auth-service';

export const adminGuard: CanActivateFn = () => {
  const s_authService = inject(AuthService);
  const c_router = inject(Router);
  const c_snackBar = inject(MatSnackBar);

  return toObservable(s_authService.v_currentUser$).pipe(
    take(1),
    map((v_user) => {
      if (v_user && v_user.role === 'ADMIN') {
        return true;
      } else {
        c_snackBar.open("Accès refusé : vous n'êtes pas administrateur", 'Fermer', {
          duration: 4000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        });
        c_router.navigate(['/todos']);
        return false;
      }
    }),
  );
};
