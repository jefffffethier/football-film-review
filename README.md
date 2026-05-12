# 🏈 CFL Film Analysis Tool

A personal web app for coaching Canadian youth football. Watch game footage, tag plays, and share clips with players — built for one coach, no fluff.

---

## Overview

This tool mimics the core coaching workflow of Hudl, tailored specifically for:
- **Canadian football** (12 players, 4 downs for youth)
- **Personal use** — one coach, no multi-tenancy
- **Desktop-only** — optimized for wide-screen film review sessions

---

## Features

- 📹 Watch game film (YouTube embed or S3-hosted MP4)
- ⌨️ Live keyboard-driven play tagging while watching
- 🏷️ Fixed tag schema tailored to Canadian youth football
- 📋 Play list panel with click-to-jump navigation
- 🔗 Shareable clip links for players (no player login required)
- 🔁 Loop mode for repeating individual plays
- 🔒 Single-password protection via environment variable

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React |
| Database | Supabase (free tier) |
| Video storage | AWS S3 |
| Hosting | Vercel |
| AI coding assistant | Claude Code |

---

## Video Sources

The app supports two video source types, transparently handled by the player component:

```
video_source: "youtube" | "s3"
video_ref:    "https://youtube.com/..." | "games/2026/game1.mp4"
```

- **YouTube** — paste a URL, zero storage cost, slightly limited player controls
- **S3** — full player control, 1080p H.264 MP4, ~4–6 GB/hour
- **Migration path** — YouTube → S3 anytime using `yt-dlp`, one database field update per game

---

## Project Structure (planned)

```
/
├── README.md
├── SPEC.md              # Full product specification
├── SCHEMA.md            # Database schema
├── src/
│   ├── components/
│   │   ├── VideoPlayer/
│   │   ├── TaggingPanel/
│   │   ├── PlayList/
│   │   └── ShortcutCheatsheet/
│   ├── pages/
│   └── lib/
├── supabase/
│   └── migrations/
└── .env.example
```

---

## Getting Started

> Setup instructions will be added as the project is built.

### Prerequisites
- Node.js
- Vercel account
- Supabase account (free tier)
- AWS account (S3)

### Environment Variables

```env
APP_PASSWORD=your_password_here
SUPABASE_URL=
SUPABASE_ANON_KEY=
AWS_S3_BUCKET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
```

---

## Security

This is a personal tool. Security is intentionally minimal:
- Single hardcoded password stored as an environment variable
- No user accounts, no roles, no multi-tenancy
- S3 bucket is private; clips are served via pre-signed URLs for sharing

---

## Cost Estimate

| Service | Estimated monthly cost |
|---|---|
| AWS S3 storage (~200 GB/season) | ~$4/month |
| S3 egress (player film review) | ~$2–5/month |
| Supabase | Free tier |
| Vercel | Free tier |
| **Total** | **~$5–10/month** |
