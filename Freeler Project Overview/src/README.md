# Freeler - Frontend

Frontend de la plataforma Freeler construido con React, Vite y TypeScript.

## Características

- **Autenticación JWT**: Sistema de login diferenciado para Empresas y Freelers
- **React Router**: Navegación con protección de rutas por tipo de usuario
- **React Query**: Gestión de estado del servidor con caché inteligente
- **Axios**: Cliente HTTP con interceptores para autenticación y manejo de errores
- **Dark Mode**: Interfaz optimizada para modo oscuro
- **Diseño Responsivo**: Compatible con dispositivos móviles y desktop

## Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── base/           # Componentes UI base (Button, EmptyState, etc.)
│   └── ui/             # Componentes ShadCN
├── pages/              # Páginas de la aplicación
│   ├── auth/           # Páginas de autenticación
│   ├── freeler/        # Páginas superficie Freeler
│   └── empresa/        # Páginas superficie Empresa
├── services/           # Servicios de API
├── utils/              # Utilidades (auth, formatters)
├── lib/                # Configuración de librerías
└── styles/             # Estilos globales
```

## Configuración

1. Copiar `.env.example` a `.env`:
```bash
cp .env.example .env
```

2. Configurar la URL del backend:
```env
VITE_API_BASE_URL=http://localhost:3000
```

## Desarrollo

```bash
npm install
npm run dev
```

## Rutas Principales

### Públicas
- `/` - Landing page
- `/auth/empresa` - Login empresas
- `/auth/freeler` - Login freelers

### Freeler (requiere auth tipo 'freeler')
- `/freeler` - Dashboard
- `/freeler/leads` - Mis leads
- `/freeler/leads/new` - Crear lead
- `/freeler/campanas` - Ver campañas

### Empresa (requiere auth tipo 'empresa')
- `/empresa` - Dashboard con estadísticas
- `/empresa/leads` - Gestión de leads con filtros
- `/empresa/campanas` - Gestión de campañas
- `/empresa/comisiones` - Gestión de comisiones

## Sistema de Diseño

### Colores
- Primary: `#2563eb`
- Secondary: `#0ea5e9`
- Success: `#16a34a`
- Warning: `#f59e0b`
- Danger: `#dc2626`

### Tokens CSS
Los tokens están definidos en `/styles/globals.css`:
- `--color-primary`, `--color-secondary`, etc.
- `--color-bg`, `--color-surface`, `--color-text`
- `--radius-sm`, `--radius-md`, `--radius-lg`

## Integración con Backend

El frontend está configurado para consumir la API REST del backend con Swagger en `http://localhost:3000/api`.

### Autenticación
- Token JWT almacenado en `localStorage` como `access_token`
- Interceptor de Axios agrega automáticamente el header `Authorization: Bearer <token>`
- Renovación automática en caso de 401 (sesión expirada)

### Manejo de Errores
Los errores del backend se mapean a mensajes amigables mediante el interceptor de respuesta en `/src/lib/api.ts`.
