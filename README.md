# Freeler 🚀

Monorepo con **NestJS** para el backend y **React + Vite** para el frontend.  
La rama principal de trabajo es `dev`.

---

## 📂 Estructura del proyecto

Freeler/
├── backend-freeler/
│ └── backend/ # API REST con NestJS
│
└── frontend/ # Aplicación web con React + Vite

yaml
Copiar código

---

## ⚙️ Requisitos

- [Node.js](https://nodejs.org/) >= 18.x
- npm (se recomienda usar npm en este repo)

---

## ▶️ Levantar el proyecto

### 🔹 Backend (NestJS)

1. Entrar a la carpeta del backend:
   ```bash
   cd backend-freeler/backend
Instalar dependencias:

bash
Copiar código
npm install
Levantar en modo desarrollo:

bash
Copiar código
npm run start:dev
👉 Por defecto corre en http://localhost:3000.

🔹 Frontend (React + Vite)
Entrar a la carpeta del frontend:

bash
Copiar código
cd frontend
Instalar dependencias:

bash
Copiar código
npm install
Levantar en modo desarrollo:

bash
Copiar código
npm run dev
👉 Por defecto corre en http://localhost:5173.

🌳 Ramas de trabajo
main → rama protegida (solo para versiones estables).

dev → rama de desarrollo donde se integran cambios.

👥 Colaboradores
Clonar el repo:

bash
Copiar código
git clone <URL_DEL_REPO>
cd Freeler
Cambiar a la rama dev:

bash
Copiar código
git checkout dev
Seguir las instrucciones de Backend y Frontend para instalar dependencias.