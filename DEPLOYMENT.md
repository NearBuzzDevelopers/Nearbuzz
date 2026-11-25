# NearBuzz Production Deployment Guide (Supabase + Render + Vercel)

## 1. PostgreSQL + PostGIS Database (Supabase)
1. Ensure Supabase project `gesveqbuqntwaipljhxo` is active (unpaused).
2. Use the **Session Pooler** JDBC URL (IPv4 compatible for Render):
   - `DB_URL`: `jdbc:postgresql://aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require`
   - `DB_USER`: `postgres.gesveqbuqntwaipljhxo`
   - `DB_PASSWORD`: your Supabase DB password

## 2. Object Storage (Cloudflare R2 - Optional but Recommended)
1. Create an R2 bucket (e.g., `nearbuzz-media`) and enable Public Access / `r2.dev` subdomain.
2. Create an R2 API Token with Read & Write permissions.
3. Save `R2_ENDPOINT`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_PUBLIC_URL`.

## 3. Spring Boot Backend (Render Free Tier)
1. Connect GitHub repository `NearBuzzDevelopers/Nearbuzz` on [Render](https://render.com) using `render.yaml` (Blueprint) or Web Service (`Docker`, context `backend/`).
2. Set `COOKIE_SECURE=true` and `FRONTEND_URL=https://<your-vercel-app>.vercel.app`.
3. Add `GEMINI_API_KEY` from Google AI Studio for LLM natural-language parsing (falls back cleanly to rule-based NLP if omitted).
4. **Keep-Alive:** Add a free monitor on [Cron-job.org](https://cron-job.org) pinging `https://<your-render-app>.onrender.com/api/v1/health` every 10–14 minutes so Render's free container stays warm during demos.

## 4. React SPA Frontend (Vercel)
1. Import the same repository on [Vercel](https://vercel.com) with **Root Directory** = `frontend`.
2. Framework Preset: `Vite`, Build Command: `npm run build`, Output Directory: `dist`.
3. Add Environment Variable:
   - `VITE_API_URL` = `https://<your-render-app>.onrender.com` (no trailing slash).
4. `frontend/vercel.json` automatically rewrites client-side React Router URLs (`/businesses/:id`, `/feed`, `/dashboard`) to `/index.html`.
