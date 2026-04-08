# Estado Actual

## Arquitectura

- Monorepo con 2 proyectos desacoplados:
  - `backend-freeler/backend`: API REST con NestJS, TypeORM y PostgreSQL (schema `freeler`).
  - `frontend-freeler/frontend`: SPA React + Vite + TypeScript para modulos CRM y Referidos.
- El frontend consume API por variable `VITE_API_URL`.
- El backend organiza modulos por dominio (`auth`, `leads`, `campanas`, `comisiones`, `usuarios-*`, `empresas`, `roles`, `documentos`, `ia-config`).

## Reglas de Negocio Implementadas (alto nivel)

- Autenticacion separada por perfiles de negocio:
  - Flujo Freeler/Referidos.
  - Flujo Empresa/CRM.
- Gestion de leads con estados, asignaciones y trazabilidad.
- Campanas con fechas de vigencia y metrica asociada.
- Comisiones con calculo, solicitud y flujo de pago.
- Control de acceso por roles para rutas y operaciones de CRM.

## Esquema BD (resumen funcional)

Schema objetivo: `freeler` (PostgreSQL).

Entidades principales detectadas en codigo:

- `usuario_freeler`
- `usuario_empresa`
- `rol`
- `empresa`
- `lead`
- `estado_lead`
- `asignacion`
- `campana`
- `comision`
- `estado_comision`
- `comision_solicitud`
- `ia_config`

Migraciones SQL versionadas en:

- `backend-freeler/backend/src/database/migrations`

## Despliegue

- Frontend desplegable en Vercel desde `frontend-freeler/frontend`.
- Backend desplegable en Vercel desde `backend-freeler/backend` con entrypoint serverless `api/index.ts`.
