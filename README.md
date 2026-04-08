# Freeler Monorepo

Repositorio raiz con frontend y backend en subcarpetas separadas.

## Estructura

- `frontend-freeler/frontend`: SPA React + Vite
- `backend-freeler/backend`: API NestJS + TypeORM + PostgreSQL
- `context/`: documentacion viva de arquitectura, reglas y roadmap

## Requisitos

- Node.js 18+
- npm 9+

## Ejecucion local

### Frontend

```bash
cd frontend-freeler/frontend
npm install
npm run dev
```

### Backend

```bash
cd backend-freeler/backend
npm install
npm run start:dev
```

## Despliegue en Vercel por subcarpeta

Puedes mantener todo en este mismo repo y desplegar por separado.

### Opcion A: Frontend

- En Vercel crea un proyecto apuntando a este repo.
- En `Root Directory` selecciona `frontend-freeler/frontend`.
- El `vercel.json` local ya define build de Vite y rewrite SPA.

### Opcion B: Backend

- En Vercel crea otro proyecto apuntando al mismo repo.
- En `Root Directory` selecciona `backend-freeler/backend`.
- El `vercel.json` local enruta todo a `api/index.ts` (NestJS en modo serverless).

## Verificaciones recomendadas antes de commit

```bash
cd frontend-freeler/frontend && npm run lint && npm run build
cd backend-freeler/backend && npm run lint && npm run build
```

## Documentacion de contexto

- `context/estado-actual.md`
- `context/plan-detallado.md`
- `context/ideas.md`
