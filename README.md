# NearBuzz — Hyperlocal Student Services & Real-Time Availability Platform

**NearBuzz** (package `com.studentseva`) is a full-stack hyperlocal two-sided marketplace built for college ecosystems. It connects students with nearby verified hostels/PGs, messes/tiffins, print shops, stationery stores, kirana shops, and study libraries — combining **PostGIS geodesic search**, **live item-level availability with optimistic locking**, **Google Gemini AI natural-language search**, **Cloudflare R2 media storage**, and a responsive **React + Tailwind CSS** SPA.

---

## Key Features

- **PostGIS Spatial Discovery:** Geodesic radius queries (`ST_DWithin` + `ST_Distance` on `GEOGRAPHY(Point, 4326)`) backed by a PostgreSQL GiST spatial index for sub-millisecond filtering and distance sorting (`meters`).
- **Gemini AI Natural-Language Search:** Parses queries like *"AC double sharing room under 9000 within 1.5 km"* into `{category, radiusMeters, maxPrice, keywords}` using Google Gemini (`gemini-2.0-flash`) with an automatic deterministic NLP fallback.
- **Granular Offerings (`JSONB` + `@Version`):** Stores flexible category attributes (`ac`, `wifi`, `isVeg`, `duplex`) in PostgreSQL `JSONB`, enforces optimistic concurrency checks (`409 Conflict`), and tracks availability freshness (`last_confirmed_at`).
- **Weekly Operating Hours & Live `openNow`:** Computes real-time open/closed status in `Asia/Kolkata` including overnight hours.
- **Vendor Updates & Idempotent Follows:** Vendors publish expiry-aware announcements (optionally linked to an offering) while students follow businesses for a personalized `"Following"` updates feed.
- **Cloudflare R2 + Local Dev Image Upload:** Multipart image uploads (`JPEG`/`PNG`/`WEBP`, max 5 MB) via AWS SDK v2 S3 API for Cloudflare R2, with automatic `./uploads` fallback in local dev.
- **Passwordless Email OTP & RBAC:** BCrypt-hashed 6-digit OTP login issuing `HttpOnly` JWT cookies (`nearbuzz_token`) with `STUDENT`, `VENDOR`, and `ADMIN` roles + listing moderation queue.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Java 21, Spring Boot 3.4.3, Spring Security, Spring Data JPA, Hibernate Spatial (JTS), JJWT `0.12.6`, AWS SDK v2 S3, Flyway |
| **Database** | PostgreSQL 17 + PostGIS (Supabase Session Pooler) |
| **Frontend** | React 19, Vite 8, Tailwind CSS v4, React Router 7, Axios |
| **AI & Storage** | Google Gemini REST API (`gemini-2.0-flash`), Cloudflare R2 Object Storage |
| **Hosting** | Render (Docker Web Service) + Vercel (Static SPA) + Cron-job.org keep-alive |

---

## Repository Structure

```text
├── backend/                     # Spring Boot 3.4 REST API & PostGIS engine
│   ├── src/main/java/com/studentseva/
│   │   ├── ai/                  # Gemini natural-language parser & search
│   │   ├── auth/                # Passwordless Email OTP, JWT cookies, SecurityConfig
│   │   ├── businesses/          # Business profiles, PostGIS queries, Hours, Photos
│   │   ├── common/              # GlobalExceptionHandler (400/403/404/409/429) & Health
│   │   ├── follows/             # Idempotent Follow/Unfollow & follower counts
│   │   ├── media/               # Cloudflare R2 S3Client + LocalDevStorage fallback
│   │   ├── offerings/           # Offerings CRUD, JSONB attributes, @Version locking
│   │   ├── reports/             # Community listing reports & ROLE_ADMIN moderation
│   │   └── updates/             # Vendor updates & personalized Following feed
│   ├── src/main/resources/db/migration/V1__init_schema.sql
│   ├── src/test/java/           # JUnit 5 tests (JwtServiceTest, AiQueryParserServiceTest)
│   └── Dockerfile
├── frontend/                    # React 19 + Vite + Tailwind CSS SPA
│   ├── src/pages/               # ExplorePage, BusinessDetailPage, UpdatesFeedPage, DashboardPage, LoginPage
│   ├── src/components/          # Navbar, ProtectedRoute, VendorStudio, AdminModerationPanel
│   └── vercel.json
├── render.yaml                  # Render Blueprint for backend container
├── DEPLOYMENT.md                # Production deployment walkthrough (Supabase + Render + Vercel)
└── .env.example                 # Environment variable template
```

---

## Core API Endpoints (`/api/v1`)

| Module | Method & Path | Access |
|--------|---------------|--------|
| **Health** | `GET /health` | Public |
| **Auth** | `POST /auth/send-otp`, `POST /auth/verify-otp`, `POST /auth/logout`, `GET /auth/me` | Public / Auth |
| **Spatial & AI** | `GET /businesses/nearby`, `GET /ai/search`, `GET /ai/status` | Public |
| **Businesses** | `POST /businesses`, `GET /businesses/my`, `GET /businesses/{id}` | Auth / Public |
| **Offerings** | `GET /businesses/{id}/offerings`, `POST /businesses/{id}/offerings`, `PUT /offerings/{id}`, `PATCH /offerings/{id}/confirm`, `DELETE /offerings/{id}` | Public / Owner |
| **Hours & Photos** | `GET/PUT /businesses/{id}/hours`, `GET/POST/DELETE /businesses/{id}/photos`, `POST /businesses/{id}/photos/upload` | Public / Owner |
| **Updates & Follows** | `GET /updates/feed`, `GET /updates/following`, `POST /businesses/{id}/updates`, `POST/DELETE /businesses/{id}/follow`, `GET /follows/my` | Public / Auth |
| **Reports & Admin** | `POST /businesses/{id}/reports`, `GET /admin/reports`, `PATCH /admin/reports/{id}`, `PATCH /admin/businesses/{id}/verification` | Auth / `ADMIN` |

---

## Local Development Quickstart

### 1. Backend (Spring Boot)
```powershell
cd backend
.\mvnw.cmd test
.\mvnw.cmd spring-boot:run
```
API starts at `http://localhost:8080`. Swagger UI is available at `http://localhost:8080/swagger-ui.html`.

### 2. Frontend (React + Vite)
```powershell
cd frontend
npm install
npm run dev
```
Frontend starts at `http://localhost:5173` and proxies `/api/v1` and `/uploads` to `http://localhost:8080`.

### 3. Production Cloud Deployment
See [DEPLOYMENT.md](DEPLOYMENT.md) for configuring Supabase PostgreSQL + PostGIS, Cloudflare R2, Render, Vercel, and Cron-job.org keep-alive.
