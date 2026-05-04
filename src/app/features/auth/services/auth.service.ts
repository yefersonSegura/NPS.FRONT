import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, finalize, firstValueFrom, of, shareReplay } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { buildApiUrl } from '../../../common/config/build-api-url';
import { BaseResponse } from '../../../common/models/base-response.model';
import { API_PATHS } from '../../../core/api/api-paths';

const AUTH_SESSION_KEY = 'nps.auth.session';

const JWT_ROLE_CLAIM =
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

export interface AuthSessionSnapshot {
  readonly username: string;
  readonly token: string;
  readonly refreshToken: string;
}

interface LoginResponseData {
  token: string;
  refreshToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly httpDirect = new HttpClient(inject(HttpBackend));

  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private jwtTimer: ReturnType<typeof setTimeout> | null = null;
  private refreshInFlight: Observable<boolean> | null = null;
  private boundIdleReset = (): void => this.resetIdleTimer();

  /** Inactividad: 5 min (mismo orden de magnitud que el JWT). */
  private readonly idleMs = 5 * 60 * 1000;

  /** Refresco del access token ~45 s antes de expirar (JWT 5 min en API). */
  private readonly refreshSkewMs = 45_000;

  login(username: string, password: string): Observable<{ ok: true } | { ok: false; reason: string }> {
    const body = { username: username.trim(), password };
    return this.http.post<BaseResponse<LoginResponseData>>(buildApiUrl(API_PATHS.login), body).pipe(
      map((response) => {
        if (response.succeeded && response.data) {
          this.persistSession({
            username: username.trim(),
            token: response.data.token,
            refreshToken: response.data.refreshToken,
          });
          this.bootstrapSessionWatchers();
          return { ok: true as const };
        }
        return { ok: false as const, reason: response.message || 'No se pudo iniciar sesión' };
      }),
      catchError((error) =>
        of({
          ok: false as const,
          reason: error.error?.message || error.message || 'Error de conexión',
        }),
      ),
    );
  }

  logout(): void {
    this.teardownSessionWatchers();
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    void this.router.navigate(['/login']);
  }

  snapshot(): AuthSessionSnapshot | null {
    try {
      const raw = sessionStorage.getItem(AUTH_SESSION_KEY);
      if (!raw) return null;
      const o = JSON.parse(raw) as Partial<AuthSessionSnapshot>;
      if (typeof o.token === 'string' && typeof o.refreshToken === 'string' && typeof o.username === 'string') {
        return { username: o.username, token: o.token, refreshToken: o.refreshToken };
      }
      return null;
    } catch {
      return null;
    }
  }

  getAccessToken(): string | null {
    return this.snapshot()?.token ?? null;
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  roleClaim(): string | null {
    const token = this.getAccessToken();
    if (!token) return null;
    const payload = AuthService.decodeJwt(token);
    if (!payload) return null;
    const raw = payload['role'] ?? payload[JWT_ROLE_CLAIM];
    if (raw === undefined || raw === null) return null;
    return String(raw);
  }

  isAdmin(): boolean {
    return this.roleClaim() === '1';
  }

  isVoter(): boolean {
    return this.roleClaim() === '2';
  }

  displayName(): string {
    return this.snapshot()?.username ?? 'guest';
  }

  /** Llama antes de JWT exp (~45 s) para renovar sesión sin interrupciones. */
  bootstrapSessionWatchers(): void {
    this.teardownSessionWatchers();
    if (!this.isAuthenticated()) return;
    for (const ev of ['click', 'keydown', 'mousemove']) {
      document.addEventListener(ev, this.boundIdleReset, { passive: true });
    }
    this.resetIdleTimer();
    this.scheduleJwtRefresh();
  }

  teardownSessionWatchers(): void {
    if (this.idleTimer !== null) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    if (this.jwtTimer !== null) {
      clearTimeout(this.jwtTimer);
      this.jwtTimer = null;
    }
    for (const ev of ['click', 'keydown', 'mousemove']) {
      document.removeEventListener(ev, this.boundIdleReset);
    }
  }

  touchActivity(): void {
    if (this.isAuthenticated()) this.resetIdleTimer();
  }

  refreshTokens(): Observable<boolean> {
    if (this.refreshInFlight) return this.refreshInFlight;

    const snap = this.snapshot();
    if (!snap?.token || !snap.refreshToken) return of(false);

    this.refreshInFlight = this.httpDirect
      .post<BaseResponse<LoginResponseData>>(buildApiUrl(API_PATHS.refresh), {
        token: snap.token,
        refreshToken: snap.refreshToken,
      })
      .pipe(
        map((response) => {
          if (!response.succeeded || !response.data) return false;
          this.persistSession({
            username: snap.username,
            token: response.data.token,
            refreshToken: response.data.refreshToken,
          });
          this.scheduleJwtRefresh();
          return true;
        }),
        catchError(() => of(false)),
        finalize(() => {
          this.refreshInFlight = null;
        }),
        shareReplay(1),
      );

    return this.refreshInFlight;
  }

  private persistSession(snapshot: AuthSessionSnapshot): void {
    sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(snapshot));
  }

  private resetIdleTimer(): void {
    if (this.idleTimer !== null) clearTimeout(this.idleTimer);
    if (!this.isAuthenticated()) return;
    this.idleTimer = setTimeout(() => {
      this.logout();
    }, this.idleMs);
  }

  private scheduleJwtRefresh(): void {
    if (this.jwtTimer !== null) {
      clearTimeout(this.jwtTimer);
      this.jwtTimer = null;
    }
    const token = this.getAccessToken();
    if (!token) return;

    const expMs = AuthService.jwtExpiryMs(token);
    if (!expMs) return;

    let delay = expMs - Date.now() - this.refreshSkewMs;
    if (delay < 3_000) delay = 3_000;

    this.jwtTimer = setTimeout(() => {
      void firstValueFrom(this.refreshTokens()).then((ok) => {
        if (!ok) this.logout();
      });
    }, delay);
  }

  static decodeJwt(token: string): Record<string, unknown> | null {
    try {
      const part = token.split('.')[1];
      if (!part) return null;
      const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
      return JSON.parse(atob(padded)) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  static jwtExpiryMs(token: string): number | null {
    const payload = AuthService.decodeJwt(token);
    const exp = payload?.['exp'];
    if (typeof exp === 'number') return exp * 1000;
    if (typeof exp === 'string') {
      const n = Number(exp);
      return Number.isFinite(n) ? n * 1000 : null;
    }
    return null;
  }
}
