"use client";

import { useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useFilmStore } from "@/store/filmStore";
import { Play, PlayType, PlayResult } from "@/types";

const PLAY_TYPES: PlayType[] = ["run", "pass", "kick", "punt", "penalty"];

const TYPE_LABELS: Record<PlayType, string> = {
  run: "RUN",
  pass: "PASS",
  kick: "KICK",
  punt: "PUNT",
  penalty: "PEN",
};

const TYPE_COLORS: Record<PlayType, string> = {
  run: "#f5a623",
  pass: "#60a5fa",
  kick: "#a78bfa",
  punt: "#a78bfa",
  penalty: "#fbbf24",
};

// Two tint depths per type — alternating within consecutive same-type runs
const TYPE_TINTS: Record<PlayType, [string, string]> = {
  run: ["rgba(245, 166, 35, 0.05)", "rgba(245, 166, 35, 0.11)"],
  pass: ["rgba(96, 165, 250, 0.08)", "rgba(96, 165, 250, 0.16)"],
  kick: ["rgba(167, 139, 250, 0.08)", "rgba(167, 139, 250, 0.16)"],
  punt: ["rgba(167, 139, 250, 0.08)", "rgba(167, 139, 250, 0.16)"],
  penalty: ["rgba(251, 191, 36, 0.08)", "rgba(251, 191, 36, 0.16)"],
};

const OUTCOME_FG: Record<PlayResult, string> = {
  touchdown: "#34d399",
  gain: "#a8b0bb",
  loss: "#f87171",
  incomplete: "#94a3b8",
  penalty: "#fbbf24",
  turnover: "#f87171",
  sack: "#f87171",
  rouge: "#34d399",
};

const OUTCOME_DOT: Record<PlayResult, string> = {
  touchdown: "#34d399",
  gain: "#4a5563",
  loss: "#f87171",
  incomplete: "#64748b",
  penalty: "#fbbf24",
  turnover: "#f87171",
  sack: "#f87171",
  rouge: "#34d399",
};

const MONO = "ui-monospace, SFMono-Regular, monospace";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function computeZebra(plays: Play[]): number[] {
  const out: number[] = [];
  let lastType: PlayType | null = null;
  let counter = 0;
  for (const p of plays) {
    if (p.play_type !== lastType) {
      counter = 0;
      lastType = p.play_type;
    }
    out.push(counter % 2);
    counter += 1;
  }
  return out;
}

interface Props {
  onDelete: (play: Play) => void;
  readOnly?: boolean;
}

