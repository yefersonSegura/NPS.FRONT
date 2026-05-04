import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { buildApiUrl } from '../../../../common/config/build-api-url';
import { BaseResponse } from '../../../../common/models/base-response.model';
import { API_PATHS } from '../../../../core/api/api-paths';

export type VoteOutcome =
  | { readonly ok: true; readonly message: string }
  | { readonly ok: false; readonly reason: string; readonly status?: number };

@Injectable({ providedIn: 'root' })
export class VoteService {
  private readonly http = inject(HttpClient);

  submitVote(score: number): Observable<VoteOutcome> {
    return this.http.post<BaseResponse<null>>(buildApiUrl(API_PATHS.vote), { score }).pipe(
      map((response) =>
        response.succeeded
          ? ({ ok: true, message: response.message || 'Voto registrado' } as const)
          : ({
              ok: false as const,
              reason: response.message || 'No se pudo votar',
              status: response.statusCode,
            }),
      ),
      catchError((err: HttpErrorResponse) =>
        of({
          ok: false as const,
          reason:
            typeof err.error === 'object' && err.error && 'message' in err.error
              ? String((err.error as { message?: string }).message ?? err.message)
              : err.message || 'Error de red',
          status: err.status,
        }),
      ),
    );
  }
}
