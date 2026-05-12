"use client";

import { useEffect, useState } from "react";
import {
  Box,
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
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Populate fields whenever the target game changes
  useEffect(() => {
    if (game) {
      setTitle(game.title);
      setDate(game.date);
      setHomeTeam(game.home_team ?? "");
      setAwayTeam(game.away_team ?? "");
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
        home_team: homeTeam || null,
        away_team: awayTeam || null,
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
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="Home Team"
                value={homeTeam}
                onChange={(e) => setHomeTeam(e.target.value)}
                fullWidth
              />
              <TextField
                label="Away Team"
                value={awayTeam}
                onChange={(e) => setAwayTeam(e.target.value)}
                fullWidth
              />
            </Box>
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
