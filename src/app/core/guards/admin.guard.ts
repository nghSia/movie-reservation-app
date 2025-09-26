import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../../features/auth/services/auth-service';

export const adminGuard: CanActivateFn = () => {
  const s_authService = inject(AuthService);
  const c_router = inject(Router);

  return toObservable(s_authService.v_currentUser$).pipe(
    take(1),
    map((v_user) => {
      if (v_user && v_user.role === 'ADMIN') {
        return true;
      } else {
        c_router.navigate(['/todos']);
        return false;
      }
    }),
  );
};
