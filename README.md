# TeMusc — Your Musical Operating System

> Analyze your Spotify listening habits, manage playlists with precision, and discover music you've been missing.

## Modules

| Module | Description |
|---|---|
| **TeMusc OS** | Dashboard with listening metrics, KPIs, activity charts, and snapshot history |
| **TeMusc LAB** | Playlist laboratory — clone, clean, deduplicate, and create themed playlists |
| **TeMusc DISCOVERY** | Explore unexplored artists, curated public playlists, and AI-powered highlights |

## Tech Stack

- **Frontend**: Next.js 16 + React 19 + Tailwind CSS v4
- **Backend**: Next.js API Routes (Route Handlers)
- **Database**: Supabase (Postgres)
- **Auth**: Spotify OAuth (Authorization Code)
- **Hosting**: Vercel
- **AI (Phase 2)**: Gemini Pro + Perplexity Sonar (currently stubs)

## Prerequisites

- Node.js 20.9+
- npm
- A [Spotify Developer Application](https://developer.spotify.com/dashboard)
- A [Supabase Project](https://supabase.com)

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/temusc.git
cd temusc
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

| Variable | Where to get it |
|---|---|
| `SPOTIFY_CLIENT_ID` | [Spotify Dashboard](https://developer.spotify.com/dashboard) → Create App → Client ID |
| `SPOTIFY_CLIENT_SECRET` | Same Spotify app → Settings → Client Secret |
| `SPOTIFY_REDIRECT_URI` | Local: `http://127.0.0.1:3000/api/auth/callback`; production: the exact canonical HTTPS callback |
| `ALLOWED_SPOTIFY_USER_IDS` | Comma-separated Spotify account IDs allowed to use this personal dashboard |
| `SUPABASE_URL` | [Supabase Dashboard](https://supabase.com) → Project Settings → API → URL |
| `SUPABASE_SECRET_KEY` | A rotated `sb_secret_...` server key; never expose it to browser code |
| `SESSION_SECRET` | Run `openssl rand -hex 32` to generate |
| `CRON_SECRET` | A separate random secret; cron fails closed when this is absent |

### 4. Set up the database

Apply the versioned files in `supabase/migrations/` in order. Existing projects
must reconcile their remote migration history before running `db push`.

### 5. Configure Spotify App

In your [Spotify Developer Dashboard](https://developer.spotify.com/dashboard):

1. Edit your app settings
2. Add Redirect URI: `http://127.0.0.1:3000/api/auth/callback`
3. For production, also add: `https://your-domain.vercel.app/api/auth/callback`

### 6. Run locally

```bash
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000) and click **Connect with Spotify**.

## Deploy to Vercel

Do not deploy until the previously exposed Supabase key has been rotated and
the Git history has been cleaned. Then:

1. Run secret scanning, lint and the production build.
2. Push a reviewed branch to GitHub; do not commit `.env.local`.
3. Import the repository in Vercel and add the variables from `.env.example`
   with real values only in Vercel's encrypted environment settings.
4. Set `SPOTIFY_REDIRECT_URI` to the final canonical HTTPS callback and add the
   exact same URI in the Spotify Developer Dashboard.
5. Configure `ALLOWED_SPOTIFY_USER_IDS` before the first production login.
6. Deploy a preview, validate OAuth and read-only dashboard loading, then
   promote to production.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API routes (auth, os, lab, discovery)
│   ├── dashboard/          # TeMusc OS pages
│   ├── lab/                # TeMusc LAB pages
│   ├── discovery/          # TeMusc DISCOVERY pages
│   └── settings/           # User settings
├── lib/                    # Core libraries
│   ├── spotify/            # Spotify API client + auth
│   ├── supabase/           # Database client + queries
│   └── ai/                 # AI stubs (Phase 2)
├── components/             # React components
│   ├── ui/                 # Reusable UI (Button, Card, Badge, etc.)
│   └── layout/             # Sidebar, Header
├── hooks/                  # React hooks (useAuth, useSpotifyData, etc.)
└── types/                  # TypeScript type definitions
```

## Phase 2 Roadmap

- [ ] Gemini Pro integration for AI-powered weekly summaries
- [ ] Perplexity Sonar for web-enriched music discovery
- [ ] Automatic metric snapshots via Vercel Cron Jobs
- [ ] Enhanced playlist analysis with genre breakdowns

## License

Private project — not for redistribution.
