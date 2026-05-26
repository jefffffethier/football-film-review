"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import GameModal from "@/components/GameModal/GameModal";
import EditGameModal from "@/components/EditGameModal/EditGameModal";
import { Game } from "@/types";

type SortCol = "title" | "date" | "teams";
type SortDir = "asc" | "desc";

function teamsLabel(game: Game) {
  if (!game.home_team && !game.away_team) return "";
  return `${game.home_team ?? "?"} vs ${game.away_team ?? "?"}`;
}

export default function GamesPage() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Game | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Game | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [teamFilter, setTeamFilter] = useState<string | null>(null);
  const [sortCol, setSortCol] = useState<SortCol>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    fetch("/api/games")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setGames(data);
      });
  }, []);

  function handleCreated(game: Game) {
    setGames((prev) => [game, ...prev]);
  }

  function handleSaved(updated: Game) {
    setGames((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await fetch(`/api/games/${deleteTarget.id}`, { method: "DELETE" });
    setGames((prev) => prev.filter((g) => g.id !== deleteTarget.id));
    setDeleteTarget(null);
    setDeleting(false);
  }

  function handleSort(col: SortCol) {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  }

  const teamOptions = useMemo(() => {
    const names = new Set<string>();
    for (const g of games) {
      if (g.home_team) names.add(g.home_team);
      if (g.away_team) names.add(g.away_team);
    }
    return Array.from(names).sort();
  }, [games]);

  const visibleGames = useMemo(() => {
    let list = games;

    if (teamFilter) {
      const f = teamFilter.toLowerCase();
      list = list.filter(
        (g) =>
          g.home_team?.toLowerCase().includes(f) ||
          g.away_team?.toLowerCase().includes(f)
      );
    }

    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortCol === "title") cmp = a.title.localeCompare(b.title);
      else if (sortCol === "date") cmp = a.date.localeCompare(b.date);
      else if (sortCol === "teams") cmp = teamsLabel(a).localeCompare(teamsLabel(b));
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [games, teamFilter, sortCol, sortDir]);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Typography variant="h4">🏈 Games</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setModalOpen(true)}
        >
          New Game
        </Button>
      </Box>

      {games.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Autocomplete
            options={teamOptions}
            value={teamFilter}
            onChange={(_, val) => setTeamFilter(val)}
            renderInput={(params) => (
              <TextField {...params} label="Filter by team" size="small" />
            )}
            sx={{ maxWidth: 300 }}
            clearOnEscape
          />
        </Box>
      )}

      {games.length === 0 ? (
        <Typography color="text.secondary">
          No games yet. Add your first game to get started.
        </Typography>
      ) : visibleGames.length === 0 ? (
        <Typography color="text.secondary">No games match the filter.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: (t) => t.palette.tableHeader }}>
                <TableCell
                  sortDirection={sortCol === "title" ? sortDir : false}
                  sx={{ color: "text.primary" }}
                >
                  <TableSortLabel
                    active={sortCol === "title"}
                    direction={sortCol === "title" ? sortDir : "asc"}
                    onClick={() => handleSort("title")}
                    sx={{
                      color: "text.primary !important",
                      "& .MuiTableSortLabel-icon": { color: "text.primary !important" },
                    }}
                  >
                    Title
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  sortDirection={sortCol === "date" ? sortDir : false}
                  sx={{ color: "text.primary" }}
                >
                  <TableSortLabel
                    active={sortCol === "date"}
                    direction={sortCol === "date" ? sortDir : "asc"}
                    onClick={() => handleSort("date")}
                    sx={{
                      color: "text.primary !important",
                      "& .MuiTableSortLabel-icon": { color: "text.primary !important" },
                    }}
                  >
                    Date
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  sortDirection={sortCol === "teams" ? sortDir : false}
                  sx={{ color: "text.primary" }}
                >
                  <TableSortLabel
                    active={sortCol === "teams"}
                    direction={sortCol === "teams" ? sortDir : "asc"}
                    onClick={() => handleSort("teams")}
                    sx={{
                      color: "text.primary !important",
                      "& .MuiTableSortLabel-icon": { color: "text.primary !important" },
                    }}
                  >
                    Teams
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ color: "text.primary" }}>Source</TableCell>
                <TableCell align="right" sx={{ color: "text.primary" }}>Plays</TableCell>
                <TableCell sx={{ color: "text.primary" }}>Status</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleGames.map((game, index) => (
                <TableRow
                  key={game.id}
                  hover
                  sx={{
                    cursor: "pointer",
                    bgcolor: index % 2 === 0 ? "inherit" : "action.hover",
                  }}
                  onClick={() => router.push(`/games/${game.id}`)}
                >
                  <TableCell>{game.title}</TableCell>
                  <TableCell>{game.date}</TableCell>
                  <TableCell>
                    {game.home_team || game.away_team
                      ? `${game.away_team ?? "?"} vs ${game.home_team ?? "?"}`
                      : "—"}
                  </TableCell>
                  <TableCell sx={{ textTransform: "uppercase", fontSize: 12 }}>
                    {game.video_source}
                  </TableCell>
                  <TableCell align="right">{game.play_count ?? 0}</TableCell>
                  <TableCell>
                    {game.reviewed && (
                      <Chip label="Reviewed" color="success" size="small" />
                    )}
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditTarget(game);
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(game);
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <GameModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />

      <EditGameModal
        open={!!editTarget}
        game={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={handleSaved}
      />

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete game?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Delete &ldquo;{deleteTarget?.title}&rdquo; and all its tagged plays?
            This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
