import { useEffect, useMemo, useState } from "react";
import { Player } from "../components/Player";
import { toPlayItem } from "../components/playItem";
import { buildRoutine, ROLE_NAMES } from "../lib/routine";
import type { Settings } from "../lib/types";
import { useStore } from "../state";

const LENGTHS: Settings["sessionMinutes"][] = [15, 30, 45, 60];

const RESULT_NAMES = { clean: "Clean", almost: "Almost", tooHard: "Too hard", skipped: "Skipped" } as const;

function dayHeading(date: string): { weekday: string; rest: string } {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return {
    weekday: dt.toLocaleDateString(undefined, { weekday: "long" }),
    rest: dt.toLocaleDateString(undefined, { month: "long", day: "numeric" }),
  };
}

export function Today({ onOpenSettings, onBrowse }: { onOpenSettings: () => void; onBrowse: () => void }) {
  const { state, today, focus, skip, updateSettings } = useStore();
  const minutes = state.settings.sessionMinutes;
  const blocks = useMemo(() => buildRoutine(today.date, minutes, state.songs), [today.date, minutes, state.songs]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 7000);
    return () => clearTimeout(id);
  }, [toast]);

  const firstOpen = blocks.findIndex((b) => !today.results[b.itemId]);
  const focusIndex = today.focus ? blocks.findIndex((b) => b.itemId === today.focus) : -1;
  const current = focusIndex >= 0 ? focusIndex : firstOpen;
  const block = current >= 0 ? blocks[current] : null;
  const item = block ? toPlayItem(block.itemId, state, today.date) : null;
  const { weekday, rest } = dayHeading(today.date);
  const started = Object.keys(today.results).length > 0;

  return (
    <div className="screen today">
      <header className="today-head">
        <div>
          <h1 className="day">{weekday}</h1>
          <p className="day-sub">{rest}</p>
        </div>
        <button className="icon-btn" onClick={onOpenSettings} aria-label="Settings">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path
              fill="currentColor"
              d="M19.4 13a7.6 7.6 0 0 0 0-2l2-1.6-2-3.4-2.4 1a7.4 7.4 0 0 0-1.7-1L15 3.4h-4l-.4 2.6a7.4 7.4 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.6a7.6 7.6 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7.4 7.4 0 0 0 1.7 1l.4 2.6h4l.4-2.6a7.4 7.4 0 0 0 1.7-1l2.4 1 2-3.4zM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z"
              transform="translate(-1 0)"
            />
          </svg>
        </button>
      </header>

      <div className="length" role="group" aria-label="Session length">
        {LENGTHS.map((m) => (
          <button key={m} className={m === minutes ? "on" : ""} aria-pressed={m === minutes} onClick={() => updateSettings({ sessionMinutes: m })}>
            {m} min
          </button>
        ))}
      </div>

      <nav className="routine" aria-label="Today's routine">
        <ol className="routine-bar">
          {blocks.map((b, i) => {
            const r = today.results[b.itemId];
            const t = toPlayItem(b.itemId, state, today.date)?.title ?? b.itemId;
            const cls = [r ? (r.result === "skipped" ? "skipped" : "done") : "", i === current ? "current" : ""].join(" ");
            return (
              <li key={b.itemId} style={{ flexGrow: b.minutes }}>
                <button
                  className={cls}
                  onClick={() => focus(b.itemId)}
                  aria-current={i === current ? "step" : undefined}
                  aria-label={`${ROLE_NAMES[b.role]}: ${t}, ${b.minutes} minutes${r ? `, ${RESULT_NAMES[r.result].toLowerCase()}` : ""}`}
                />
              </li>
            );
          })}
        </ol>
        {block && (
          <p className="routine-label">
            {ROLE_NAMES[block.role]}, block {current + 1} of {blocks.length}
          </p>
        )}
      </nav>

      {toast && (
        <p className="toast" role="status">
          {toast}
        </p>
      )}

      {block && item ? (
        <Player
          key={block.itemId}
          item={item}
          minutes={block.minutes}
          inRoutine
          onRecorded={(msg) => {
            setToast(`${item.title}. ${msg}`);
            window.scrollTo(0, 0);
          }}
          onSkip={() => {
            skip(block.itemId);
            window.scrollTo(0, 0);
          }}
        />
      ) : (
        <section className="summary">
          <h2 className="ex-title">Session done</h2>
          <p className="ex-summary">
            {started ? "Here's what changes next time." : "Nothing in today's routine yet."}
          </p>
          <ol className="summary-list">
            {blocks.map((b) => {
              const r = today.results[b.itemId];
              const t = toPlayItem(b.itemId, state, today.date)?.title ?? b.itemId;
              return (
                <li key={b.itemId}>
                  <span className="summary-title">{t}</span>
                  <span className={`summary-result ${r?.result ?? ""}`}>{r ? RESULT_NAMES[r.result] : ""}</span>
                  {r?.message && <span className="summary-msg">{r.message}</span>}
                </li>
              );
            })}
          </ol>
          <button className="secondary" onClick={onBrowse}>
            Keep going with any exercise
          </button>
        </section>
      )}
    </div>
  );
}
