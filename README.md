# ✏️ Trace

> **Real-Time Collaborative Whiteboard with a Tactile, Hand-Drawn Design System.**

Trace bridges the gap between digital precision and human tactile creativity. It combines the expressive power of an infinite drawing canvas powered by Excalidraw with an organic, sketchy interface aesthetic. Built for distributed engineering teams, design squads, educators, and visual thinkers.

<p align="left">
  <!-- Frontend Stack -->
  <img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite_8-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite 8" />
  <img src="https://img.shields.io/badge/Excalidraw-6965DB?style=for-the-badge&logo=excalidraw&logoColor=white" alt="Excalidraw" />
  <img src="https://img.shields.io/badge/Tailwind_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/Zustand-443E38?style=for-the-badge&logo=react&logoColor=white" alt="Zustand" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <br />
  <!-- Backend & Infrastructure Stack -->
  <img src="https://img.shields.io/badge/Node.js-5FA04E?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js" />
  <img src="https://img.shields.io/badge/WebSockets-010101?style=for-the-badge&logo=socketdotio&logoColor=white" alt="WebSockets" />
  <img src="https://img.shields.io/badge/Redis_7-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis 7" />
  <img src="https://img.shields.io/badge/PostgreSQL_15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL 15" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma ORM" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white" alt="Nginx" />
</p>

---

## ✨ Features

- 🎨 **Sacred Canvas & Hand-Drawn Frame**: Clean, high-performance canvas inside a sketchy, imperfect tactile UI shell.
- ⚡ **Real-Time Sync**: Low-latency WebSocket synchronization across room participants powered by Redis Pub/Sub.
- 🚀 **Horizontally Scalable Architecture**: Nginx load balancer distributing traffic across multiple application nodes with Redis event broadcasting.
- 🔐 **Secure Authentication**: Supabase Auth integration with JWT verification (`jose`), HTTP security headers (`helmet`, `hpp`, `xss`), and rate limiting.
- 📂 **Room & Canvas State Management**: Persistent room session data stored with PostgreSQL and Prisma ORM.
- 🐳 **Full Containerization**: One-command Docker Compose stack provisioned with load balancing, caching, and database services.

---

## 🏗️ Architecture Overview

```mermaid
graph TD
    Client["Browser Client (React 19)"]
    Nginx["Nginx Load Balancer"]
    App1["App Node 1 (Express + WS)"]
    App2["App Node 2 (Express + WS)"]
    Redis["Redis 7 (Broker & Pub/Sub)"]
    Postgres["PostgreSQL 15 (Prisma DB)"]

    Client -->|"HTTP / WebSockets"| Nginx
    Nginx --> App1
    Nginx --> App2
    App1 <-->|"Pub/Sub Sync"| Redis
    App2 <-->|"Pub/Sub Sync"| Redis
    App1 -->|"Prisma ORM"| Postgres
    App2 -->|"Prisma ORM"| Postgres
```

---

## 🛠️ Tech Stack

### Frontend (`/client`)
- **Core Framework**: React 19, Vite 8, React Router DOM v6
- **Canvas Engine**: Excalidraw (`@excalidraw/excalidraw`)
- **Styling & Icons**: Tailwind CSS v4, Lucide React
- **State Management**: Zustand
- **Auth Client**: Supabase JS Client (`@supabase/supabase-js`)

### Backend (`/server`)
- **Runtime & Framework**: Node.js (ESM), Express 4
- **Real-Time Engine**: `ws` (WebSocket server) with heartbeat & ping/pong
- **Pub/Sub Broker**: Redis (`ioredis`)
- **ORM & Database**: Prisma ORM, PostgreSQL 15
- **Security**: Supabase JWT verification (`jose`), `helmet`, `express-rate-limit`, `xss`, `hpp`

### Infrastructure & Operations
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy / Load Balancer**: Nginx (Alpine)

---

## 📁 Repository Structure

