export type VideoSource = "youtube" | "s3";

export type FieldZone =
  | "own_end"
  | "own_territory"
  | "neutral"
  | "opponent_territory"
  | "red_zone"
  | "opponent_end";

export type PlayType = "run" | "pass" | "kick" | "punt" | "penalty" | "pat";

export type Formation =
  | "shotgun"
  | "under_centre"
  | "pistol"
  | "wildcat"
  | "special_teams";

export type PlayResult =
  | "gain"
  | "loss"
  | "touchdown"
  | "incomplete"
  | "turnover"
  | "sack"
  | "penalty"
  | "rouge";

export type Possession = "home" | "away";

export interface PlayName {
  id: string;
  name: string;
  created_at: string;
}

export interface Game {
  id: string;
  title: string;
  date: string;
  home_team: string | null;
  away_team: string | null;
  video_source: VideoSource;
  video_ref: string;
  downs_config: number;
  reviewed: boolean;
  created_at: string;
  play_count?: number;
}

export interface Play {
  id: string;
  game_id: string;
  start_time: number;
  end_time: number;
  down: number | null;
  yard_line: number | null;
  field_zone: FieldZone | null;
  play_type: PlayType;
  formation: Formation | null;
  result: PlayResult;
  possession: Possession | null;
  play_name: string | null;
  notes: string | null;
  share_token: string;
  created_at: string;
}
