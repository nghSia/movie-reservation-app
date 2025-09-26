import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../../features/auth/services/auth-service';

export const authGuard: CanActivateFn = (route, state) => {
  const s_authService = inject(AuthService);
  const c_router = inject(Router);
  const c_snackBar = inject(MatSnackBar);

  return toObservable(s_authService.v_currentUser$).pipe(
    take(1),
    map((user) => {
      if (user) {
        return true;
      } else {
        c_snackBar.open('Vous devez être connecté pour accéder à cette page', 'Fermer', {
          duration: 4000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        });
        c_router.navigate(['/auth/login'], {
          queryParams: { returnUrl: state.url },
        });
        return false;
      }
    }),
  );
};