```
Trace/
├── client/                     # Frontend Vite + React Application
│   ├── src/                    # UI Components, Canvas wrappers, Zustand stores
│   ├── package.json            # Client dependencies & scripts
│   └── vite.config.js          # Vite build & plugin configuration
├── server/                     # Backend Express + WebSocket Application
│   ├── src/
│   │   ├── config/             # Environment, Redis, and Prisma configurations
│   │   ├── middleware/         # Auth, Rate Limiting, & Security middlewares
│   │   ├── routes/             # REST endpoints (Auth, Rooms)
│   │   ├── services/           # Room & Redis Pub/Sub business logic
│   │   ├── utils/              # Helper utilities
│   │   └── websocket/          # WS server, connection manager, event handlers
│   ├── prisma/                 # Prisma schema & database migrations
│   └── package.json            # Server dependencies & scripts
├── docker-compose.yml          # Multi-container orchestration (DB, Redis, App 1/2, Nginx)
├── nginx.conf                  # Reverse proxy & WebSocket load balancing config
├── PRODUCT.md                  # Product vision & design principles
├── DESIGN.md                   # Visual design system specification
└── EXCALIDRAW_CUSTOMIZATION.md # Canvas integration guide
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** or **pnpm** / **yarn**
- **Docker** & **Docker Compose** (optional, recommended for full stack)
- A **Supabase** project (for authentication keys)

---

### Option 1: Quickstart with Docker Compose (Recommended)

1. **Clone repository**:
   ```bash
   git clone https://github.com/your-org/trace.git
   cd trace
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Fill in your Supabase credentials (`SUPABASE_JWKS_URL`, `SUPABASE_JWT_ISSUER`, `SUPABASE_JWT_AUDIENCE`).

3. **Launch Stack**:
   ```bash
   docker-compose up --build
   ```
   This spins up:
   - PostgreSQL (`localhost:5435`)
   - Redis (`localhost:6379`)
   - App Node 1 & Node 2 (`internal:3000`)
   - Nginx Load Balancer (`localhost:80`)

4. **Run Client**:
   ```bash
   cd client
   npm install
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

### Option 2: Local Manual Setup

#### 1. Start Database & Redis Services
If not using full Docker compose, start local Postgres & Redis:
```bash
docker-compose up db redis -d
```

#### 2. Backend Setup
```bash
cd server
npm install
cp ../.env.example .env

# Generate Prisma Client & push schema
npx prisma db push

# Start Backend Server in Dev mode
npm run dev
```
Server starts on `http://localhost:3000`.

#### 3. Frontend Setup
```bash
cd client
npm install
npm run dev
```
Client dev server starts on `http://localhost:5173`.

---

## ⚙️ Environment Variables

### Root / Backend Variables (`.env`)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `POSTGRES_USER` | PostgreSQL user | `trace_user` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `trace_password` |
| `POSTGRES_DB` | PostgreSQL database name | `trace_db` |
| `PORT` | Express server port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://trace_user:trace_password@localhost:5435/trace_db` |
| `REDIS_HOST` | Redis host address | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `SUPABASE_JWKS_URL` | Supabase JWKS endpoint for token validation | Required |
| `SUPABASE_JWT_ISSUER` | Supabase JWT issuer claim | Required |
| `SUPABASE_JWT_AUDIENCE` | Supabase JWT audience claim | `authenticated` |

---

## 🔌 API & WebSocket Specifications

### HTTP REST Endpoints

- `GET /api/rooms` — List active user rooms.
- `POST /api/rooms` — Create a new whiteboard room.
- `GET /api/rooms/:roomId` — Get room details & initial canvas state.
- `POST /api/auth/verify` — Validate session token.

### WebSocket Events (`ws://localhost:3000`)

| Event Type | Payload | Description |
| :--- | :--- | :--- |
| `join-room` | `{ roomId, token }` | Client joins room session & authenticates |
| `draw-event` | `{ roomId, elements, appState }` | Broadcast canvas edits to room participants |
| `cursor-move` | `{ roomId, x, y, user }` | Real-time collaborator cursor tracking |
| `leave-room` | `{ roomId }` | Client leaves room channel |

---

## 🎨 Design Principles

1. **Sacred Canvas**: Drawing space remains unencumbered, high performance, and high precision.
2. **Tactile Framing**: Outer UIs (login, dashboard, modals) use organic sketchy borders and hand-drawn aesthetics.
3. **Familiar Patterns**: Standard form submit behaviors and navigation enhanced with playful tactile styling.

---
