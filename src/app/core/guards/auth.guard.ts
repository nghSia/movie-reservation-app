import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../../features/auth/services/auth-service';

export const authGuard: CanActivateFn = (route, state) => {
  const s_authService = inject(AuthService);
  const c_router = inject(Router);

  return toObservable(s_authService.v_currentUser$).pipe(
    take(1),
    map((user) => {
      if (user) {
        return true;
      } else {
        c_router.navigate(['/auth/login'], {
          queryParams: { returnUrl: state.url },
        });
        return false;
      }
    }),
  );
};
