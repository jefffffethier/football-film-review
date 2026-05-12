"use client";

import { useState } from "react";
import {
  Box,
  Chip,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useFilmStore } from "@/store/filmStore";
import { Play, PlayType } from "@/types";

const PLAY_TYPES: PlayType[] = ["run", "pass", "kick", "punt", "penalty"];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function downLabel(down: number | null): string {
  if (down === null) return "n/a";
  const suffixes = ["st", "nd", "rd", "th"] as const;
  return `${down}${suffixes[Math.min(down - 1, 3)]}`;
}

function playLabel(play: Play): string {
  const yard = play.yard_line ? ` & ${play.yard_line}` : "";
  return `${downLabel(play.down)}${yard} | ${play.play_type} | ${play.result}`;
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

  function jumpTo(index: number) {
    const play = plays[index];
    if (!play) return;
    setCurrentPlayIndex(index);
    playerRef.current?.seekTo(play.start_time, "seconds");
  }

  function handleEdit(e: React.MouseEvent, play: Play) {
    e.stopPropagation();
    setEditingPlay(play);
    setTaggingMode("editing");
  }

  const visible = typeFilter ? plays.filter((p) => p.play_type === typeFilter) : plays;

  if (plays.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="text.secondary" variant="body2">
          No plays tagged yet. Press S to mark play start.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ px: 1.5, py: 1, display: "flex", flexWrap: "wrap", gap: 0.5 }}>
        {PLAY_TYPES.map((t) => (
          <Chip
            key={t}
            label={t}
            size="small"
            variant={typeFilter === t ? "filled" : "outlined"}
            color={typeFilter === t ? "primary" : "default"}
            onClick={() => setTypeFilter(typeFilter === t ? null : t)}
          />
        ))}
      </Box>
      <Divider />

      {visible.length === 0 ? (
        <Box sx={{ p: 2 }}>
          <Typography color="text.secondary" variant="body2">
            No {typeFilter} plays tagged.
          </Typography>
        </Box>
      ) : (
        <List dense disablePadding>
          {visible.map((play) => {
            const i = plays.indexOf(play);
            return (
              <Box key={play.id}>
                <ListItemButton
                  selected={currentPlayIndex === i}
                  onClick={() => jumpTo(i)}
                  sx={{ pr: readOnly ? 2 : 10 }}
                >
                  <ListItemText
                    primary={
                      <Typography variant="body2">{playLabel(play)}</Typography>
                    }
                    secondary={
                      <Typography variant="caption">
                        {formatTime(play.start_time)}
                      </Typography>
                    }
                  />
                  {!readOnly && (
                    <ListItemSecondaryAction>
                      <IconButton
                        size="small"
                        onClick={(e) => handleEdit(e, play)}
                        sx={{ mr: 0.5 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(play);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  )}
                </ListItemButton>
                <Divider />
              </Box>
            );
          })}
        </List>
      )}
    </Box>
  );
}
