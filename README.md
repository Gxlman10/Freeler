# Freeler Monorepo (uso interno)

Repositorio raíz que agrupa los dos proyectos de la plataforma Freeler:

- `backend-freeler/backend`: API REST (NestJS + TypeORM + PostgreSQL).  
- `frontend-freeler/frontend`: SPA CRM/Referidos (React + Vite + TypeScript).

La rama activa de trabajo es **`dev`**. Todo desarrollo parte desde allí y se integra mediante PRs.

---

## 1. Requisitos básicos

| Herramienta  | Versión mínima | Notas                                                    |
| ------------ | -------------- | -------------------------------------------------------- |
| Node.js      | v18 LTS        | Recomendado usar nvm.                                    |
| npm          | v9             | Se instala junto con Node.                               |
| PostgreSQL   | v14            | En dev solemos apuntar al mismo RDS compartido de AWS.   |

Estructura general del monorepo:

```
Freeler/
├─ backend-freeler/backend   # API NestJS
└─ frontend-freeler/frontend # SPA React
```

---

## 2. Backend (NestJS)

### 2.1 Instalación
```bash
cd backend-freeler/backend
npm install
cp .env.example .env.local   # o .env.development, según corresponda
```

### 2.2 Variables clave

| Variable           | Descripción                                                    | Ejemplo                                        |
| ------------------ | -------------------------------------------------------------- | ---------------------------------------------- |
| `DB_HOST`, etc.    | Credenciales de PostgreSQL (local o RDS).                      | `freeler-db.xxx.us-east-1.rds.amazonaws.com`   |
| `CORS_ORIGINS`     | Lista de orígenes permitidos (separados por coma).             | `https://crm.freeler.com,http://localhost:5173` |
| `IA_CONFIG_SECRET` | Clave para cifrar la API Key del coach IA.                     | `freeler_dev_secret`                           |
| `JWT_SECRET`       | Llave para firmar JWT.                                         | `openssl rand -hex 32`                         |
| `JWT_EXPIRES_IN`   | Duración del token. Acepta segundos (`3600s`) u horas (`8h`).  | `8h`                                           |

> El config (`src/shared/infrastructure/config/jwt.config.ts`) convierte formatos en horas a segundos y usa **8 horas** por defecto si la variable no está definida.

### 2.3 Scripts

| Script                  | Descripción                                                 |
| ----------------------- | ----------------------------------------------------------- |
| `npm run start:dev`     | API en modo watch (Hot Reload).                             |
| `npm run build`         | Compila a `dist/`.                                          |
| `npm run lint`          | ESLint.                                                     |
| `npm run migration:run` | Ejecuta migraciones TypeORM (`src/typeorm.config.ts`).      |

### 2.4 Datos de prueba

```bash
# Registrar empresa + admin
curl -X POST "$API_URL/auth/empresa/register" \
  -H "Content-Type: application/json" \
  -d '{ "nombre_empresa": "Empresa Demo SAC", "ruc": "20601234567", "email": "admin@demo.com", "password": "Admin123", "telefono": "+51999999999" }'

# Registrar usuario freeler
curl -X POST "$API_URL/usuarios-freeler/register" \
  -H "Content-Type: application/json" \
  -d '{ "nombres": "Andrea", "apellidos": "Rojas", "dni": "71384562", "email": "andrea@demo.com", "password": "Freeler123" }'
```

---

## 3. Frontend (React + Vite)

### 3.1 Instalación
```bash
cd frontend-freeler/frontend
npm install
cp .env.example .env.local   # revisar README específico si cambia
```

Variables comunes (`VITE_*`):

| Variable              | Descripción                                   | Ejemplo                           |
| --------------------- | --------------------------------------------- | --------------------------------- |
| `VITE_API_BASE_URL`   | Endpoint base del backend.                     | `https://api.dev.freeler.com`     |
| `VITE_STORAGE_PREFIX` | Prefijo para claves en LocalStorage/Session.  | `freeler_dev_`                    |

Scripts principales:

| Script           | Descripción                          |
| ---------------- | ------------------------------------ |
| `npm run dev`    | Vite + HMR en `http://localhost:5173`|
| `npm run build`  | Genera `dist/`.                      |
| `npm run lint`   | ESLint.                              |

---

## 4. Flujo de trabajo

1. Crear rama feature/fix desde `dev`.
2. Mantener sincronizados los contratos Front/Back (`src/services` vs DTOs).
3. Ejecutar `npm run lint` y `npm run build` en ambos proyectos antes de abrir PR.
4. Documentar ajustes relevantes en `docs/Requerimientos 22-11.txt` o `docs/Prompts.txt`.
5. Fusionar en `dev`, luego preparar despliegue (QA/Prod).

---

## 5. Troubleshooting rápido

- **Tokens expiran muy rápido:** revisar `JWT_EXPIRES_IN`. Se pueden usar valores como `12h`. Si no está definido, se usan 8 horas.
- **CORS bloquea peticiones:** confirmar que el dominio está en `CORS_ORIGINS` y reiniciar el backend.
- **Migraciones no aplican:** usar `npm run migration:run` (TypeORM) o ejecutar los scripts SQL en `backend/src/database/migrations` si son manuales.
- **IA Coach no guarda clave:** requerimos `IA_CONFIG_SECRET`; sin esa variable la llave no se cifra.

---

## 6. Referencias internas

- `docs/Requerimientos 22-11.txt`: backlog + pedidos del cliente.
- `docs/Prompts.txt`: contexto UI/UX y ajustes de pantalla.
- `shared/permissions.config.ts`: permisos de navegación por rol en el frontend.

> Este README es sólo para uso interno del equipo Freeler.
