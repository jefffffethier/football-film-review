"use client";

import { Box, Paper, Typography } from "@mui/material";

const shortcuts = [
  ["Space", "Play / Pause"],
  ["J / L", "Rewind / Forward 5s"],
  ["← / →", "Prev / Next play"],
  ["1 / 2 / 3", "Speed 0.25× / 0.5× / 1×"],
  ["S", "Mark play start"],
  ["E", "Mark play end"],
  ["P", "Toggle loop"],
];

export default function ShortcutCheatsheet() {
  return (
    <Paper
      elevation={4}
      sx={{
        position: "fixed",
        bottom: 16,
        right: 16,
        px: 1.5,
        py: 1,
        opacity: 0.85,
        zIndex: 1000,
        minWidth: 200,
      }}
    >
      <Typography
        variant="caption"
        sx={{ fontWeight: 700, display: "block", mb: 0.5 }}
      >
        Shortcuts
      </Typography>
      {shortcuts.map(([key, action]) => (
        <Box
          key={key}
          sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}
        >
          <Typography
            variant="caption"
            color="primary"
            sx={{ fontFamily: "monospace" }}
          >
            {key}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {action}
          </Typography>
        </Box>
      ))}
    </Paper>
  );
}
