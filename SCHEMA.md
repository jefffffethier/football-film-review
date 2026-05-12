# Database Schema — CFL Film Analysis Tool

Database: **Supabase (PostgreSQL)**

---

## Tables

### `games`

Stores one record per game (or practice session) with its video source.

```sql
CREATE TABLE games (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,               -- e.g. "Week 3 vs Tigers"
  date            DATE NOT NULL,
  opponent        TEXT,
  video_source    TEXT NOT NULL CHECK (video_source IN ('youtube', 's3')),
  video_ref       TEXT NOT NULL,               -- YouTube URL or S3 object key
  downs_config    INTEGER NOT NULL DEFAULT 4,  -- 4 for youth, 3 for senior
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

---

### `plays`

Stores one record per tagged play, linked to a game.

```sql
CREATE TABLE plays (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id         UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  start_time      NUMERIC NOT NULL,            -- seconds from video start
  end_time        NUMERIC NOT NULL,            -- seconds from video start
  down            INTEGER NOT NULL CHECK (down BETWEEN 1 AND 4),
  yard_line       INTEGER CHECK (yard_line BETWEEN 1 AND 110),
  field_zone      TEXT CHECK (field_zone IN (
                    'own_end',
                    'own_territory',
                    'neutral',
                    'opponent_territory',
                    'red_zone',
                    'opponent_end'
                  )),
  play_type       TEXT NOT NULL CHECK (play_type IN (
                    'run',
                    'pass',
                    'kick',
                    'punt',
                    'penalty'
                  )),
  formation       TEXT CHECK (formation IN (
                    'shotgun',
                    'under_centre',
                    'pistol',
                    'wildcat',
                    'special_teams'
                  )),
  result          TEXT NOT NULL CHECK (result IN (
                    'gain',
                    'loss',
                    'touchdown',
                    'incomplete',
                    'turnover',
                    'sack',
                    'penalty',
                    'rouge'
                  )),
  notes           TEXT,                        -- optional coaching notes
  share_token     UUID DEFAULT gen_random_uuid(), -- for shareable links
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

---

## Indexes

```sql
-- Fast lookup of all plays for a game, in order
CREATE INDEX idx_plays_game_id ON plays(game_id, start_time);

-- Fast lookup of a play by share token
CREATE INDEX idx_plays_share_token ON plays(share_token);
```

---

## Notes

- `start_time` and `end_time` are stored in **seconds** as a float (e.g. `142.5` = 2m 22.5s). This works for both YouTube and S3 video sources.
- `share_token` is a UUID generated automatically for every play — used to construct public shareable links like `/share/{share_token}`.
- `downs_config` on the `games` table drives the tagging UI — the down selector shows 1–4 for youth or 1–3 for senior. Defaults to 4.
- All enum values use snake_case strings for simplicity in a personal project (no separate lookup tables needed).

---

## Shareable Link Pattern

```
https://yourapp.vercel.app/share/{play.share_token}
```

- Resolves to a read-only view of that play's clip
- No authentication required
- Video served via S3 pre-signed URL (time-limited) or YouTube embed
