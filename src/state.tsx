import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { EXERCISE_BY_ID } from "./data/exercises";
import { localDate } from "./lib/dates";
import { applyResult, applySongResult } from "./lib/progression";
import { load, save } from "./lib/storage";
import type { AppState, Result, Settings, Song, TodayState } from "./lib/types";

export interface Practiced {
  itemId: string;
  result: Result;
  bpm: number;
  stage?: number;
  seconds: number;
  /** Part of today's routine (vs. practiced from the Exercises or Songs tab). */
  inRoutine: boolean;
}

interface Store {
  state: AppState;
  today: TodayState;
  /** Log a run, update the tempo for next time and return what changes. */
  record: (p: Practiced) => string;
  skip: (itemId: string) => void;
  focus: (itemId: string | null) => void;
  updateSettings: (s: Partial<Settings>) => void;
  saveSong: (song: Song) => void;
  deleteSong: (id: string) => void;
  replaceAll: (s: AppState) => void;
}

const Ctx = createContext<Store | null>(null);

function freshToday(prev: TodayState | null, date: string): TodayState {
  return prev && prev.date === date ? prev : { date, results: {}, focus: null };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => load());
  const [date, setDate] = useState(() => localDate());

  // Roll over to a new day if the app stays open past midnight.
  useEffect(() => {
    const id = setInterval(() => setDate(localDate()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => save(state), [state]);

  const today = useMemo(() => freshToday(state.today, date), [state.today, date]);

  const stateRef = useRef(state);
  stateRef.current = state;

  const record = useCallback(
    (p: Practiced): string => {
      // Work out the outcome from the latest state first, so the message can be returned right away.
      const s = stateRef.current;
      const entry = { date, itemId: p.itemId, bpm: p.bpm, stage: p.stage, result: p.result, seconds: Math.round(p.seconds) };
      let next: AppState = { ...s, log: [...s.log, entry] };
      let message = "";
      if (p.itemId.startsWith("song:")) {
        const id = p.itemId.slice(5);
        next = {
          ...next,
          songs: next.songs.map((song) => {
            if (song.id !== id) return song;
            const out = applySongResult(song, p.result, p.bpm);
            message = out.message;
            return { ...out.song, lastPracticed: date };
          }),
        };
      } else {
        const ex = EXERCISE_BY_ID[p.itemId];
        if (ex) {
          const out = applyResult(ex, s.progress[p.itemId], p.result, p.bpm);
          message = out.message;
          next = { ...next, progress: { ...next.progress, [p.itemId]: out.progress } };
        }
      }
      if (p.inRoutine) {
        const t = freshToday(s.today, date);
        next = { ...next, today: { ...t, focus: null, results: { ...t.results, [p.itemId]: { result: p.result, message } } } };
      }
      stateRef.current = next;
      setState(next);
      return message;
    },
    [date],
  );

  const skip = useCallback(
    (itemId: string) =>
      setState((s) => {
        const t = freshToday(s.today, date);
        return { ...s, today: { ...t, focus: null, results: { ...t.results, [itemId]: { result: "skipped", message: "Skipped today." } } } };
      }),
    [date],
  );

  const focus = useCallback(
    (itemId: string | null) => setState((s) => ({ ...s, today: { ...freshToday(s.today, date), focus: itemId } })),
    [date],
  );

  const updateSettings = useCallback((patch: Partial<Settings>) => setState((s) => ({ ...s, settings: { ...s.settings, ...patch } })), []);

  const saveSong = useCallback(
    (song: Song) =>
      setState((s) => {
        const exists = s.songs.some((x) => x.id === song.id);
        return { ...s, songs: exists ? s.songs.map((x) => (x.id === song.id ? song : x)) : [...s.songs, song] };
      }),
    [],
  );

  const deleteSong = useCallback((id: string) => setState((s) => ({ ...s, songs: s.songs.filter((x) => x.id !== id) })), []);

  const replaceAll = useCallback((s: AppState) => setState(s), []);

  const value = useMemo(
    () => ({ state, today, record, skip, focus, updateSettings, saveSong, deleteSong, replaceAll }),
    [state, today, record, skip, focus, updateSettings, saveSong, deleteSong, replaceAll],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside StoreProvider");
  return s;
}
