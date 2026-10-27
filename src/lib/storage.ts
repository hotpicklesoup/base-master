import type { AppState } from "./types";

const KEY = "woodshed:v1";

export function defaultState(): AppState {
  return {
    version: 1,
    settings: { sessionMinutes: 30, countIn: true, volume: 0.8, keepAwake: true },
    progress: {},
    songs: [],
    log: [],
    today: null,
  };
}

/** Fill in anything missing from older or hand-edited saves. */
export function normalize(raw: unknown): AppState {
  const base = defaultState();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<AppState>;
  return {
    version: 1,
    settings: { ...base.settings, ...(r.settings ?? {}) },
    progress: r.progress && typeof r.progress === "object" ? r.progress : {},
    songs: Array.isArray(r.songs) ? r.songs : [],
    log: Array.isArray(r.log) ? r.log : [],
    today: r.today ?? null,
  };
}

export function load(): AppState {
  try {
    const text = window.localStorage.getItem(KEY);
    return text ? normalize(JSON.parse(text)) : defaultState();
  } catch {
    return defaultState();
  }
}

export function save(state: AppState): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage can be unavailable (private mode, blocked site data). The app keeps working in memory.
  }
}

export function exportJson(state: AppState): string {
  return JSON.stringify(state, null, 2);
}

export function importJson(text: string): AppState {
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== "object" || !("progress" in parsed)) {
    throw new Error("That file isn't a Woodshed backup.");
  }
  return normalize(parsed);
}
