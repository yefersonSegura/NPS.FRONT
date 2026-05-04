import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';

import { AuthService } from '../../features/auth/services/auth.service';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const auth = inject(AuthService);
  return auth.isAuthenticated() || router.parseUrl('/login');
};

export const loginPageGuard: CanActivateFn = () => {
  const router = inject(Router);
  const auth = inject(AuthService);
  return !auth.isAuthenticated() || router.parseUrl('/home');
};

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const auth = inject(AuthService);
  return auth.isAdmin() || router.parseUrl('/home');
};

export const voterGuard: CanActivateFn = () => {
  const router = inject(Router);
  const auth = inject(AuthService);
  return auth.isVoter() || router.parseUrl('/home');
};
