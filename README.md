# TrivyHub — Frontend

Security posture management dashboard. Visualizes Trivy vulnerability reports collected from CI/CD pipelines.

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4)

**Live:** https://dashboard.trivyhub.fr  
**API:** https://api.trivyhub.fr

---

---
## Features

- **Overview** — global risk score, CVE trend chart, top at-risk projects
- **Projects** — card grid with severity bars, risk score, environment filter
- **Project detail** — CVE evolution chart, diff vs previous scan, recent scans
- **Vulnerabilities** — paginated table with SLA age badge (⚠ CRITICAL > 7d), severity filter, CSV export
- **Scan history** — full timeline per project with pipeline link, CVE drill-down per scan
- **Members** — invite, role management
- **API Keys** — create, copy, revoke
- **Settings** — change password, account info
- **Search** — global Cmd+K palette (projects + CVEs)
- **Dark / Light mode** — toggle in sidebar, persisted

---

## Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Icons | Lucide React |
| Deploy | Vercel |

---

## Local development

```bash
git clone https://github.com/theo-mrn/trivy-dashboard-web.git
cd trivy-dashboard-web
npm install
```

Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

```bash
npm run dev
```

Open http://localhost:3000

---

## Connect to the backend

The frontend talks to the [TrivyHub API](https://github.com/theo-mrn/trivy_dashboard). Set `NEXT_PUBLIC_API_URL` to point to your backend instance.

In Vercel: **Settings → Environment Variables → `NEXT_PUBLIC_API_URL`**

---

## Session handling

JWT tokens are stored in `localStorage`. On expiry (401), the app redirects to `/login?expired=1` with a message.
