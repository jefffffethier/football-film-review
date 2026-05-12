# Product Specification — CFL Film Analysis Tool

## Context

- **User:** One coach, personal use only
- **Sport:** Canadian football, youth league (4 downs, 12 players per side)
- **Goal:** Watch game footage, tag plays with metadata, review tendencies, share clips with players
- **Platform:** Desktop web app only (wide screen)
- **Inspiration:** Hudl (hudl.com)

---

## Layout

Wide-screen desktop layout, two-panel side by side:

```
┌─────────────────────────────┬──────────────────────┐
│                             │                      │
│        VIDEO PLAYER         │    TAGGING / PLAY    │
│                             │       LIST           │
│                             │                      │
│  [timeline scrubber]        │                      │
│  [speed] [prev] [next] [P]  │                      │
├─────────────────────────────┴──────────────────────┤
│  ⌨️  Shortcut cheatsheet (always visible, bottom-right corner)  │
└────────────────────────────────────────────────────┘
```

---

## Video Player

### Supported Sources
| Type | Storage | Notes |
|---|---|---|
| YouTube | None (embedded) | Paste URL, limited speed control |
| S3 MP4 | AWS S3 | Full control, 1080p H.264 |

Both sources use identical UI controls. Source type is stored per game and handled transparently by the player component.

### Playback Speeds
| Speed | Key |
|---|---|
| 0.25x | `1` |
| 0.50x | `2` |
| 1.00x | `3` |

### Keyboard Shortcuts

| Action | Key |
|---|---|
| Play / Pause | `Space` |
| Rewind 5 seconds | `J` |
| Forward 5 seconds | `L` |
| Previous tagged play | `←` |
| Next tagged play | `→` |
| Mark play START | `S` |
| Mark play END | `E` |
| Toggle loop current play | `P` |
| Show/hide shortcuts | always visible |

### Loop Mode
- When active, video loops between the current play's `start_timestamp` and `end_timestamp`
- Toggled with `P`
- Visual indicator shown in UI when loop is active

### Shortcut Cheatsheet
- Always visible, bottom-right corner of the screen
- Small, unobtrusive
- Lists all keyboard shortcuts at a glance

---

## Tagging Workflow

1. Watch game film
2. Press `S` when a play starts → timestamp recorded
3. Press `E` when a play ends → timestamp recorded
4. Tag form appears with fields to fill in
5. Submit → play saved to database, appears in playlist

---

## Tag Schema (Fixed)

All fields are required unless marked optional.

| Field | Type | Options |
|---|---|---|
| `down` | integer | 1, 2, 3, 4 |
| `yard_line` | integer | 1–110 |
| `field_zone` | enum | own_end, own_territory, neutral, opponent_territory, red_zone, opponent_end |
| `play_type` | enum | run, pass, kick, punt, penalty |
| `formation` | enum | shotgun, under_centre, pistol, wildcat, special_teams |
| `result` | enum | gain, loss, touchdown, incomplete, turnover, sack, penalty, rouge |
| `notes` | text | optional, free-form coaching notes |

> **Note:** `down` goes up to 4 for youth Canadian football. This is configured once per team/season via a config flag and is not changed per-game.

---

## Play List Panel

- Shows all tagged plays for the currently loaded game
- Each play shows: down, play type, result, timestamp
- Click any play → video jumps to that play's `start_timestamp`
- Prev (`←`) / Next (`→`) keyboard shortcuts navigate sequentially
- Plays are ordered chronologically

---

## Game Management

Each game record contains:

```
game_id
title             (e.g. "Week 3 vs Tigers")
date
opponent
video_source      "youtube" | "s3"
video_ref         YouTube URL or S3 key
downs_config      4 (youth) | 3 (senior)
created_at
```

---

## Sharing

- Generate a shareable link per play or per player (a filtered view of plays tagged with a player's number/name — TBD)
- Links are public but obscure (UUID-based)
- No player login required — link works in any browser
- Clips served via S3 pre-signed URLs (time-limited, private bucket)

---

## Security

- Single password stored as environment variable (`APP_PASSWORD`)
- No user accounts, no roles
- Intentionally minimal — this is a personal tool

---

## YouTube → S3 Migration Path

When YouTube player limitations become frustrating (e.g. loop control, speed precision):

1. Download video using `yt-dlp` (free CLI tool):
   ```bash
   yt-dlp -o "game.mp4" "https://youtube.com/..."
   ```
2. Upload MP4 to S3 bucket
3. Update game record: `video_source = "s3"`, `video_ref = "games/2026/game.mp4"`
4. Full player controls immediately available — no other changes needed

---

## Out of Scope (v1)

- Mobile support
- Player accounts / logins
- Multi-team or multi-coach support
- Automated play detection (AI tagging)
- Drawing tools / telestration
- Opponent film management
- Statistics dashboard
- Export to PDF/video

These can be considered for future iterations.
