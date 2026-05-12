"use client";

import { useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Box, Divider, IconButton, Paper, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useFilmStore } from "@/store/filmStore";
import VideoPlayer from "@/components/VideoPlayer/VideoPlayer";
import TaggingPanel from "@/components/TaggingPanel/TaggingPanel";
import ShortcutCheatsheet from "@/components/ShortcutCheatsheet/ShortcutCheatsheet";
import { Game } from "@/types";

interface Props {
  params: Promise<{ id: string }>;
}

export default function FilmReviewPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  const game = useFilmStore((s) => s.game);
  const plays = useFilmStore((s) => s.plays);
  const taggingMode = useFilmStore((s) => s.taggingMode);
  const playing = useFilmStore((s) => s.playing);
  const currentPlayIndex = useFilmStore((s) => s.currentPlayIndex);
  const playerRef = useFilmStore((s) => s.playerRef);

  const setGame = useFilmStore((s) => s.setGame);
  const setPlays = useFilmStore((s) => s.setPlays);
  const setPendingStart = useFilmStore((s) => s.setPendingStart);
  const setTaggingMode = useFilmStore((s) => s.setTaggingMode);
  const setCurrentPlayIndex = useFilmStore((s) => s.setCurrentPlayIndex);
  const toggleLoop = useFilmStore((s) => s.toggleLoop);
  const setPlaying = useFilmStore((s) => s.setPlaying);
  const setPlaybackRate = useFilmStore((s) => s.setPlaybackRate);

  useEffect(() => {
    fetch("/api/games")
      .then((r) => r.json())
      .then((games: Game[]) => {
        const g = games.find((g) => g.id === id);
        if (g) setGame(g);
      });

    fetch(`/api/plays-by-game/${id}`)
      .then((r) => r.json())
      .then(setPlays);
  }, [id]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const player = playerRef.current;

      switch (e.key) {
        case " ":
          e.preventDefault();
          setPlaying(!playing);
          break;
        case "j":
        case "J":
          player?.seekTo((player.getCurrentTime() ?? 0) - 5, "seconds");
          break;
        case "l":
        case "L":
          player?.seekTo((player.getCurrentTime() ?? 0) + 5, "seconds");
          break;
        case "ArrowLeft": {
          e.preventDefault();
          const prev =
            currentPlayIndex === null
              ? plays.length - 1
              : Math.max(0, currentPlayIndex - 1);
          if (plays[prev]) {
            setCurrentPlayIndex(prev);
            player?.seekTo(plays[prev].start_time, "seconds");
          }
          break;
        }
        case "ArrowRight": {
          e.preventDefault();
          const next =
            currentPlayIndex === null
              ? 0
              : Math.min(plays.length - 1, currentPlayIndex + 1);
          if (plays[next]) {
            setCurrentPlayIndex(next);
            player?.seekTo(plays[next].start_time, "seconds");
          }
          break;
        }
        case "1":
          setPlaybackRate(0.25);
          break;
        case "2":
          setPlaybackRate(0.5);
          break;
        case "3":
          setPlaybackRate(1);
          break;
        case "s":
        case "S":
          if (taggingMode === "idle" || taggingMode === "started") {
            setPendingStart(player?.getCurrentTime() ?? 0);
            setTaggingMode("started");
          }
          break;
        case "e":
        case "E":
          if (taggingMode === "started") {
            setTaggingMode("form");
          }
          break;
        case "p":
        case "P":
          toggleLoop();
          break;
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playing, taggingMode, plays, currentPlayIndex]);

  if (!game) return null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 2,
          py: 1,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <IconButton size="small" onClick={() => router.push("/games")}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6">{game.title}</Typography>
        {(game.home_team || game.away_team) && (
          <Typography variant="body2" color="text.secondary">
            {game.home_team ?? "?"} vs {game.away_team ?? "?"}
          </Typography>
        )}
      </Box>

      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            bgcolor: "black",
            minWidth: 0,
          }}
        >
          <VideoPlayer
            videoSource={game.video_source}
            videoRef={game.video_ref}
          />
        </Box>

        <Divider orientation="vertical" flexItem />

        <Paper
          square
          elevation={0}
          sx={{
            width: 320,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <TaggingPanel gameId={id} />
        </Paper>
      </Box>

      <ShortcutCheatsheet />
    </Box>
  );
}
