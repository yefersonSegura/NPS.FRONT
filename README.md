# Omega — cliente NPS (Angular 20 · DEV-001)

SPA standalone para consumir la API del ejercicio NPS. Repo hermano del backend (mismo caso DEV-001): levantá la API antes o las peticiones fallarán por red.

**Autor:** [Yeferson Segura](https://yefersonsegura.com/)

---

## Requisitos

- Node.js **LTS** (compatible con Angular 20; típ. 20.x u 22.x)
- Backend NPS ejecutándose según ese repo (`https://localhost:7070` o `http://localhost:5140` según perfil HTTPS/HTTP).

## Instalación y desarrollo

```bash
npm install
npm start
# equivale a ng serve → http://localhost:4200
```

---

## Cliente Omega (Angular)

**Omega** aquí es el **Angular 20** del DEV-001, **hecho por mí**. Este repo describe **solo este cliente web**: rutas SPA, HTTPS hacia la API, auth y tema NPS.

## Más de mi lado (contexto; no forma parte del código que corre esta SPA)

Implementé **Omega Architecture para Flutter** como enfoque de estructura de proyecto y flujos Dart. Además trabajo en **[AbeyJS](https://abeyjs-fm.github.io/AbeyJS/)** (documentación oficial), framework todavía **en fase experimental** (interfaces y compatibilidad pueden cambiar hasta que lo estabilice).

---

Instalación y `ng serve` en este directorio (`npsApp`). Para que cargue datos, **antes tiene que existir esta API**.

`environment.development.ts`: **`apiUrl`** es solo el **origen** (`https://localhost:7070` o `http://localhost:5140`), **sin** sufijo `/api`. Las rutas relativas están centralizadas en `src/app/core/api/api-paths.ts`.

### HTTP que realmente llamamos

| Acción | Método | Ruta (tras `apiUrl`) | Body | Authorization |
|--------|--------|----------------------|------|----------------|
| Login | POST | `api/Auth/Login` | `username`, `password` | Ninguna |
| Refresh | POST | `api/Auth/refresh` | `token`, `refreshToken` | Ninguna |
| Voto | POST | `api/Survey/vote` | `score` (0–10) | Bearer; rol `2` (votante) |
| NPS | GET | `api/Admin/results` | — | Bearer; rol `1` (admin) |

ASP.NET resuelve rutas sin pelearse por mayúsculas; en el front dejé los paths alineados con los nombres de controlador.

**Roles:** en BD y en `Authorize(Roles = "1"|"2")` son strings. El Angular lee el claim de rol (incluida la URI larga de `ClaimTypes.Role` por si el token la trae así).

**SPA:** `/login` público; `/home/dashboard` admin; `/home/vote` votante; `/home` redirige según rol. **Interceptor:** adjunta JWT y, ante `401`, intenta refresh una vez con `HttpBackend` para no enredar con el propio interceptor.

---

## Mapa rápido del código

- `src/app/features/auth/` — login y `AuthService` (idle ~5 min + refresh programado).
- `src/app/features/nps/vote/` y `features/nps/results/` — voto y dashboard.
- `src/app/core/guards/auth.guards.ts` — `authGuard`, `adminGuard`, `voterGuard`.
- `src/app/common/http/auth-interceptor.fn.ts` — Bearer + refresh.

## Build de producción

```bash
npx ng build --configuration production
```

Salida en `dist/npsApp/`.

## Tests unitarios (Karma)

```bash
ng test
```

---

## Recursos Angular CLI

Scaffolding y referencia de comandos: [Angular CLI](https://angular.dev/tools/cli).
