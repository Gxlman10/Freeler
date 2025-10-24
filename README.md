# Freeler Monorepo

Monorepo con dos proyectos principales:

- **backend-freeler/backend**: API REST construida con NestJS + TypeORM (PostgreSQL).
- **frontend-freeler/frontend**: SPA con React, TypeScript y Vite.

La rama activa de desarrollo es `dev`.

## Requisitos

- Node.js 18 LTS o superior
- npm 9+
- PostgreSQL 14+ (local o administrado en AWS RDS)

## Estructura

```
Freeler/
+- backend-freeler/
   +- backend/
+- frontend-freeler/
   +- frontend/
```

## Backend (NestJS)

1. Instalar dependencias:
   ```bash
   cd backend-freeler/backend
   npm install
   ```
2. Configurar variables de entorno (`.env`):
   ```env
   DATABASE_HOST=freeler-db.xxxxxx.region.rds.amazonaws.com
   DATABASE_PORT=5432
   DATABASE_NAME=freeler_db
   DATABASE_USER=freeler_app
   DATABASE_PASSWORD=********
   JWT_SECRET=freeler-super-secret
   JWT_EXPIRES_IN=1d
   ```
   - Para ejecutar contra AWS RDS reemplaza host, usuario y password con las credenciales entregadas.
   - `JWT_SECRET` puede generarse con `openssl rand -hex 32`.
3. Ejecutar en desarrollo:
   ```bash
   npm run start:dev
   ```
   Por defecto expone Swagger en `http://localhost:3000/api`.

### Crear datos de prueba

Puedes registrar una empresa (rol Admin) y un usuario freeler ejecutando las siguientes peticiones contra el backend:

```bash
# Empresa + usuario ADMIN
curl -X POST "$API_URL/auth/empresa/register" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre_empresa": "Empresa Demo SAC",
    "ruc": "20601234567",
    "email": "admin@demo.com",
    "password": "Admin123",
    "telefono": "+51999999999"
  }'

# Usuario Freeler
curl -X POST "$API_URL/usuarios-freeler/register" \
  -H "Content-Type: application/json" \
  -d '{
    "nombres": "Andrea",
    "apellidos": "Rojas",
    "dni": "71384562",
    "email": "andrea@demo.com",
    "password": "Freeler123"
  }'
```

Si necesitas crear registros manualmente desde `psql`, asegurate de hashear la contraseña con `bcrypt` (`bcrypt('$PASSWORD', 10)`).

## Frontend (React + Vite)

1. Instalar dependencias:
   ```bash
   cd frontend-freeler/frontend
   npm install
   ```
2. Configurar `.env.local` (ver README del frontend para más detalles).
3. Levantar en desarrollo:
   ```bash
   npm run dev
   ```
4. Build de producci�n:
   ```bash
   npm run build
   ```

## Scripts comunes

| Directorio                     | Comando            | Descripci�n                              |
| ------------------------------ | ------------------ | ---------------------------------------- |
| `backend-freeler/backend`      | `npm run start:dev`| API en modo watch                        |
|                                | `npm run build`    | Compila NestJS a `dist/`                 |
|                                | `npm run lint`     | Ejecuta ESLint                           |
| `frontend-freeler/frontend`    | `npm run dev`      | Vite con HMR                             |
|                                | `npm run build`    | Genera bundle en `dist/`                 |
|                                | `npm run lint`     | Ejecuta ESLint                           |

## Buenas pr�cticas

- Trabaja siempre sobre la rama `dev` y abre pull requests para integrar cambios.
- Mant�n sincronizados los contratos entre servicios (`src/services/*.ts` en el frontend, DTOs en el backend).
- Usa las utilidades en `src/utils` para validaciones y constantes compartidas.
- Ejecuta `npm run build` en backend y frontend antes de desplegar.
