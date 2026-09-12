# Sachin Jha — Full-Stack Developer Portfolio

A production-minded portfolio with a React frontend, Express REST API, Prisma database, admin authentication, dynamic projects/skills/journey/current build/engineering lab, working contact form, and an interactive terminal — fully wired end to end (frontend fetches everything from the API; the admin panel edits the same database the public site reads from).

## What's new in this enhancement pass
- **Hero**: rotating role descriptor, live project counter, "currently building" readout and a live system-status indicator — all pulled from the API, not hardcoded.
- **Featured Project**: a visually dominant section for whichever project is marked `featured` in the CMS.
- **Project filtering**: chip-based filters (Full Stack / AI-ML / Data / etc.) driven by a new `tags` field, animated client-side with no page reload.
- **Deeper case studies**: the project modal now has Problem / Solution / Challenges / What I Learned sections, an optional screenshot gallery, and a "Next project" control. New truthful fields (`problem`, `solution`, `challenges`, `learnings`, `tags`, `gallery`) were added to the Project model — existing project copy was reorganized into these sections without inventing new facts.
- **Abstract project visuals**: since no real screenshots were provided, each project renders a small deterministic generative SVG (seeded by project number) instead of a fake or stock screenshot, per the "don't fabricate" rule.
- **Engineering Lab**: a new section + `LabExperiment` model + full admin CRUD. Seeded empty on purpose (no invented demos) with a clean empty state — add real experiments from `/admin`.
- **Interactive skills**: hovering/tapping a skill now shows its description and which of your real projects use it (cross-referenced from each project's stack, not fabricated).
- **Terminal upgrade**: `whoami`, `ls`, `pwd`, `cat about.txt`, `stack`, `status`, `build`, plus command history (↑/↓).
- **Site Settings**: a new `SiteSettings` model + `/api/settings` route so name/role/tagline/socials are CMS-editable instead of hardcoded in React.
- **Admin CMS**: overview cards (total projects, active builds, unread messages, skills, last updated), a Lab tab, a Settings tab, mark-unread toggle and message delete.
- **Security fix**: the seed script no longer bakes in a fixed default admin password. Set `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `backend/.env`; if `ADMIN_PASSWORD` is left blank, a random one-time password is generated and printed once by the seed script.
- **SEO**: canonical URL, Open Graph + Twitter card tags, theme-color, and Person structured data (JSON-LD).
- **Loading states**: shimmer skeleton for the project list instead of plain "Loading..." text.
- Accessible, reduced-motion-aware throughout; the custom cursor now disables itself on touch/coarse-pointer devices.

## Stack
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: Prisma + SQLite for zero-setup local development
- Auth: JWT in an HttpOnly cookie + bcrypt password hashing
- Validation: Zod
- Security: Helmet, CORS, rate limiting, secure cookies in production

## Run locally

### 1. Install
```bash
npm install
npm run install:all
```

### 2. Configure backend
Copy `backend/.env.example` to `backend/.env` and set a strong `JWT_SECRET`. Also set `ADMIN_EMAIL` and `ADMIN_PASSWORD` — if you leave `ADMIN_PASSWORD` blank, the seed script generates and prints a random one-time password instead of relying on any fixed default.

To receive contact form messages at `jhasachin0661@gmail.com`, enable 2-Step Verification on that Gmail account, create a Google App Password, and set it as `SMTP_PASS` in `backend/.env`. Keep the App Password private and do not commit `.env`.

### 3. Create and seed the database
```bash
npm run setup
```

This runs `prisma db push` (creates/updates the SQLite schema — including the new `tags`, `gallery`, `problem/solution/challenges/learnings` project fields, `LabExperiment`, and `SiteSettings` tables) followed by the seed script, which prints your admin login once. Change the credentials immediately for any deployed environment.

> Note: `prisma db push`/`generate` needs to reach Prisma's engine CDN once, and the frontend build needs to reach the npm registry for platform-specific optional packages (e.g. `@rollup/rollup-<platform>`). Run this on a machine/CI with normal internet access — this doesn't work in fully network-restricted sandboxes.

### How to add project images / a gallery
The project data model doesn't require file uploads — set `imageUrl` to a single cover image URL, and `gallery` to a comma-separated list of image URLs (e.g. hosted on your own `/public` folder, or Unsplash/Pexels for placeholder art) in the admin project form. If left empty, the site automatically renders a generated abstract technical visual instead of a broken image or a fake screenshot.

### How to add a new project / lab experiment through admin
Go to `/admin`, sign in, pick the **Projects** or **Lab** tab, fill in the form (leave optional fields like `gallery`, `liveUrl`, `githubUrl` blank if not applicable) and submit. It's live on the public site immediately — no redeploy needed.

### 4. Start both apps
```bash
npm run dev
```

Frontend: http://localhost:5173
API: http://localhost:4000

## Production
Build the frontend with `npm run build`. Deploy the backend and frontend separately or serve the frontend through a CDN/static host. For a multi-instance production deployment, replace SQLite with PostgreSQL by changing the Prisma datasource/provider and `DATABASE_URL`, then run migrations.

## API
Public:
- GET `/api/health`
- GET `/api/status` — system/API online status + project count + current build summary (powers the hero status readout and terminal `status` command)
- GET `/api/projects`
- GET `/api/projects/:id`
- GET `/api/skills`
- GET `/api/journey`
- GET `/api/current-build`
- GET `/api/lab`
- GET `/api/settings`
- POST `/api/contact`

Admin (JWT cookie required):
- POST `/api/auth/login`
- POST `/api/auth/logout`
- GET `/api/auth/me`
- POST/PUT/DELETE `/api/projects[/:id]`
- POST/PUT/DELETE `/api/skills[/:id]`
- POST/PUT/DELETE `/api/journey[/:id]`
- PUT `/api/current-build`
- POST/PUT/DELETE `/api/lab[/:id]`
- PUT `/api/settings`
- GET `/api/messages`
- PATCH `/api/messages/:id/read` (toggles read/unread)
- DELETE `/api/messages/:id`

## Database schema changes in this pass
- `Project`: added `tags`, `gallery`, `problem`, `solution`, `challenges`, `learnings`
- `CurrentBuild`: added `buildPhase`
- New model `LabExperiment` (title, description, stack, status, link, order)
- New model `SiteSettings` (name, role, tagline, location, email, github, linkedin, resumeUrl, availability)

No new npm dependencies were required for this pass — everything uses the existing Express/Prisma/React stack.

## Remaining placeholders / things that need your real information
- **Resume**: no resume file was provided, so the contact/footer areas don't link to one. Add a real URL to `resumeUrl` via the Settings tab once you have one; there's no fake link anywhere.
- **Lab experiments**: the Engineering Lab section ships empty on purpose — add real experiments through `/admin` → Lab as they exist.
- **Project galleries**: no real screenshots were provided, so projects show a generated abstract visual instead. Add real screenshot URLs via the `gallery` field whenever you have them.
- **Canonical/OG URL** in `index.html` uses a placeholder domain (`sachinjha.dev`) — update it to your actual deployed domain.
- The provided content did not include a real name change, project GitHub links, or measurable project outcomes beyond what was already given, so nothing was invented there. The visible name remains `Sachin Jha`, editable via the new Settings tab without touching code.
Built with React, Node.js, Express and Prisma.