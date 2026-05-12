"use client";

import {
  Box,
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
import { Play } from "@/types";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function playLabel(play: Play): string {
  const yard = play.yard_line ? ` & ${play.yard_line}` : "";
  return `${play.down}${ordinal(play.down)}${yard} | ${play.play_type} | ${play.result}`;
}

function ordinal(n: number): string {
  return (["st", "nd", "rd", "th"] as const)[Math.min(n - 1, 3)] ?? "th";
}

interface Props {
  onDelete: (play: Play) => void;
}

export default function PlayList({ onDelete }: Props) {
  const plays = useFilmStore((s) => s.plays);
  const currentPlayIndex = useFilmStore((s) => s.currentPlayIndex);
  const playerRef = useFilmStore((s) => s.playerRef);
  const setCurrentPlayIndex = useFilmStore((s) => s.setCurrentPlayIndex);
  const setEditingPlay = useFilmStore((s) => s.setEditingPlay);
  const setTaggingMode = useFilmStore((s) => s.setTaggingMode);

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
    <List dense disablePadding>
      {plays.map((play, i) => (
        <Box key={play.id}>
          <ListItemButton
            selected={currentPlayIndex === i}
            onClick={() => jumpTo(i)}
            sx={{ pr: 10 }}
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
          </ListItemButton>
          <Divider />
        </Box>
      ))}
    </List>
  );
}
