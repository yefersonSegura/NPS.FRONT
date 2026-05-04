# Omega — NPS (Angular 20 · DEV-001)

Cliente **SPA** (**standalone components**, Angular 20) que consume la **API REST** del ejercicio DEV-001 (.NET + SQL Server publicada en **NPS.API**). El flujo de trabajo en local es obligatoriamente **backend primero, front después**: sin API en marcha no hay datos ni autenticación válida.

| Componente | Repositorio |
|------------|-------------|
| Esta aplicación (Omega) | [NPS.FRONT](https://github.com/yefersonSegura/NPS.FRONT) |
| API (.NET 10) | [NPS.API](https://github.com/yefersonSegura/NPS.API) |

**Mantenimiento y autoría:** [Yeferson Segura](https://yefersonsegura.com/)

---

## Requisitos previos

- **Node.js** LTS recomendado para Angular 20 (p. ej. 20.x / 22.x) y **npm** acoplado.
- **API NPS** ejecutándose contra una instancia de SQL Server donde ya se hayan aplicado `InitialSchema.sql` y `SeedData.sql` (consultar el README de **NPS.API**). URLs habituales según `launchSettings`:
  - HTTPS: `https://localhost:7070`
  - HTTP: `http://localhost:5140`

---

## Puesta en marcha (front)

```bash
npm install
npm start
```

Equivale a `ng serve` con el host por defecto (`http://localhost:4200`). Asegurarse de que **CORS** en la API permita el origen del `ng serve` (típicamente `http://localhost:4200` / `https://localhost:4200`).

---

## Configuración contra la API

- Archivo clave: **`src/environments/environment.development.ts`** (y `environment.ts` para producción).
- **`apiUrl`** debe contener **únicamente el origen** del backend (esquema + host + puerto), **sin** path `/api`.
- Las rutas relativas de negocio están centralizadas en **`src/app/core/api/api-paths.ts`** para no duplicar strings en servicios.

Ejemplo de desarrollo si el API corre con perfil HTTPS estándar:

```ts
export const environment = {
  production: false,
  apiUrl: 'https://localhost:7070',
};
```

---

## Contrato HTTP utilizado

Todas las peticiones se resuelven concatenando `environment.apiUrl` + ruta de la tabla.

| Operación | Método | Ruta (relativa) | Cuerpo JSON | Autorización |
|-----------|--------|-----------------|-------------|---------------|
| Login | `POST` | `api/Auth/Login` | `username`, `password` | Ninguna |
| Refresh | `POST` | `api/Auth/refresh` | `token`, `refreshToken` | Ninguna |
| Voto | `POST` | `api/Survey/vote` | `score` (0–10) | Bearer JWT; rol **2** (votante) |
| Resultados NPS | `GET` | `api/Admin/results` | — | Bearer JWT; rol **1** (admin) |

El servidor serializa respuestas envolventes en **camelCase** (`succeeded`, `data`, `message`, `statusCode`, etc.), alineado con lo que consumen los servicios.

Las rutas MVC de ASP.NET Core suelen ser **insensibles a mayúsculas**; en el cliente se mantienen convenciones próximas a los nombres de controlador por legibilidad.

**Roles JWT:** en la API llegan como **`ClaimTypes.Role`** numérico `"1"` / `"2"`. El cliente decodifica el payload y acepta tanto el claim corto `role` como la URI larga de `ClaimTypes.Role` para máxima compatibilidad.

---

## Autenticación, sesión y rutas

- **Rutas:** `login` pública; rutas bajo `home` con `authGuard`. `home/dashboard` protegida por **admin** (`1`); `home/vote` por **votante** (`2`); `home` redirige según el rol del token.
- **Interceptor funcional** (`auth-interceptor.fn.ts`): inyecta cabecera **Authorization: Bearer** y, ante **401**, intenta **un** refresh mediante `HttpBackend` (evita bucles con el mismo interceptor) y reintenta la petición original cuando procede.
- **Inactividad:** `AuthService` expulsa la sesión tras **~5 minutos** sin actividad registrada (listeners en `document`); es independiente pero coherente en magnitud con la expiración corta del JWT en la API (~5 min).

---

## Organización del código (útil para revisión)

| Ruta | Responsabilidad |
|------|----------------|
| `src/app/features/auth/` | Pantalla de login, `AuthService`, persistencia en `sessionStorage`. |
| `src/app/features/nps/vote/` | Flujo de votación y `VoteService`. |
| `src/app/features/nps/results/` | Dashboard NPS y `NpsService` (mapeo defensivo camelCase/PascalCase). |
| `src/app/features/shell/` | Layout con navegación y `home-redirect`. |
| `src/app/core/guards/` | `loginPageGuard`, `authGuard`, `adminGuard`, `voterGuard`. |
| `src/app/common/http/` | Interceptor JWT + refresh. |
| `src/app/core/api/api-paths.ts` | Constantes de paths de la API. |

---

## Build de producción

```bash
npx ng build --configuration production
```

Artefactos en **`dist/npsApp/`**. Ajustar `environment.ts` con el origen real del API desplegado.

---

## Pruebas unitarias

```bash
ng test
```

Proyecto configurado con **Karma / Jasmine** por defecto del workspace angular.json.

---

## Contexto adicional (fuera de este repositorio)

- **Omega Architecture (Flutter):** guía de capas y estructura aplicada a apps Dart.
- **[AbeyJS](https://abeyjs-fm.github.io/AbeyJS/):** proyecto de framework en estado **experimental** (API y compatibilidad pueden evolucionar).

No afectan al runtime de esta SPA; constan como línea de trabajo del autor.

---

## Referencia CLI

Documentación oficial de herramientas y generación de código: [Angular CLI](https://angular.dev/tools/cli).
