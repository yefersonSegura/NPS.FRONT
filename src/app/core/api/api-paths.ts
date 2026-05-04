/**
 * Rutas reales de la API (origen + estas rutas).
 * Homologadas con el backend Nps.Api (`Auth`, `Survey`, `Admin`).
 * Equivalencia enunciado: login ≈ /auth/login, voto ≈ /vote, NPS ≈ /nps.
 */
export const API_PATHS = {
  login: 'api/Auth/Login',
  refresh: 'api/Auth/refresh',
  vote: 'api/Survey/vote',
  nps: 'api/Admin/results',
} as const;
