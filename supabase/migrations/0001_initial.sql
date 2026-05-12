CREATE TABLE games (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  date            DATE NOT NULL,
  home_team       TEXT,
  away_team       TEXT,
  video_source    TEXT NOT NULL CHECK (video_source IN ('youtube', 's3')),
  video_ref       TEXT NOT NULL,
  downs_config    INTEGER NOT NULL DEFAULT 4,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE plays (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id         UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  start_time      NUMERIC NOT NULL,
  end_time        NUMERIC NOT NULL,
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
  notes           TEXT,
  share_token     UUID DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_plays_game_id ON plays(game_id, start_time);
CREATE INDEX idx_plays_share_token ON plays(share_token);
