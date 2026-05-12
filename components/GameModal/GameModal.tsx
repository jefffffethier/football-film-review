"use client";

import { useState, useRef } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { Game } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (game: Game) => void;
}

const defaultForm = {
  title: "",
  date: "",
  opponent: "",
  video_source: "youtube",
  video_ref: "",
  downs_config: 4,
};

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function uploadToS3(
  file: File,
  presignedUrl: string,
  onProgress: (pct: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presignedUrl);
    xhr.setRequestHeader("Content-Type", file.type || "video/mp4");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status === 200 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`));
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });
}

export default function GameModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // S3 panel state
  const [s3Mode, setS3Mode] = useState<"upload" | "browse">("upload");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadDone, setUploadDone] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [s3Files, setS3Files] = useState<string[] | null>(null);
  const [s3FilesLoading, setS3FilesLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleChange(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSourceChange(source: string) {
    handleChange("video_source", source);
    handleChange("video_ref", "");
    setUploadFile(null);
    setUploadProgress(null);
    setUploadDone(false);
    setUploadError("");
  }

  async function handleBrowseTab() {
    setS3Mode("browse");
    if (s3Files !== null) return;
    setS3FilesLoading(true);
    try {
      const res = await fetch("/api/s3-files");
      const data = await res.json();
      setS3Files(data.keys ?? []);
    } catch {
      setS3Files([]);
    } finally {
      setS3FilesLoading(false);
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFile(file);
    setUploadProgress(0);
    setUploadDone(false);
    setUploadError("");
    handleChange("video_ref", "");

    const key = `games/${Date.now()}-${sanitizeFilename(file.name)}`;

    try {
      const res = await fetch("/api/presign-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, contentType: file.type || "video/mp4" }),
      });
      const { url } = await res.json();

      await uploadToS3(file, url, setUploadProgress);

      handleChange("video_ref", key);
      setUploadDone(true);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
      setUploadProgress(null);
    }

    // Reset input so the same file can be re-selected if needed
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      const game = await res.json();
      onCreated(game);
      handleClose();
    } else {
      const body = await res.json();
      setError(body.error ?? "Failed to create game");
    }
    setLoading(false);
  }

  function handleClose() {
    setForm(defaultForm);
    setError("");
    setUploadFile(null);
    setUploadProgress(null);
    setUploadDone(false);
    setUploadError("");
    setS3Files(null);
    setS3Mode("upload");
    onClose();
  }

  const uploadInProgress = uploadProgress !== null && !uploadDone;
  const canSubmit = !loading && !uploadInProgress;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>New Game</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Title"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              required
              fullWidth
              placeholder="Week 3 vs Tigers"
            />
            <TextField
              label="Date"
              type="date"
              value={form.date}
              onChange={(e) => handleChange("date", e.target.value)}
              required
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Opponent"
              value={form.opponent}
              onChange={(e) => handleChange("opponent", e.target.value)}
              fullWidth
            />
            <TextField
              select
              label="Video Source"
              value={form.video_source}
              onChange={(e) => handleSourceChange(e.target.value)}
              fullWidth
            >
              <MenuItem value="youtube">YouTube</MenuItem>
              <MenuItem value="s3">S3</MenuItem>
            </TextField>

            {form.video_source === "youtube" ? (
              <TextField
                label="YouTube URL"
                value={form.video_ref}
                onChange={(e) => handleChange("video_ref", e.target.value)}
                required
                fullWidth
                placeholder="https://youtube.com/watch?v=..."
              />
            ) : (
              <Box>
                <ToggleButtonGroup
                  value={s3Mode}
                  exclusive
                  size="small"
                  sx={{ mb: 1.5 }}
                  onChange={(_, val) => {
                    if (!val) return;
                    if (val === "browse") handleBrowseTab();
                    else setS3Mode("upload");
                  }}
                >
                  <ToggleButton value="upload">
                    <UploadFileIcon fontSize="small" sx={{ mr: 0.5 }} />
                    Upload file
                  </ToggleButton>
                  <ToggleButton value="browse">
                    <FolderOpenIcon fontSize="small" sx={{ mr: 0.5 }} />
                    Browse existing
                  </ToggleButton>
                </ToggleButtonGroup>

                {s3Mode === "upload" && (
                  <Stack spacing={1}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*,.mp4,.mov,.m4v,.mkv"
                      style={{ display: "none" }}
                      onChange={handleFileSelect}
                    />
                    <Button
                      variant="outlined"
                      startIcon={<UploadFileIcon />}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadInProgress}
                      fullWidth
                    >
                      {uploadFile ? uploadFile.name : "Choose video file"}
                    </Button>

                    {uploadProgress !== null && (
                      <Box>
                        <LinearProgress
                          variant="determinate"
                          value={uploadProgress}
                          color={uploadDone ? "success" : "primary"}
                        />
                        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {uploadDone ? "Upload complete" : `Uploading… ${uploadProgress}%`}
                          </Typography>
                          {uploadDone && (
                            <CheckCircleIcon fontSize="small" color="success" />
                          )}
                        </Box>
                      </Box>
                    )}

                    {uploadDone && (
                      <Typography variant="caption" color="text.secondary" sx={{ wordBreak: "break-all" }}>
                        Key: {form.video_ref}
                      </Typography>
                    )}

                    {uploadError && (
                      <Typography variant="caption" color="error">
                        {uploadError}
                      </Typography>
                    )}
                  </Stack>
                )}

                {s3Mode === "browse" && (
                  <Box
                    sx={{
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1,
                      maxHeight: 200,
                      overflow: "auto",
                    }}
                  >
                    {s3FilesLoading ? (
                      <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                        <CircularProgress size={24} />
                      </Box>
                    ) : s3Files?.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                        No video files found in bucket.
                      </Typography>
                    ) : (
                      <List dense disablePadding>
                        {s3Files?.map((key) => (
                          <ListItemButton
                            key={key}
                            selected={form.video_ref === key}
                            onClick={() => handleChange("video_ref", key)}
                          >
                            <ListItemText
                              primary={key}
                              slotProps={{ primary: { variant: "body2", sx: { wordBreak: "break-all" } } }}
                            />
                          </ListItemButton>
                        ))}
                      </List>
                    )}
                  </Box>
                )}
              </Box>
            )}

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
          <Button
            type="submit"
            variant="contained"
            disabled={!canSubmit || (form.video_source === "s3" && !form.video_ref)}
          >
            {loading ? "Creating…" : "Create Game"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
