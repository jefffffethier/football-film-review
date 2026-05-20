"use client";

import { Box, Divider, Typography } from "@mui/material";

const SECTIONS = [
  {
    title: "Playback",
    items: [
      { keys: ["Space"], label: "Play / Pause" },
      { keys: ["J", "L"], label: "Rewind / Forward 5s" },
      { keys: ["1", "2", "3"], label: "Speed 0.25× / 0.5× / 1×" },
    ],
  },
  {
    title: "Navigation",
    items: [
      { keys: ["←", "→"], label: "Prev / Next play" },
      { keys: ["P"], label: "Toggle loop" },
    ],
  },
  {
    title: "Marking",
    items: [
      { keys: ["S", "E"], label: "Mark play start / end" },
    ],
  },
];

function KeyCap({ children }: { children: string }) {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-block",
        minWidth: 20,
        px: "7px",
        py: "2px",
        bgcolor: "rgba(255, 179, 0, 0.12)",
        border: "1px solid rgba(255, 179, 0, 0.35)",
        borderRadius: "4px",
        color: "primary.main",
        fontFamily: "monospace",
        fontSize: 11,
        fontWeight: 600,
        lineHeight: "15px",
        textAlign: "center",
      }}
    >
      {children}
    </Box>
  );
}

function KeyGroup({ keys }: { keys: string[] }) {
  return (
    <Box
      component="span"
      sx={{ display: "inline-flex", alignItems: "center", gap: "3px", flexShrink: 0 }}
    >
      {keys.map((k, i) => (
        <Box
          key={i}
          component="span"
          sx={{ display: "inline-flex", alignItems: "center", gap: "3px" }}
        >
          {i > 0 && (
            <Box
              component="span"
              sx={{ color: "#3a4452", fontSize: 10, mx: "1px" }}
            >
              +
            </Box>
          )}
          <KeyCap>{k}</KeyCap>
        </Box>
      ))}
    </Box>
  );
}

export default function ShortcutCheatsheet({ readOnly = false }: { readOnly?: boolean }) {
  if (readOnly) return null;

  return (
    <>
      <Divider />
      <Box sx={{ px: 3, py: 2.5, bgcolor: "background.paper" }}>
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 600,
            color: "text.primary",
            letterSpacing: 0.3,
            mb: 1.75,
          }}
        >
          Shortcuts
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 3.5,
          }}
        >
          {SECTIONS.map((section) => (
            <Box key={section.title}>
              <Typography
                sx={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "1.2px",
                  textTransform: "uppercase",
                  color: "#5c6675",
                  pb: 0.75,
                  mb: 1.25,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                }}
              >
                {section.title}
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {section.items.map((item) => (
                  <Box
                    key={item.label}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 1.5,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 12.5,
                        color: "text.secondary",
                        lineHeight: 1.3,
                      }}
                    >
                      {item.label}
                    </Typography>
                    <KeyGroup keys={item.keys} />
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </>
  );
}
