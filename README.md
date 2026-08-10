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

- Node.js 18+
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
cp .env.local.example .env.local
```

Edit `.env.local` with your credentials:

| Variable | Where to get it |
|---|---|
| `SPOTIFY_CLIENT_ID` | [Spotify Dashboard](https://developer.spotify.com/dashboard) → Create App → Client ID |
| `SPOTIFY_CLIENT_SECRET` | Same Spotify app → Settings → Client Secret |
| `SPOTIFY_REDIRECT_URI` | Set to `http://localhost:3000/api/auth/callback` (add this in Spotify app settings too) |
| `NEXT_PUBLIC_SUPABASE_URL` | [Supabase Dashboard](https://supabase.com) → Project Settings → API → URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page → `service_role` key (keep secret!) |
| `SESSION_SECRET` | Run `openssl rand -hex 32` to generate |

### 4. Set up the database

Go to your Supabase project → SQL Editor → paste and run:

```
supabase/migrations/001_initial_schema.sql
```

### 5. Configure Spotify App

In your [Spotify Developer Dashboard](https://developer.spotify.com/dashboard):

1. Edit your app settings
2. Add Redirect URI: `http://localhost:3000/api/auth/callback`
3. For production, also add: `https://your-domain.vercel.app/api/auth/callback`

### 6. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click **Connect with Spotify**.

## Deploy to Vercel

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add all environment variables from `.env.local`
4. Update `SPOTIFY_REDIRECT_URI` to your Vercel URL
5. Add the Vercel callback URL to your Spotify app's Redirect URIs
6. Deploy!

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
