# CLAUDE.md — CFL Film Analysis Tool

## Project Summary

A personal desktop web app for a youth Canadian football coach to watch game footage, tag plays, and share clips with players. One user, no multi-tenancy, desktop-only (wide screen).

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) |
| Database | Supabase (PostgreSQL, free tier) |
| Video storage | AWS S3 |
| Hosting | Vercel |

## Key Design Constraints

- **Desktop-only** — no mobile, no responsive breakpoints needed
- **Single user, two roles** — no accounts, just two shared passwords: `APP_PASSWORD_EDIT` grants full edit access, `APP_PASSWORD_VIEW` grants read-only access (all mutating API routes reject view-role sessions with 403)
- **Canadian football** — 4 downs (youth), 12 players per side
- `downs_config` on the `games` table drives the tagging UI (4 for youth, 3 for senior)
- All enum values are snake_case strings — no separate lookup tables

## Database

Two tables. Full DDL in SCHEMA.md.

- `games` — one row per game/session; stores video source type + ref, downs config
- `plays` — one row per tagged play; linked to game via FK; has a `share_token` UUID for public share links

Video timestamps (`start_time`, `end_time`) are stored as seconds (NUMERIC float).

## Video Sources

Two source types, identical UI surface:
- `youtube` — embedded YouTube player
- `s3` — S3-hosted H.264 MP4, served via pre-signed URLs

Switching is a single DB field update per game. Migration tool: `yt-dlp`.

## Layout

Two-panel side-by-side desktop layout:
- Left: video player + timeline scrubber + playback controls
- Right: tagging panel / play list
- Bottom-right corner: always-visible shortcut cheatsheet

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `Space` | Play / Pause |
| `J` | Rewind 5s |
| `L` | Forward 5s |
| `←` / `→` | Prev / Next tagged play |
| `1` / `2` / `3` | Speed 0.25x / 0.50x / 1.00x |
| `S` | Mark play start |
| `E` | Mark play end |
| `P` | Toggle loop current play |

## Tagging Workflow

1. Watch film → press `S` at play start, `E` at play end
2. Tag form appears with fields: down, yard_line, field_zone, play_type, formation, result, notes
3. Submit → saved to Supabase, appears in playlist

## Sharing

- Public shareable link per play: `/share/{play.share_token}`
- No login required for share links
- S3 clips served via pre-signed URLs (time-limited)

## Component Plan

```
src/
  components/
    VideoPlayer/     # handles both youtube and s3 sources
    TaggingPanel/    # form that appears after S+E marks
    PlayList/        # ordered list of tagged plays, click-to-jump
    ShortcutCheatsheet/  # always-visible keyboard reference
  pages/
    index            # main film review page (game load + player + tagging)
    share/[token]    # public read-only play view
  lib/
    supabase.ts      # Supabase client
    s3.ts            # pre-signed URL helper
```

## Environment Variables

```
APP_PASSWORD_EDIT=
APP_PASSWORD_VIEW=
SUPABASE_URL=
SUPABASE_ANON_KEY=
AWS_S3_BUCKET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
```

## Out of Scope (v1)

Mobile, player accounts, multi-team, AI tagging, drawing tools, opponent film, stats dashboard, export.
