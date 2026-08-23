"use client";

import { useEffect, use, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Box, Button, Divider, Paper } from "@mui/material";
import EditOffIcon from "@mui/icons-material/EditOff";
import EditIcon from "@mui/icons-material/Edit";
import AppNav from "@/components/AppNav/AppNav";
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const readOnly = searchParams.get("mode") === "view";
  const [panelOpen, setPanelOpen] = useState(true);

  function toggleReadOnly() {
    router.replace(readOnly ? pathname : `${pathname}?mode=view`);
  }

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
          if (!readOnly && (taggingMode === "idle" || taggingMode === "started")) {
            setPendingStart(player?.getCurrentTime() ?? 0);
            setTaggingMode("started");
          }
          break;
        case "e":
        case "E":
          if (!readOnly && taggingMode === "started") {
            setPlaying(false);
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

  const teamsLabel =
    game.home_team || game.away_team
      ? `${game.home_team ?? "?"} vs ${game.away_team ?? "?"}`
      : undefined;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <AppNav
        title={game.title}
        subtitle={teamsLabel}
        backHref="/games"
        panelOpen={panelOpen}
        onTogglePanel={() => setPanelOpen((o) => !o)}
        actions={
          <Button
            size="small"
            variant={readOnly ? "contained" : "outlined"}
            color={readOnly ? "warning" : "inherit"}
            startIcon={readOnly ? <EditOffIcon /> : <EditIcon />}
            onClick={toggleReadOnly}
          >
            {readOnly ? "View only" : "Edit mode"}
          </Button>
        }
      />

      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <Box sx={{ flex: 1, minHeight: 0, bgcolor: "black" }}>
            <VideoPlayer
              videoSource={game.video_source}
              videoRef={game.video_ref}
            />
          </Box>
          <ShortcutCheatsheet readOnly={readOnly} />
        </Box>

        {panelOpen && (
          <>
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
              <TaggingPanel gameId={id} readOnly={readOnly} />
            </Paper>
          </>
        )}
      </Box>
    </Box>
  );
}
