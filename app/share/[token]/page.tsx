"use client";

import { useEffect, useState, use } from "react";
import ReactPlayer from "react-player";
import { Box, Container, Paper, Typography } from "@mui/material";
import { Play, Game } from "@/types";

interface Props {
  params: Promise<{ token: string }>;
}

type PlayWithGame = Play & { games: Game };

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function SharePage({ params }: Props) {
  const { token } = use(params);
  const [data, setData] = useState<PlayWithGame | null>(null);
  const [url, setUrl] = useState("");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/share/${token}`)
      .then((r) => {
        if (!r.ok) {
          setNotFound(true);
          return null;
        }
        return r.json();
      })
      .then((d: PlayWithGame | null) => {
        if (!d) return;
        setData(d);

        if (d.games.video_source === "s3") {
          fetch("/api/presign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: d.games.video_ref }),
          })
            .then((r) => r.json())
            .then((p) => setUrl(p.url));
        } else {
          setUrl(d.games.video_ref);
        }
      });
  }, [token]);

  if (notFound) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: "center" }}>
        <Typography variant="h5">Clip not found</Typography>
      </Container>
    );
  }

  if (!data || !url) return null;

  const game = data.games;
  const fields: [string, string][] = [
    ["Down", String(data.down)],
    ["Yard Line", data.yard_line !== null ? String(data.yard_line) : "—"],
    ["Field Zone", data.field_zone?.replace(/_/g, " ") ?? "—"],
    ["Play Type", data.play_type],
    ["Formation", data.formation?.replace(/_/g, " ") ?? "—"],
    ["Result", data.result],
    ["Clip", `${formatTime(data.start_time)} – ${formatTime(data.end_time)}`],
  ];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ mb: 0.5 }}>
        🏈 {game.title}
      </Typography>
      {(game.home_team || game.away_team) && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {game.home_team ?? "?"} vs {game.away_team ?? "?"} · {game.date}
        </Typography>
      )}

      <Box sx={{ aspectRatio: "16/9", bgcolor: "black", mb: 3 }}>
        <ReactPlayer
          url={url}
          playing
          loop
          width="100%"
          height="100%"
          config={
            game.video_source === "youtube"
              ? {
                  youtube: {
                    playerVars: {
                      start: Math.floor(data.start_time),
                      end: Math.ceil(data.end_time),
                    },
                  },
                }
              : {}
          }
        />
      </Box>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          {fields.map(([label, value]) => (
            <Box key={label} sx={{ textAlign: "center", px: 1 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block" }}
              >
                {label}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {value}
              </Typography>
            </Box>

          ))}
        </Box>
      </Paper>

      {data.notes && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mb: 0.5 }}
          >
            Coaching Notes
          </Typography>
          <Typography variant="body2">{data.notes}</Typography>
        </Paper>
      )}
    </Container>
  );
}
