import { environment } from '../../../environments/environment';

/**
 * Construye la URL absoluta hacia la API ASP.NET Core.
 *
 * {@link environment.apiUrl} debe ser **solo el origen** (`https://api.dominio.com` o `https://localhost:7070`),
 * **sin** `/api` final: las rutas ya empiezan por `api/...`.
 */
export function buildApiUrl(relativePath: string): string {
  const base = environment.apiUrl.replace(/\/+$/, '');
  const path = relativePath.replace(/^\/+/, '');
  return `${base}/${path}`;
}
