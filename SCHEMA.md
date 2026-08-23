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
  home_team       TEXT,
  away_team       TEXT,
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
  down            INTEGER CHECK (down BETWEEN 1 AND 4),      -- nullable = unknown/n/a
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
                    'penalty',
                    'pat'
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
  possession      TEXT CHECK (possession IN ('home', 'away')), -- which side had the ball
  play_name       TEXT,                        -- optional, reused across plays (see play_names)
  notes           TEXT,                        -- optional coaching notes
  share_token     UUID DEFAULT gen_random_uuid(), -- for shareable links
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

---

### `play_names`

Stores the growing set of named plays the coach has used, so the tag form can offer them as suggestions while still allowing new ones to be added on the fly.

```sql
CREATE TABLE play_names (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL UNIQUE,
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
- `possession` on a play stores `'home'` or `'away'` (from the `games` row), not the actual team name — this keeps the value stable even if `home_team`/`away_team` text is edited later. The UI resolves it to a team name for display.
- `play_name` is free text, but the UI sources it from `play_names` as a reusable, growable list (like a combobox) rather than a fixed enum, since these are coach-defined and open-ended.

---

## Shareable Link Pattern

```
https://yourapp.vercel.app/share/{play.share_token}
```

- Resolves to a read-only view of that play's clip
- No authentication required
- Video served via S3 pre-signed URL (time-limited) or YouTube embed
