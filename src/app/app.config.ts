import { APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { authInterceptor } from './common/http/auth-interceptor.fn';
import { routes } from './app.routes';
import { AuthService } from './features/auth/services/auth.service';

export function bootstrapAuthSession(auth: AuthService): () => Promise<void> {
  return () => {
    auth.bootstrapSessionWatchers();
    return Promise.resolve();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: bootstrapAuthSession,
      deps: [AuthService],
      multi: true,
    },
  ],
};
