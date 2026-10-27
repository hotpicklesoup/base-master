import { useRef, useState, type ChangeEvent } from "react";
import { TempoChart, type TempoPoint } from "../components/TempoChart";
import { EXERCISES, EXERCISE_BY_ID } from "../data/exercises";
import { addDays, weekStart } from "../lib/dates";
import { currentSetting } from "../lib/progression";
import { exportJson, importJson } from "../lib/storage";
import type { LogEntry } from "../lib/types";
import { useStore } from "../state";

const GOAL_ID = "staccato-16ths";

/** Fastest clean tempo per day for one exercise. */
export function cleanByDay(log: LogEntry[], itemId: string): TempoPoint[] {
  const best = new Map<string, number>();
  for (const e of log) {
    if (e.itemId !== itemId || e.result !== "clean") continue;
    best.set(e.date, Math.max(best.get(e.date) ?? 0, e.bpm));
  }
  return [...best.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, bpm]) => ({ date, bpm }));
}

export function Progress() {
  const { state, today, replaceAll } = useStore();
  const [notice, setNotice] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const goalEx = EXERCISE_BY_ID[GOAL_ID];
  const goal = goalEx.progression.type === "tempo" ? goalEx.progression.target : 100;
  const working = currentSetting(goalEx, state.progress[GOAL_ID]).bpm;
  const best = state.progress[GOAL_ID]?.bestClean;
  const points = cleanByDay(state.log, GOAL_ID);

  const monday = weekStart(today.date);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const weekLog = state.log.filter((e) => e.date >= monday && e.date <= days[6]);
  const weekMinutes = Math.round(weekLog.reduce((s, e) => s + e.seconds, 0) / 60);
  const practicedDays = new Set(weekLog.map((e) => e.date));

  const download = () => {
    const blob = new Blob([exportJson(state)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `woodshed-backup-${today.date}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const restore = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const next = importJson(await file.text());
      if (!window.confirm("Replace everything on this device with the backup?")) return;
      replaceAll(next);
      setNotice("Backup restored.");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "That file couldn't be read.");
    }
  };

  let headline: string;
  if (best !== undefined && best >= goal) headline = `You've played it clean at ${best}. Next time you're working at ${working}.`;
  else headline = `Working at ${working} bpm, ${goal - working > 0 ? `${goal - working} to go` : "right at the goal"}.`;

  return (
    <div className="screen">
      <h1 className="screen-title">Progress</h1>

      <section className="group">
        <h2 className="group-title">Staccato sixteenths</h2>
        <p className="headline">{headline}</p>
        {points.length ? (
          <TempoChart points={points} goal={goal} title="Fastest clean staccato sixteenths per day" />
        ) : (
          <p className="empty">Mark a run of staccato sixteenths as clean and your tempo shows up here, day by day.</p>
        )}
      </section>

      <section className="group">
        <h2 className="group-title">This week</h2>
        <ol className="week" aria-label="Days practiced this week">
          {days.map((d) => {
            const [y, m, dd] = d.split("-").map(Number);
            const name = new Date(y, m - 1, dd).toLocaleDateString(undefined, { weekday: "short" });
            const did = practicedDays.has(d);
            return (
              <li key={d} className={`${did ? "did" : ""}${d === today.date ? " is-today" : ""}`} aria-label={`${name}: ${did ? "practiced" : "no practice"}`}>
                <span className="week-mark" />
                <span className="week-name">{name.slice(0, 2)}</span>
              </li>
            );
          })}
        </ol>
        <p className="week-total">
          {weekMinutes} minute{weekMinutes === 1 ? "" : "s"} on {practicedDays.size} day{practicedDays.size === 1 ? "" : "s"}
        </p>
      </section>

      <section className="group">
        <h2 className="group-title">Every exercise</h2>
        <ul className="rows plain">
          {EXERCISES.map((ex) => {
            const s = currentSetting(ex, state.progress[ex.id]);
            const p = state.progress[ex.id];
            const text =
              ex.progression.type === "stages"
                ? `Stage ${(s.stage ?? 0) + 1} of ${ex.progression.stages.length}`
                : `${s.bpm} now${p?.bestClean ? `, best clean ${p.bestClean}` : ""}, goal ${ex.progression.target}`;
            return (
              <li key={ex.id} className="stat-row">
                <span className="row-title">{ex.title}</span>
                <span className="row-detail">{text}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="group">
        <h2 className="group-title">Backup</h2>
        <p className="screen-intro">Progress is saved in this browser on this device. Download a backup to move it or keep it safe.</p>
        <div className="form-actions">
          <button className="secondary" onClick={download}>
            Download a backup
          </button>
          <button className="secondary" onClick={() => fileRef.current?.click()}>
            Restore a backup
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={restore} />
        </div>
        {notice && (
          <p className="toast" role="status">
            {notice}
          </p>
        )}
      </section>
    </div>
  );
}
