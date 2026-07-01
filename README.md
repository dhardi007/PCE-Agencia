<p align="center">
  <img src="https://em-content.zobj.net/source/apple/391/airplane_2708-fe0f.png" width="80" />
</p>

<h1 align="center">PCE-Agencia</h1>

<p align="center">
  <b>✨ Sistema Integral de Gestión para Agencias de Viajes ✨</b><br/>
  <i>Porque cada destino merece un sistema que vuele tan alto como tus clientes</i>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-6-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Prisma-6-2D3748?style=for-the-badge&logo=prisma&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
</p>

---

## 🧠 ¿Qué es PCE-Agencia?

**PCE** *(Proyecto Casos de Estudio)* es un sistema full-stack para la gestión operativa de una agencia de viajes. Combina un **backend REST API** con un **dashboard frontend moderno** en React + TypeScript.

> *"Tu agencia, sistematizada."*

---

## 🗺️ Stack Tecnológico

| Capa | Tecnología | Propósito |
|------|-----------|-----------|
| **Runtime** | Node.js 20 | Entorno de ejecución |
| **Backend** | Express 4.x + TypeScript | API REST |
| **Base de Datos** | PostgreSQL 16 | Persistencia de datos |
| **ORM** | Prisma 6 | Modelado y consultas |
| **Autenticación** | JWT + bcryptjs | Seguridad de sesiones |
| **Frontend** | React 19 + TypeScript | Dashboard SPA |
| **Build** | Vite 8 | Bundler y dev server |
| **Estilos** | Tailwind CSS 3.4 | Diseño responsive |
| **Contenedores** | Docker + Compose | Entorno reproducible |
| **CI/CD** | GitHub Actions | Integración continua |

---

## 🚀 Arranque Rápido

### Con Docker (recomendado)

```bash
docker compose up --build
```

Abre **http://localhost:5173** y listo. ✈️

### Sin Docker (desarrollo local)

```bash
# 1. PostgreSQL (Docker)
docker run -d --name pce-pg -e POSTGRES_DB=pce_agencia -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16-alpine

# 2. Backend
cd server
cp .env.example .env   # Ajustar DATABASE_URL si es necesario
npm install
npx prisma generate
npm run dev

# 3. Frontend
cd client
npm install
npm run dev
```

Abre **http://localhost:5173**.

### 🔑 Credenciales de Demo

| Campo    | Valor           |
|----------|-----------------|
| Email    | `admin@pce.com` |
| Password | `admin123`      |

---

## 📁 Estructura del Proyecto

```
PCE-Agencia/
├── docker-compose.yml       ← Orquestación Docker
├── .github/workflows/       ← CI/CD (GitHub Actions)
│
├── server/                  ← ⚙️ Backend API
│   ├── Dockerfile
│   ├── prisma/              ← Schema + migraciones
│   └── src/
│       ├── index.ts         ← Entry point
│       ├── seed.ts          ← Datos de demo
│       ├── routes/          ← 7 endpoints REST
│       ├── middleware/      ← Auth + seguridad
│       └── lib/             ← Prisma client
│
└── client/                  ← 🌐 Frontend React
    ├── Dockerfile
    └── src/
        ├── pages/           ← Landing, Login, Dashboard + 7 CRUD pages
        ├── components/      ← UI (Button, Input, Card)
        ├── layout/          ← DashboardLayout con sidebar
        ├── context/         ← AuthContext
        ├── store/           ← Zustand stores
        └── services/        ← Axios API client
```

---

## 🧪 Tests

```bash
cd server
npm test
```

---

## 🛣️ API Endpoints

### Autenticación
```
POST   /api/auth/login       ← Iniciar sesión
POST   /api/auth/register    ← Registrar usuario
POST   /api/auth/refresh     ← Refrescar JWT
POST   /api/auth/logout      ← Cerrar sesión
```

### CRUD (clientes, proveedores, itinerarios, reservas, transacciones, facturas)
```
GET    /api/:recurso          ← Listar
POST   /api/:recurso          ← Crear
GET    /api/:recurso/:id      ← Obtener
PUT    /api/:recurso/:id      ← Actualizar
DELETE /api/:recurso/:id      ← Eliminar
```

---

## 🔄 Flujo CI/CD

Cada PR a `main` ejecuta:

1. ✅ **TypeScript check** (backend + frontend)
2. ✅ **Lint** (oxlint en frontend)
3. ✅ **Unit tests** (vitest en backend)
4. ✅ **Build** (Vite en frontend)

---

<p align="center">
  <i>Hecho con ☕ y ganas de volar alto</i><br/>
  <b>PCE-Agencia</b> — Tu agencia, sistematizada.
</p>
