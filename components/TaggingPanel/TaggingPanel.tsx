"use client";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useFilmStore } from "@/store/filmStore";
import PlayList from "@/components/PlayList/PlayList";
import TagForm from "@/components/TagForm/TagForm";
import { Play } from "@/types";

interface Props {
  gameId: string;
  readOnly?: boolean;
}

export default function TaggingPanel({ gameId, readOnly = false }: Props) {
  const taggingMode = useFilmStore((s) => s.taggingMode);
  const addPlay = useFilmStore((s) => s.addPlay);
  const updatePlay = useFilmStore((s) => s.updatePlay);
  const removePlay = useFilmStore((s) => s.removePlay);
  const setTaggingMode = useFilmStore((s) => s.setTaggingMode);
  const setEditingPlay = useFilmStore((s) => s.setEditingPlay);
  const setPendingStart = useFilmStore((s) => s.setPendingStart);

  const [deleteTarget, setDeleteTarget] = useState<Play | null>(null);
  const [deleting, setDeleting] = useState(false);

  function handleSaved(play: Play) {
    if (taggingMode === "editing") {
      updatePlay(play);
    } else {
      addPlay(play);
    }
    setPendingStart(null);
    setTaggingMode("idle");
    setEditingPlay(null);
  }

  function handleCancel() {
    setPendingStart(null);
    setTaggingMode("idle");
    setEditingPlay(null);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    await fetch(`/api/plays/${deleteTarget.id}`, { method: "DELETE" });
    removePlay(deleteTarget.id);
    setDeleteTarget(null);
    setDeleting(false);
  }

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {taggingMode === "form" || taggingMode === "editing"
            ? taggingMode === "editing"
              ? "Edit Play"
              : "Tag Play"
            : "Play List"}
        </Typography>
        {taggingMode === "started" && (
          <Typography variant="caption" color="primary">
            Play started — press E to mark end
          </Typography>
        )}
      </Box>
      <Divider />

      <Box sx={{ flex: 1, overflowY: "auto" }}>
        {!readOnly && (taggingMode === "form" || taggingMode === "editing") ? (
          <TagForm
            gameId={gameId}
            onSaved={handleSaved}
            onCancel={handleCancel}
          />
        ) : (
          <PlayList onDelete={(play) => setDeleteTarget(play)} readOnly={readOnly} />
        )}
      </Box>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete play?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This play will be permanently deleted.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
