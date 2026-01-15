import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../service/auth';
import { map, catchError, of } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.validateToken().pipe(
    map(isValid => {
      if (isValid) {
        return true;
      }
      router.navigate(['/']);
      return false;
    }),
    catchError(() => {
      router.navigate(['/']);
      return of(false);
    })
  );
};