export default function PlayList({ onDelete, readOnly = false }: Props) {
  const plays = useFilmStore((s) => s.plays);
  const currentPlayIndex = useFilmStore((s) => s.currentPlayIndex);
  const playerRef = useFilmStore((s) => s.playerRef);
  const setCurrentPlayIndex = useFilmStore((s) => s.setCurrentPlayIndex);
  const setEditingPlay = useFilmStore((s) => s.setEditingPlay);
  const setTaggingMode = useFilmStore((s) => s.setTaggingMode);

  const [typeFilter, setTypeFilter] = useState<PlayType | null>(null);

  const visible = useMemo(
    () => (typeFilter ? plays.filter((p) => p.play_type === typeFilter) : plays),
    [plays, typeFilter]
  );

  const zebra = useMemo(() => computeZebra(visible), [visible]);

  const typeCounts = useMemo(() => {
    const counts: Partial<Record<PlayType, number>> = {};
    for (const p of plays) {
      counts[p.play_type] = (counts[p.play_type] ?? 0) + 1;
    }
    return counts;
  }, [plays]);

  function jumpTo(globalIndex: number) {
    const play = plays[globalIndex];
    if (!play) return;
    setCurrentPlayIndex(globalIndex);
    playerRef.current?.seekTo(play.start_time, "seconds");
  }

  function handleEdit(e: React.MouseEvent, play: Play) {
    e.stopPropagation();
    setEditingPlay(play);
    setTaggingMode("editing");
  }

  if (plays.length === 0) {
    return (
      <Box
        sx={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#141b26",
        }}
      >
        <Typography sx={{ color: "#5c6675", fontSize: 13 }}>
          No plays tagged yet. Press S to mark play start.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        background: "#141b26",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          pt: "14px",
          pb: "6px",
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <Typography sx={{ color: "#e8eaed", fontSize: 14, fontWeight: 700 }}>
          Filter by playtype
        </Typography>
        <Typography sx={{ color: "#5c6675", fontSize: 11 }}>
          {plays.length} plays
        </Typography>
      </Box>

      {/* Summary strip */}
      <Box
        sx={{
          px: 2,
          pb: "6px",
          display: "flex",
          gap: "12px",
          flexShrink: 0,
          flexWrap: "wrap",
        }}
      >
        {PLAY_TYPES.filter((t) => typeCounts[t]).map((t) => (
          <Box
            key={t}
            sx={{ display: "flex", alignItems: "center", gap: "4px" }}
          >
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: TYPE_COLORS[t],
                flexShrink: 0,
              }}
            />
            <Typography sx={{ color: "#8a93a0", fontSize: 10.5 }}>
              {typeCounts[t]} {t}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Filter chips */}
      <Box
        sx={{
          px: 1.5,
          pt: "6px",
          pb: "10px",
          display: "flex",
          gap: "5px",
          flexWrap: "wrap",
          flexShrink: 0,
        }}
      >
        <Box
          component="span"
          onClick={() => setTypeFilter(null)}
          sx={{
            px: "9px",
            py: "3px",
            background:
              typeFilter === null ? "rgba(245,166,35,0.12)" : "transparent",
            border: `1px solid ${typeFilter === null ? "rgba(245,166,35,0.4)" : "#2a3340"}`,
            borderRadius: "11px",
            color: typeFilter === null ? "#f5a623" : "#8a93a0",
            fontSize: 10.5,
            fontWeight: 500,
            cursor: "pointer",
            userSelect: "none",
            transition: "all 120ms",
          }}
        >
          All
        </Box>
        {PLAY_TYPES.map((t) => {
          const active = typeFilter === t;
          const tc = TYPE_COLORS[t];
          return (
            <Box
              key={t}
              component="span"
              onClick={() => setTypeFilter(active ? null : t)}
              sx={{
                px: "9px",
                py: "3px",
                background: active ? `${tc}1f` : "transparent",
                border: `1px solid ${active ? `${tc}66` : "#2a3340"}`,
                borderRadius: "11px",
                color: active ? tc : "#8a93a0",
                fontSize: 10.5,
                fontWeight: 500,
                textTransform: "capitalize",
                cursor: "pointer",
                userSelect: "none",
                transition: "all 120ms",
              }}
            >
              {t}
            </Box>
          );
        })}
      </Box>

      {/* Scrollable play rows */}
      <Box sx={{ flex: 1, overflowY: "auto", minHeight: 0, px: "6px", py: "2px" }}>
        {visible.length === 0 ? (
          <Box sx={{ p: 2 }}>
            <Typography sx={{ color: "#5c6675", fontSize: 13 }}>
              No {typeFilter} plays tagged.
            </Typography>
          </Box>
        ) : (
          visible.map((play, idx) => {
            const globalIndex = plays.indexOf(play);
            const isSelected = currentPlayIndex === globalIndex;
            const bg = isSelected
              ? "rgba(163,230,53,0.18)"
              : TYPE_TINTS[play.play_type][zebra[idx]];
            const tc = TYPE_COLORS[play.play_type];
            const outcomeFg = OUTCOME_FG[play.result];
            const outcomeDot = OUTCOME_DOT[play.result];

            return (
              <Box
                key={play.id}
                onClick={() => jumpTo(globalIndex)}
                sx={{
                  position: "relative",
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  alignItems: "center",
                  columnGap: "10px",
                  height: 44,
                  pr: "8px",
                  pl: "14px",
                  mb: "2px",
                  borderRadius: "6px",
                  background: bg,
                  cursor: "pointer",
                  overflow: "hidden",
                  outline: `1px solid ${isSelected ? "rgba(163,230,53,0.45)" : "transparent"}`,
                  outlineOffset: "-1px",
                  transition: "outline-color 80ms, background 80ms",
                  "&:hover": {
                    outlineColor: isSelected ? "rgba(163,230,53,0.45)" : "rgba(255,255,255,0.06)",
                    "& .play-actions": { opacity: 1 },
                  },
                }}
              >
                {/* Left type rail */}
                <Box
                  sx={{
                    position: "absolute",
                    left: 0,
                    top: 6,
                    bottom: 6,
                    width: 3,
                    background: tc,
                    borderRadius: "2px",
                  }}
                />

                {/* Body: type tag + outcome + meta */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                    minWidth: 0,
                  }}
                >
                  <Box
                    sx={{ display: "flex", alignItems: "center", gap: "8px" }}
                  >
                    <Typography
                      sx={{
                        color: tc,
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.5px",
                        fontFamily: MONO,
                      }}
                    >
                      {TYPE_LABELS[play.play_type]}
                    </Typography>
                    <Typography
                      sx={{
                        color: outcomeFg,
                        fontSize: 13,
                        fontWeight: 600,
                        textTransform: "capitalize",
                        lineHeight: 1.2,
                      }}
                    >
                      {play.result}
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      fontSize: 10.5,
                      color: "#5c6675",
                      fontFamily: MONO,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatTime(play.start_time)} · #{idx + 1}
                  </Typography>
                </Box>

                {/* Right: player slot + outcome dot + actions */}
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: "4px",
                      minWidth: 36,
                    }}
                  >
                    <Typography
                      title="Player — not yet tagged"
                      sx={{
                        fontSize: 10.5,
                        color: "#4a5563",
                        fontStyle: "italic",
                        fontFamily: MONO,
                      }}
                    >
                      n/a
                    </Typography>
                    <Box
                      title={play.result}
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: outcomeDot,
                      }}
                    />
                  </Box>

                  {!readOnly && (
                    <Box
                      className="play-actions"
                      sx={{
                        display: "flex",
                        gap: "2px",
                        opacity: 0,
                        transition: "opacity 120ms",
                      }}
                    >
                      <Box
                        component="button"
                        onClick={(e) => handleEdit(e as React.MouseEvent, play)}
                        title="Edit"
                        sx={{
                          width: 22,
                          height: 22,
                          p: 0,
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          color: "#6b7280",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "3px",
                          "&:hover": { color: "#e8eaed" },
                        }}
                      >
                        <EditIcon sx={{ fontSize: 13 }} />
                      </Box>
                      <Box
                        component="button"
                        onClick={(e) => {
                          (e as React.MouseEvent).stopPropagation();
                          onDelete(play);
                        }}
                        title="Delete"
                        sx={{
                          width: 22,
                          height: 22,
                          p: 0,
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          color: "#6b7280",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "3px",
                          "&:hover": { color: "#f87171" },
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: 13 }} />
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
}
