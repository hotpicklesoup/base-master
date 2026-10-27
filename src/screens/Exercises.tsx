import { EXERCISES, GOAL_NAMES } from "../data/exercises";
import { currentSetting } from "../lib/progression";
import type { Exercise, Goal } from "../lib/types";
import { useStore } from "../state";

const ORDER: Goal[] = ["time", "right", "left", "rhythm"];

function detail(ex: Exercise, bpm: number, stage: number | undefined): { text: string; fraction: number } {
  const p = ex.progression;
  if (p.type === "stages") {
    const s = stage ?? 0;
    return { text: `Stage ${s + 1} of ${p.stages.length}`, fraction: s / (p.stages.length - 1) };
  }
  const fraction = Math.min(1, Math.max(0, (bpm - p.start) / (p.target - p.start)));
  return { text: `${bpm} bpm now, goal ${p.target}`, fraction };
}

export function Exercises({ open }: { open: (itemId: string) => void }) {
  const { state } = useStore();
  return (
    <div className="screen">
      <h1 className="screen-title">Exercises</h1>
      <p className="screen-intro">Practice anything here on its own. Results still count toward your tempos.</p>
      <ul className="rows">
        <li>
          <button className="row" onClick={() => open("free")}>
            <span className="row-title">Metronome</span>
            <span className="row-detail">Just the click, with tap tempo</span>
          </button>
        </li>
      </ul>
      {ORDER.map((goal) => (
        <section key={goal} className="group">
          <h2 className="group-title">{GOAL_NAMES[goal]}</h2>
          <ul className="rows">
            {EXERCISES.filter((e) => e.goal === goal).map((ex) => {
              const s = currentSetting(ex, state.progress[ex.id]);
              const d = detail(ex, s.bpm, s.stage);
              return (
                <li key={ex.id}>
                  <button className="row" onClick={() => open(ex.id)}>
                    <span className="row-title">{ex.title}</span>
                    <span className="row-detail">{d.text}</span>
                    <span className="meter" aria-hidden="true">
                      <span style={{ width: `${Math.round(d.fraction * 100)}%` }} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
