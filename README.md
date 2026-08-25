# CFL Film Analysis Tool

A personal desktop web app for a youth Canadian football coach. Watch game footage, tag plays by down and formation, and share individual clips with players — built for one coach, one browser, no fluff.

---

## What's built

- Game library — create games, choose YouTube or S3 as the video source, configure 3 or 4 downs per game
- Video player — custom controls bar with seekable scrubber, play markers, pending-start indicator, loop mode
- Keyboard-driven tagging — press `S` to mark play start, `E` to mark play end, fill in a form, save
- Play list — all tagged plays in chronological order, click any to jump, edit or delete inline
- Share links — public per-play URL (`/share/{token}`) that works without a login
- Two-password auth — `APP_PASSWORD_EDIT` (full access) and `APP_PASSWORD_VIEW` (read-only), session stored in an encrypted cookie

---

## Tech stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.6 |
| UI | React + MUI (dark theme) | 19.2.4 / 9.x |
| State | Zustand | 5.x |
| Video | react-player | 2.x |
| Auth | iron-session | 8.x |
| Database | Supabase (PostgreSQL) | free tier |
| File storage | AWS S3 | SDK v3 |
| Hosting | Vercel | free tier |

---

## Project structure

```
football-film-review/
├── app/
│   ├── layout.tsx                  # Root layout, MUI theme provider
│   ├── page.tsx                    # Redirects → /games
│   ├── games/
│   │   ├── page.tsx                # Game library table
│   │   └── [id]/page.tsx           # Film review editor (player + tagging)
│   └── api/
│       ├── auth/login/route.ts
│       ├── auth/logout/route.ts
│       ├── games/route.ts
│       ├── games/[id]/route.ts
│       ├── plays/route.ts
│       ├── plays/[id]/route.ts
│       ├── plays-by-game/[gameId]/route.ts
│       ├── presign/route.ts         # Generates S3 pre-signed URLs
│       └── share/[token]/route.ts
├── components/
│   ├── VideoPlayer/                 # react-player wrapper + custom controls
│   ├── TaggingPanel/                # Switches between PlayList and TagForm
│   ├── TagForm/                     # New / edit play form
│   ├── PlayList/                    # Chronological play list
│   ├── GameModal/                   # Create game dialog
│   └── ShortcutCheatsheet/          # Always-visible keyboard reference
├── lib/
│   ├── supabase.ts                  # Supabase client (server-side only)
│   ├── s3.ts                        # Pre-signed URL helper
│   └── session.ts                   # iron-session config
├── store/
│   └── filmStore.ts                 # Zustand store (game, plays, playback state)
├── types/
│   └── index.ts                     # Game, Play, enums
├── supabase/
│   └── migrations/0001_initial.sql  # games + plays DDL
├── scripts/
│   ├── migrate.mjs                  # Verify DB tables exist
│   └── test-s3.mjs                  # Verify S3 credentials + permissions
├── .env.local                       # Local secrets (never committed)
└── .env.local.example               # Template
```

---

## Prerequisites

- **Node.js** 18 or later
- **Supabase** project — [supabase.com](https://supabase.com), free tier is enough
- **AWS account** with an S3 bucket and an IAM user (see below)
- **Vercel** account for deployment (optional for local dev)

---

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create `.env.local`

Copy the example and fill in every value:

```bash
cp .env.local.example .env.local
```

| Variable | Where to get it | Notes |
|---|---|---|
| `APP_PASSWORD_EDIT` | You choose | Password that grants full edit access |
| `APP_PASSWORD_VIEW` | You choose | Password that grants read-only (view mode) access |
| `SESSION_SECRET` | Generate (see below) | Encrypts the session cookie — must be 32+ chars |
| `SUPABASE_URL` | Supabase → Settings → API | e.g. `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → `service_role` | Keep server-side only |
| `AWS_S3_BUCKET` | Your bucket name | e.g. `my-football-film` |
| `AWS_ACCESS_KEY_ID` | AWS → IAM → Users → your user → Security credentials | |
| `AWS_SECRET_ACCESS_KEY` | Same — only shown at creation time | |
| `AWS_REGION` | Your bucket's region | e.g. `us-east-1` |

**Generate a session secret:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Set up the database

The Supabase tables are created automatically if they don't exist. Verify with:

```bash
node scripts/migrate.mjs
```

If the tables are missing, it will print the SQL to paste into the [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql/new).

### 4. Set up S3 permissions

Your IAM user needs this inline policy (AWS Console → IAM → Users → your user → Add permissions → Create inline policy → JSON):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    },
    {
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME"
    }
  ]
}
```

Verify the connection:

```bash
node scripts/test-s3.mjs
```

All four checks (list, write, read via presigned URL, delete) should pass.

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be prompted for a password — enter `APP_PASSWORD_EDIT` or `APP_PASSWORD_VIEW` — then land on the game library.

---

## Using the app

### Create a game

Click **New Game**, enter a title, date, opponent (optional), choose a video source, and set the downs config (4 for youth, 3 for senior).

- **YouTube** — paste the video URL directly
- **S3** — enter the object key of a video already uploaded to your bucket (e.g. `games/2026/week1.mp4`)

### Tag plays

Open a game to enter the film review editor. Use keyboard shortcuts to tag plays while the video plays:

| Key | Action |
|---|---|
| `Space` | Play / Pause |
| `J` | Rewind 5 s |
| `L` | Forward 5 s |
| `←` / `→` | Jump to previous / next tagged play |
| `1` / `2` / `3` | Speed 0.25× / 0.50× / 1.00× (S3 only) |
| `S` | Mark play start (yellow pin on scrubber) |
| `E` | Mark play end → opens tag form |
| `P` | Toggle loop on current play |

Fill in the tag form (down, yard line, formation, result, notes) and save. The play appears in the list and as a blue segment on the scrubber.

### Share a clip

Each tagged play has a **Share** link. The `/share/{token}` URL is public — players can open it without logging in. S3 clips are served via time-limited pre-signed URLs.

---

## Uploading video to S3

For S3-hosted games, upload your MP4 before creating the game record. The recommended format is H.264, 1080p.

**Upload via AWS CLI:**

```bash
aws s3 cp game1.mp4 s3://YOUR-BUCKET-NAME/games/2026/game1.mp4
```

**Convert / download from YouTube using yt-dlp:**

```bash
yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]" \
  -o "game1.mp4" "https://youtube.com/watch?v=..."
```

Then use `games/2026/game1.mp4` as the `video_ref` when creating the game.

---

## Deployment (Vercel)

1. Push the repo to GitHub
2. Import the repo in [vercel.com](https://vercel.com)
3. Add all variables from `.env.local` under **Settings → Environment Variables**
4. Deploy — Vercel auto-detects Next.js, no build config needed

---

## Cost estimate

| Service | Estimated monthly cost |
|---|---|
| AWS S3 storage (~200 GB/season) | ~$4 |
| S3 egress (player film review) | ~$2–5 |
| Supabase | Free tier |
| Vercel | Free tier |
| **Total** | **~$5–10 / month** |

---

## Security notes

This is a personal tool with intentionally minimal auth:

- One password gates the entire app via an encrypted `iron-session` cookie
- `SUPABASE_SERVICE_ROLE_KEY` is used server-side only (API routes) — never exposed to the browser
- S3 bucket is private; all object access goes through pre-signed URLs that expire after 1 hour
- Share links expose only the single play's data, not the full game
