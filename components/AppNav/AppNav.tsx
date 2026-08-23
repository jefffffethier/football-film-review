"use client";

import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  backHref?: string;
  panelOpen?: boolean;
  onTogglePanel?: () => void;
  actions?: ReactNode;
}

export default function AppNav({
  title,
  subtitle,
  backHref,
  panelOpen,
  onTogglePanel,
  actions,
}: Props) {
  const router = useRouter();

  return (
    <Box
      component="nav"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 2,
        py: 1,
        borderBottom: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      {backHref && (
        <IconButton size="small" onClick={() => router.push(backHref)}>
          <ArrowBackIcon />
        </IconButton>
      )}

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="h6" noWrap sx={subtitle ? { lineHeight: 1.2 } : undefined}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" noWrap>
            {subtitle}
          </Typography>
        )}
      </Box>

      {onTogglePanel !== undefined && (
        <Tooltip title={panelOpen ? "Collapse panel" : "Expand panel"}>
          <IconButton size="small" onClick={onTogglePanel}>
            {panelOpen ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Tooltip>
      )}

      {actions && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
          {actions}
        </Box>
      )}
    </Box>
  );
}
