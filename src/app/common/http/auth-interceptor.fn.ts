import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';

import { AuthService } from '../../features/auth/services/auth.service';

const AUTH_RETRY_HEADER = 'x-nps-auth-retry';

function isAnonymousAuthApiUrl(url: string): boolean {
  let pathname: string;
  try {
    pathname = new URL(url).pathname;
  } catch {
    try {
      pathname = new URL(
        url,
        typeof location !== 'undefined' ? location.origin : 'http://localhost',
      ).pathname;
    } catch {
      pathname = url;
    }
  }
  const p = pathname.toLowerCase();
  return p.includes('/api/auth/login') || p.includes('/api/auth/refresh');
}

// Pega el Bearer; si el backend suelta 401 probamos un refresh y reintentamos una sola vez (header interno evita bucle).
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  authService.touchActivity();

  let out = req;
  const skipBearer = isAnonymousAuthApiUrl(req.url);
  const token = authService.getAccessToken();

  if (token && !skipBearer && !req.headers.has('Authorization')) {
    out = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(out).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse)) {
        return throwError(() => err);
      }

      const hadRetry = req.headers.has(AUTH_RETRY_HEADER);

      if (err.status === 401 && !isAnonymousAuthApiUrl(req.url) && !hadRetry) {
        return authService.refreshTokens().pipe(
          switchMap((ok) => {
            if (!ok) {
              authService.logout();
              return throwError(() => err);
            }
            const fresh = authService.getAccessToken();
            if (!fresh) {
              authService.logout();
              return throwError(() => err);
            }
            const retry = req.clone({
              setHeaders: {
                Authorization: `Bearer ${fresh}`,
                [AUTH_RETRY_HEADER]: '1',
              },
            });
            return next(retry);
          }),
          catchError(() => {
            authService.logout();
            return throwError(() => err);
          }),
        );
      }

      if (err.status === 401 && hadRetry && !isAnonymousAuthApiUrl(req.url)) {
        authService.logout();
      }

      return throwError(() => err);
    }),
  );
};
