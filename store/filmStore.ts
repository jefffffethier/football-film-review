import { create } from "zustand";
import { Game, Play } from "@/types";
import { RefObject, createRef } from "react";

export type TaggingMode = "idle" | "started" | "form" | "editing";

// react-player v2 exposes getCurrentTime / seekTo on its instance
export interface PlayerRef {
  getCurrentTime: () => number;
  seekTo: (amount: number, type?: "seconds" | "fraction") => void;
}

interface FilmStore {
  game: Game | null;
  plays: Play[];
  pendingStart: number | null;
  taggingMode: TaggingMode;
  editingPlay: Play | null;
  loopActive: boolean;
  currentPlayIndex: number | null;
  playing: boolean;
  playbackRate: number;
  playerRef: RefObject<PlayerRef | null>;

  setGame: (game: Game) => void;
  setPlays: (plays: Play[]) => void;
  addPlay: (play: Play) => void;
  updatePlay: (play: Play) => void;
  removePlay: (id: string) => void;
  setPendingStart: (t: number | null) => void;
  setTaggingMode: (mode: TaggingMode) => void;
  setEditingPlay: (play: Play | null) => void;
  toggleLoop: () => void;
  setCurrentPlayIndex: (i: number | null) => void;
  setPlaying: (v: boolean) => void;
  setPlaybackRate: (r: number) => void;
}

export const useFilmStore = create<FilmStore>((set) => ({
  game: null,
  plays: [],
  pendingStart: null,
  taggingMode: "idle",
  editingPlay: null,
  loopActive: false,
  currentPlayIndex: null,
  playing: false,
  playbackRate: 1,
  playerRef: createRef<PlayerRef | null>(),

  setGame: (game) => set({ game }),
  setPlays: (plays) => set({ plays }),
  addPlay: (play) =>
    set((s) => ({
      plays: [...s.plays, play].sort((a, b) => a.start_time - b.start_time),
    })),
  updatePlay: (play) =>
    set((s) => ({ plays: s.plays.map((p) => (p.id === play.id ? play : p)) })),
  removePlay: (id) =>
    set((s) => ({ plays: s.plays.filter((p) => p.id !== id) })),
  setPendingStart: (t) => set({ pendingStart: t }),
  setTaggingMode: (mode) => set({ taggingMode: mode }),
  setEditingPlay: (play) => set({ editingPlay: play }),
  toggleLoop: () => set((s) => ({ loopActive: !s.loopActive })),
  setCurrentPlayIndex: (i) => set({ currentPlayIndex: i }),
  setPlaying: (v) => set({ playing: v }),
  setPlaybackRate: (r) => set({ playbackRate: r }),
}));
