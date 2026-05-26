"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Collapse,
  MenuItem,
  Slider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useFilmStore } from "@/store/filmStore";
import { Play } from "@/types";

function fmt(secs: number) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

interface FormState {
  down: string;
  yard_line: string;
  field_zone: string;
  play_type: string;
  formation: string;
  result: string;
  notes: string;
}

const empty: FormState = {
  down: "",
  yard_line: "",
  field_zone: "",
  play_type: "",
  formation: "",
  result: "",
  notes: "",
};

function playToForm(play: Play): FormState {
  return {
    down: play.down !== null ? String(play.down) : "na",
    yard_line: play.yard_line !== null ? String(play.yard_line) : "",
    field_zone: play.field_zone ?? "",
    play_type: play.play_type,
    formation: play.formation ?? "",
    result: play.result,
    notes: play.notes ?? "",
  };
}

interface Props {
  gameId: string;
  onSaved: (play: Play) => void;
  onCancel: () => void;
}

export default function TagForm({ gameId, onSaved, onCancel }: Props) {
  const pendingStart = useFilmStore((s) => s.pendingStart);
  const playerRef = useFilmStore((s) => s.playerRef);
  const taggingMode = useFilmStore((s) => s.taggingMode);
  const editingPlay = useFilmStore((s) => s.editingPlay);
  const game = useFilmStore((s) => s.game);
  const duration = useFilmStore((s) => s.duration);
  const setDraftTiming = useFilmStore((s) => s.setDraftTiming);
  const downsConfig = game?.downs_config ?? 4;

  const [form, setForm] = useState<FormState>(empty);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timingOpen, setTimingOpen] = useState(false);
  const [draftStart, setDraftStart] = useState(0);
  const [draftEnd, setDraftEnd] = useState(0);

  useEffect(() => {
    if (taggingMode === "editing" && editingPlay) {
      setForm(playToForm(editingPlay));
      setDraftStart(editingPlay.start_time);
      setDraftEnd(editingPlay.end_time);
      setTimingOpen(false);
      setDraftTiming(null);
    } else {
      setForm(empty);
      const current = playerRef.current?.getCurrentTime() ?? null;
      setEndTime(current);
    }
  }, [taggingMode, editingPlay]);

  useEffect(() => {
    return () => { setDraftTiming(null); };
  }, [setDraftTiming]);

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleTimingToggle() {
    const next = !timingOpen;
    setTimingOpen(next);
    if (next) {
      playerRef.current?.seekTo(draftStart, "seconds");
      setDraftTiming({ start: draftStart, end: draftEnd });
    } else {
      setDraftTiming(null);
    }
  }

  function handleStartChange(_: Event, val: number | number[]) {
    const v = val as number;
    setDraftStart(v);
    playerRef.current?.seekTo(v, "seconds");
    setDraftTiming({ start: v, end: draftEnd });
  }

  function handleEndChange(_: Event, val: number | number[]) {
    const v = val as number;
    setDraftEnd(v);
    playerRef.current?.seekTo(v, "seconds");
    setDraftTiming({ start: draftStart, end: v });
  }

  function handleCancel() {
    setDraftTiming(null);
    onCancel();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const down = form.down === "na" || form.down === "" ? null : Number(form.down);
    const payload =
      taggingMode === "editing" && editingPlay
        ? {
            start_time: draftStart,
            end_time: draftEnd,
            down,
            yard_line: form.yard_line ? Number(form.yard_line) : null,
            field_zone: form.field_zone || null,
            play_type: form.play_type,
            formation: form.formation || null,
            result: form.result,
            notes: form.notes || null,
          }
        : {
            game_id: gameId,
            start_time: pendingStart,
            end_time: endTime,
            down,
            yard_line: form.yard_line ? Number(form.yard_line) : null,
            field_zone: form.field_zone || null,
            play_type: form.play_type,
            formation: form.formation || null,
            result: form.result,
            notes: form.notes || null,
          };

    const isEdit = taggingMode === "editing" && editingPlay;
    const res = await fetch(
      isEdit ? `/api/plays/${editingPlay!.id}` : "/api/plays",
      {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (res.ok) {
      const play = await res.json();
      onSaved(play);
    } else {
      const body = await res.json();
      setError(body.error ?? "Failed to save");
    }
    setLoading(false);
  }

  const downs = Array.from({ length: downsConfig }, (_, i) => i + 1);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 2 }}>
        {taggingMode === "editing" ? "Edit Play" : "Tag Play"}
      </Typography>
      <form onSubmit={handleSubmit}>
        <Stack spacing={1.5}>
          <TextField
            select
            label="Down"
            value={form.down}
            onChange={(e) => set("down", e.target.value)}
            size="small"
            fullWidth
          >
            <MenuItem value="na">n/a</MenuItem>
            {downs.map((d) => (
              <MenuItem key={d} value={d}>
                {d}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Yard Line"
            type="number"
            value={form.yard_line}
            onChange={(e) => set("yard_line", e.target.value)}
            size="small"
            fullWidth
            slotProps={{ htmlInput: { min: 1, max: 110 } }}
          />

          <TextField
            select
            label="Field Zone"
            value={form.field_zone}
            onChange={(e) => set("field_zone", e.target.value)}
            size="small"
            fullWidth
          >
            {["own_end", "own_territory", "neutral", "opponent_territory", "red_zone", "opponent_end"].map((z) => (
              <MenuItem key={z} value={z}>
                {z.replace(/_/g, " ")}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Play Type"
            value={form.play_type}
            onChange={(e) => set("play_type", e.target.value)}
            required
            size="small"
            fullWidth
          >
            {["run", "pass", "kick", "punt", "penalty"].map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Formation"
            value={form.formation}
            onChange={(e) => set("formation", e.target.value)}
            size="small"
            fullWidth
          >
            {["shotgun", "under_centre", "pistol", "wildcat", "special_teams"].map((f) => (
              <MenuItem key={f} value={f}>
                {f.replace(/_/g, " ")}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Result"
            value={form.result}
            onChange={(e) => set("result", e.target.value)}
            required
            size="small"
            fullWidth
          >
            {["gain", "loss", "touchdown", "incomplete", "turnover", "sack", "penalty", "rouge"].map((r) => (
              <MenuItem key={r} value={r}>
                {r}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Notes"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            multiline
            rows={2}
            size="small"
            fullWidth
          />

          {taggingMode === "editing" && (
            <Box>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                startIcon={timingOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                onClick={handleTimingToggle}
                sx={{ textTransform: "none", width: "100%", justifyContent: "flex-start" }}
              >
                Adjust Timing
              </Button>
              <Collapse in={timingOpen}>
                <Stack spacing={1.5} sx={{ pt: 1.5 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Start — {fmt(draftStart)}
                    </Typography>
                    <Slider
                      size="small"
                      min={0}
                      max={draftEnd}
                      step={0.25}
                      value={draftStart}
                      onChange={handleStartChange}
                    />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      End — {fmt(draftEnd)}
                    </Typography>
                    <Slider
                      size="small"
                      min={draftStart}
                      max={duration || draftEnd}
                      step={0.25}
                      value={draftEnd}
                      onChange={handleEndChange}
                    />
                  </Box>
                </Stack>
              </Collapse>
            </Box>
          )}

          {error && (
            <Typography variant="caption" color="error">
              {error}
            </Typography>
          )}

          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              type="submit"
              variant="contained"
              size="small"
              disabled={loading}
              fullWidth
            >
              {loading ? "Saving…" : "Save"}
            </Button>
            <Button onClick={handleCancel} size="small" disabled={loading} fullWidth>
              Cancel
            </Button>
          </Box>
        </Stack>
      </form>
    </Box>
  );
}
