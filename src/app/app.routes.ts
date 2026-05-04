import { Routes } from '@angular/router';

import { adminGuard, authGuard, loginPageGuard, voterGuard } from './core/guards/auth.guards';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/views/auth-page.component').then((m) => m.AuthPageComponent),
    canActivate: [loginPageGuard],
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./features/shell/app-shell.component').then((m) => m.AppShellComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/shell/home-redirect.component').then((m) => m.HomeRedirectComponent),
      },
      {
        path: 'dashboard',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/nps/results/views/dashboard-page.component').then(
            (m) => m.DashboardPageComponent,
          ),
      },
      {
        path: 'vote',
        canActivate: [voterGuard],
        loadComponent: () =>
          import('./features/nps/vote/views/vote-page.component').then((m) => m.VotePageComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'home' },
];
