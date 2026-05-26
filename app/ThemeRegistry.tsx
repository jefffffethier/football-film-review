"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeProvider, createTheme, CssBaseline, alpha } from "@mui/material";

declare module "@mui/material/styles" {
  interface Palette {
    tableHeader: string;
  }
  interface PaletteOptions {
    tableHeader?: string;
  }
}

const PRIMARY = "#FFB300";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: PRIMARY,
      contrastText: "#000000",
    },
    tableHeader: alpha(PRIMARY, 0.18),
    background: {
      default: "#0D1117",
      paper: "#161B22",
    },
    text: {
      primary: "#E6EDF3",
      secondary: "#8B949E",
    },
    divider: "#30363D",
  },
  components: {
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: "#1C2128",
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:hover": {
            backgroundColor: "#1C2128",
          },
        },
      },
    },
  },
});

export default function ThemeRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
