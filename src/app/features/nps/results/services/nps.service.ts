import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { buildApiUrl } from '../../../../common/config/build-api-url';
import { BaseResponse } from '../../../../common/models/base-response.model';
import { API_PATHS } from '../../../../core/api/api-paths';

import type { NpsResultsDto } from '../models/nps-results.models';

export type NpsResultsOutcome =
  | { readonly ok: true; readonly data: NpsResultsDto }
  | { readonly ok: false; readonly reason: string; readonly status?: number };

/** Acepta JSON camelCase o PascalCase (API antigua). */
function mapNpsDto(raw: unknown): NpsResultsDto | null {
  if (raw === null || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const num = (camel: string, pascal: string): number => {
    const v = o[camel] ?? o[pascal];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  const int = (camel: string, pascal: string): number => Math.trunc(num(camel, pascal));
  return {
    npsScore: num('npsScore', 'NpsScore'),
    promotersPercentage: num('promotersPercentage', 'PromotersPercentage'),
    detractorsPercentage: num('detractorsPercentage', 'DetractorsPercentage'),
    passivesPercentage: num('passivesPercentage', 'PassivesPercentage'),
    totalResponses: int('totalResponses', 'TotalResponses'),
  };
}

@Injectable({ providedIn: 'root' })
export class NpsService {
  private readonly http = inject(HttpClient);

  getResults(): Observable<NpsResultsOutcome> {
    return this.http.get<BaseResponse<NpsResultsDto>>(buildApiUrl(API_PATHS.nps)).pipe(
      map((response) => {
        const body = response as BaseResponse<NpsResultsDto> & {
          Data?: unknown;
          Succeeded?: boolean;
        };
        const succeeded = body.succeeded ?? body.Succeeded ?? false;
        const rawData = body.data ?? body.Data;
        const data = mapNpsDto(rawData);
        if (succeeded && data !== null) {
          return { ok: true, data } as const;
        }
        return {
          ok: false as const,
          reason: body.message || 'No se pudieron obtener los resultados',
          status: body.statusCode,
        };
      }),
      catchError((err: HttpErrorResponse) =>
        of({
          ok: false as const,
          reason: err.error?.message || err.message || 'Error de red',
          status: err.status,
        }),
      ),
    );
  }
}
