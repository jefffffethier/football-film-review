"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import ReactPlayer from "react-player";
import { Box, Chip, IconButton, Slider, Typography } from "@mui/material";
import LoopIcon from "@mui/icons-material/Loop";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import BrokenImageIcon from "@mui/icons-material/BrokenImage";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeDownIcon from "@mui/icons-material/VolumeDown";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import { useFilmStore } from "@/store/filmStore";

function fmt(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
}

interface Props {
  videoSource: "youtube" | "s3";
  videoRef: string;
}

export default function VideoPlayer({ videoSource, videoRef }: Props) {
  const playerRef = useFilmStore((s) => s.playerRef);
  const loopActive = useFilmStore((s) => s.loopActive);
  const playing = useFilmStore((s) => s.playing);
  const playbackRate = useFilmStore((s) => s.playbackRate);
  const plays = useFilmStore((s) => s.plays);
  const currentPlayIndex = useFilmStore((s) => s.currentPlayIndex);
  const pendingStart = useFilmStore((s) => s.pendingStart);
  const setPlaying = useFilmStore((s) => s.setPlaying);
  const setStoreDuration = useFilmStore((s) => s.setDuration);
  const draftTiming = useFilmStore((s) => s.draftTiming);

  const [url, setUrl] = useState("");
  const [loadError, setLoadError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const dragging = useRef(false);

  // Zoom/pan state — transform-origin is the container's top-left, so
  // (tx, ty) are pixel offsets and scale multiplies from there.
  const [zoom, setZoom] = useState({ scale: 1, tx: 0, ty: 0 });
  const zoomContainerRef = useRef<HTMLDivElement | null>(null);
  const panState = useRef<{ startX: number; startY: number; startTx: number; startTy: number } | null>(null);

  const clampPan = useCallback((tx: number, ty: number, scale: number, rect: { width: number; height: number }) => {
    const contentW = rect.width * scale;
    const contentH = rect.height * scale;
    const minTx = Math.min(0, rect.width - contentW);
    const minTy = Math.min(0, rect.height - contentH);
    return {
      tx: Math.max(minTx, Math.min(0, tx)),
      ty: Math.max(minTy, Math.min(0, ty)),
    };
  }, []);

  const handleZoomWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setZoom((prev) => {
        const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
        const newScale = Math.max(1, Math.min(8, prev.scale * factor));
        if (newScale === 1) return { scale: 1, tx: 0, ty: 0 };

        const contentX = (mouseX - prev.tx) / prev.scale;
        const contentY = (mouseY - prev.ty) / prev.scale;
        const rawTx = mouseX - contentX * newScale;
        const rawTy = mouseY - contentY * newScale;
        const { tx, ty } = clampPan(rawTx, rawTy, newScale, rect);
        return { scale: newScale, tx, ty };
      });
    },
    [clampPan]
  );

  const handleZoomMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (zoom.scale === 1) return;
    panState.current = { startX: e.clientX, startY: e.clientY, startTx: zoom.tx, startTy: zoom.ty };

    const rect = e.currentTarget.getBoundingClientRect();
    const onMove = (ev: MouseEvent) => {
      const start = panState.current;
      if (!start) return;
      const dx = ev.clientX - start.startX;
      const dy = ev.clientY - start.startY;
      setZoom((prev) => {
        const { tx, ty } = clampPan(start.startTx + dx, start.startTy + dy, prev.scale, rect);
        return { ...prev, tx, ty };
      });
    };
    const onUp = () => {
      panState.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [zoom.scale, zoom.tx, zoom.ty, clampPan]);

  const handleZoomDoubleClick = useCallback(() => {
    setZoom({ scale: 1, tx: 0, ty: 0 });
  }, []);

  // Reset zoom whenever the selected tagged play changes.
  useEffect(() => {
    setZoom({ scale: 1, tx: 0, ty: 0 });
  }, [currentPlayIndex]);

  useEffect(() => {
    setLoadError(false);
    if (videoSource === "youtube") {
      setUrl(videoRef);
    } else {
      fetch("/api/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: videoRef }),
      })
        .then((r) => r.json())
        .then((d: { url?: string }) => {
          if (d.url) setUrl(d.url);
          else setLoadError(true);
        })
        .catch(() => setLoadError(true));
    }
  }, [videoSource, videoRef]);

  // Loop boundary polling
  useEffect(() => {
    if (!loopActive || currentPlayIndex === null) return;
    const play = plays[currentPlayIndex];
    if (!play) return;

    const interval = setInterval(() => {
      const current = playerRef.current?.getCurrentTime() ?? 0;
      if (current >= play.end_time) {
        playerRef.current?.seekTo(play.start_time, "seconds");
      }
    }, 250);

    return () => clearInterval(interval);
  }, [loopActive, currentPlayIndex, plays]);

  const seekToFraction = useCallback(
    (clientX: number, rect: DOMRect) => {
      if (!duration) return;
      const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      playerRef.current?.seekTo(frac * duration, "seconds");
      setCurrentTime(frac * duration);
    },
    [duration, playerRef]
  );

  const handleScrubberMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      dragging.current = true;
      seekToFraction(e.clientX, e.currentTarget.getBoundingClientRect());

      const onMove = (ev: MouseEvent) => {
        if (!dragging.current) return;
        seekToFraction(ev.clientX, (e.currentTarget as HTMLDivElement).getBoundingClientRect());
      };
      const onUp = () => {
        dragging.current = false;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [seekToFraction]
  );

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  const videoSlot = (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        aspectRatio: "16/9",
        maxHeight: "100%",
        bgcolor: "black",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {loadError ? (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, color: "text.disabled" }}>
          <BrokenImageIcon sx={{ fontSize: 48 }} />
          <Typography variant="body2">
            {videoSource === "s3"
              ? "Video not found — check the S3 key on this game."
              : "Could not load video — check the YouTube URL."}
          </Typography>
        </Box>
      ) : !url ? (
        <Typography variant="body2" color="text.disabled">Loading…</Typography>
      ) : (
        <>
          <Box
            ref={zoomContainerRef}
            sx={{
              position: "absolute",
              inset: 0,
              overflow: "hidden",
              transformOrigin: "0 0",
              transform: `translate(${zoom.tx}px, ${zoom.ty}px) scale(${zoom.scale})`,
            }}
          >
            <ReactPlayer
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ref={playerRef as any}
              url={url}
              playing={playing}
              volume={volume}
              muted={muted}
              playbackRate={playbackRate}
              progressInterval={250}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onProgress={({ playedSeconds }) => {
                if (!dragging.current) setCurrentTime(playedSeconds);
              }}
              onDuration={(d) => { setDuration(d); setStoreDuration(d); }}
              onError={() => setLoadError(true)}
              width="100%"
              height="100%"
              controls={false}
              config={
                videoSource === "youtube"
                  ? { youtube: { playerVars: { disablekb: 1 } } }
                  : {}
              }
            />
          </Box>

          {/* Transparent layer that captures wheel/drag gestures for zoom & pan */}
          <Box
            onWheel={handleZoomWheel}
            onMouseDown={handleZoomMouseDown}
            onDoubleClick={handleZoomDoubleClick}
            sx={{
              position: "absolute",
              inset: 0,
              cursor: zoom.scale > 1 ? "grab" : "default",
              "&:active": { cursor: zoom.scale > 1 ? "grabbing" : "default" },
            }}
          />

          {loopActive && (
            <Chip
              icon={<LoopIcon />}
              label="Loop"
              size="small"
              color="primary"
              sx={{ position: "absolute", top: 8, left: 8, pointerEvents: "none" }}
            />
          )}
          {zoom.scale !== 1 && (
            <Chip
              label={`${Math.round(zoom.scale * 100)}%`}
              size="small"
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                pointerEvents: "none",
                bgcolor: "rgba(0,0,0,0.6)",
                color: "white",
              }}
            />
          )}
        </>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", width: "100%", height: "100%" }}>
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "black",
          overflow: "hidden",
        }}
      >
        {videoSlot}
      </Box>

      {/* Controls bar */}
      <Box
        sx={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 1,
          py: 0.75,
          bgcolor: "#0a0a0a",
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <IconButton
          size="small"
          onClick={() => setPlaying(!playing)}
          sx={{ color: "white", flexShrink: 0 }}
        >
          {playing ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
        </IconButton>

        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            flexShrink: 0,
            fontVariantNumeric: "tabular-nums",
            minWidth: 36,
          }}
        >
          {fmt(currentTime)}
        </Typography>

        {/* Scrubber */}
        <Box
          onMouseDown={handleScrubberMouseDown}
          sx={{
            flex: 1,
            height: 20,
            position: "relative",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            userSelect: "none",
          }}
        >
          {/* Track */}
          <Box
            sx={{
              width: "100%",
              height: 4,
              bgcolor: "grey.800",
              borderRadius: 1,
              position: "relative",
            }}
          >
            {/* Played portion */}
            <Box
              sx={{
                position: "absolute",
                left: 0,
                top: 0,
                height: "100%",
                width: `${pct}%`,
                bgcolor: "grey.500",
                borderRadius: 1,
              }}
            />

            {/* Tagged play segments */}
            {duration > 0 &&
              plays.map((play, i) => (
                <Box
                  key={play.id}
                  sx={{
                    position: "absolute",
                    top: -3,
                    height: 10,
                    left: `${(play.start_time / duration) * 100}%`,
                    width: `${Math.max(0.4, ((play.end_time - play.start_time) / duration) * 100)}%`,
                    bgcolor:
                      i === currentPlayIndex ? "#a3e635" : "primary.dark",
                    borderRadius: 0.5,
                    opacity: i === currentPlayIndex ? 1 : 0.6,
                  }}
                />
              ))}

            {/* Draft timing overlay while adjusting in edit form */}
            {draftTiming && duration > 0 && (
              <Box
                sx={{
                  position: "absolute",
                  top: -3,
                  height: 10,
                  left: `${(draftTiming.start / duration) * 100}%`,
                  width: `${Math.max(0.4, ((draftTiming.end - draftTiming.start) / duration) * 100)}%`,
                  bgcolor: "warning.main",
                  borderRadius: 0.5,
                  opacity: 0.75,
                  pointerEvents: "none",
                }}
              />
            )}

            {/* Pending start marker (S pressed, waiting for E) */}
            {pendingStart !== null && duration > 0 && (
              <Box
                sx={{
                  position: "absolute",
                  top: -5,
                  height: 14,
                  width: 2,
                  left: `${(pendingStart / duration) * 100}%`,
                  bgcolor: "warning.main",
                  transform: "translateX(-50%)",
                  borderRadius: 0.5,
                }}
              />
            )}

            {/* Playhead */}
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: `${pct}%`,
                transform: "translate(-50%, -50%)",
                width: 12,
                height: 12,
                bgcolor: "white",
                borderRadius: "50%",
                boxShadow: "0 0 0 2px rgba(255,255,255,0.3)",
                pointerEvents: "none",
              }}
            />
          </Box>
        </Box>

        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            flexShrink: 0,
            fontVariantNumeric: "tabular-nums",
            minWidth: 36,
          }}
        >
          {fmt(duration)}
        </Typography>

        {videoSource === "s3" && (
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              flexShrink: 0,
              minWidth: 28,
              textAlign: "right",
            }}
          >
            {playbackRate}×
          </Typography>
        )}

        {/* Volume controls */}
        <IconButton
          size="small"
          onClick={() => setMuted((m) => !m)}
          sx={{ color: "white", flexShrink: 0 }}
        >
          {muted || volume === 0 ? (
            <VolumeOffIcon fontSize="small" />
          ) : volume < 0.5 ? (
            <VolumeDownIcon fontSize="small" />
          ) : (
            <VolumeUpIcon fontSize="small" />
          )}
        </IconButton>
        <Slider
          size="small"
          min={0}
          max={1}
          step={0.01}
          value={muted ? 0 : volume}
          onChange={(_e, val) => {
            const v = val as number;
            setVolume(v);
            if (v > 0 && muted) setMuted(false);
            if (v === 0) setMuted(true);
          }}
          sx={{
            width: 80,
            flexShrink: 0,
            color: "grey.400",
            "& .MuiSlider-thumb": { width: 10, height: 10 },
          }}
        />
      </Box>
    </Box>
  );
}
