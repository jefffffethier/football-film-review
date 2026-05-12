"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { Game } from "@/types";

interface Props {
  open: boolean;
  game: Game | null;
  onClose: () => void;
  onSaved: (game: Game) => void;
}

export default function EditGameModal({ open, game, onClose, onSaved }: Props) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [opponent, setOpponent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Populate fields whenever the target game changes
  useEffect(() => {
    if (game) {
      setTitle(game.title);
      setDate(game.date);
      setOpponent(game.opponent ?? "");
      setError("");
    }
  }, [game]);

  function handleClose() {
    if (!loading) onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!game) return;
    setLoading(true);
    setError("");

    const res = await fetch(`/api/games/${game.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        date,
        opponent: opponent || null,
      }),
    });

    if (res.ok) {
      const updated: Game = await res.json();
      onSaved(updated);
      onClose();
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to save changes");
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Game</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Opponent"
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
              fullWidth
            />
            {error && (
              <Typography variant="body2" color="error">
                {error}
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
