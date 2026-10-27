import { COUNT_LABELS, STEPS_PER_BAR, type StepInfo } from "../lib/schedule";

interface Props {
  pattern: string;
  step: StepInfo | null;
  playing: boolean;
}

/**
 * The rhythm drawn as a bass neck: each sixteenth is a fret slot, notes are inlay dots,
 * heavier frets mark the beats. The slot that's sounding lights up.
 */
export function Fingerboard({ pattern, step, playing }: Props) {
  const bars = Math.max(1, Math.floor(pattern.length / STEPS_PER_BAR));
  const live = playing && step !== null;
  const inPlay = live && step.phase === "play";
  const bar = inPlay ? Math.floor(step.patternStep / STEPS_PER_BAR) : 0;
  const slice = pattern.slice(bar * STEPS_PER_BAR, bar * STEPS_PER_BAR + STEPS_PER_BAR).padEnd(STEPS_PER_BAR, ".");
  const muted = inPlay && step.muted;
  const countBeat = live && step.phase === "countIn" ? Math.floor(step.stepInBar / 4) + 1 : null;

  let status = "";
  if (countBeat !== null) status = `Count-in ${countBeat}`;
  else if (muted) status = "Click's off. Keep going.";

  return (
    <figure className="neck-wrap" aria-label="Rhythm for this exercise">
      <div className={`neck${muted ? " is-muted" : ""}`}>
        <div className="neck-strings" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
        <ol className="neck-slots">
          {Array.from(slice).map((c, i) => {
            const hit = c === "x";
            const active = inPlay && !muted && step.stepInBar === i;
            const beatStart = i % 4 === 0;
            return (
              <li
                key={i}
                className={`slot${beatStart ? " beat" : ""}${active ? " active" : ""}`}
                aria-label={`${COUNT_LABELS[i]}: ${hit ? "play" : "rest"}`}
              >
                {hit && <span className="dot" />}
              </li>
            );
          })}
        </ol>
        {status && <div className="neck-status">{status}</div>}
      </div>
      <div className="neck-counts" aria-hidden="true">
        {COUNT_LABELS.map((l, i) => (
          <span key={i} className={i % 4 === 0 ? "on" : ""}>
            {l}
          </span>
        ))}
      </div>
      {bars > 1 && (
        <figcaption className="neck-caption">
          Bar {bar + 1} of {bars}
        </figcaption>
      )}
    </figure>
  );
}
