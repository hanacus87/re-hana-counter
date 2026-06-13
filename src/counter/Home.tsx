import { useState } from "react";
import { applyAction, type Mode } from "../lib/counter";
import { sanitizeInput } from "../lib/sanitize";
import {
  DEFAULT_MAX,
  maxFor,
  resetAll,
  sections,
  type CounterValues,
} from "../lib/state";
import { loadState, saveState } from "../lib/storage";
import { TrashIcon } from "../shell/icons";
import { Mark } from "./Mark";

export function Home() {
  const [values, setValues] = useState<CounterValues>(() =>
    loadState(localStorage),
  );
  const [mode, setMode] = useState<Mode>("increment");

  const update = (next: CounterValues) => {
    setValues(next);
    saveState(next, localStorage);
  };

  return (
    <>
      <div className="mode-bar">
        <span className="mode-sign">+</span>
        <input
          type="checkbox"
          className="toggle"
          aria-label="モード切替"
          checked={mode === "decrement"}
          onChange={(e) =>
            setMode(e.target.checked ? "decrement" : "increment")
          }
        />
        <span className="mode-sign">−</span>
        {mode === "decrement" && (
          <button
            type="button"
            className="reset"
            aria-label="リセット"
            onClick={() => update(resetAll(values))}
          >
            <TrashIcon />
          </button>
        )}
      </div>
      <main>
        {sections.map((section) => (
          <section key={section.id} className={`panel ${section.variant}`}>
            {section.counters.map((counter) => {
              const max = maxFor(counter.id);
              return (
                <div key={counter.id} className="counter">
                  <input
                    className={`value${max > DEFAULT_MAX ? " value-wide" : ""}`}
                    type="text"
                    inputMode="numeric"
                    aria-label={`値 (${counter.id})`}
                    value={values[counter.id]}
                    onChange={(e) =>
                      update({
                        ...values,
                        [counter.id]: sanitizeInput(e.target.value, max),
                      })
                    }
                  />
                  <button
                    type="button"
                    className="tile"
                    aria-label={`カウント (${counter.id})`}
                    onClick={() =>
                      update({
                        ...values,
                        [counter.id]: applyAction(
                          values[counter.id],
                          mode,
                          max,
                        ),
                      })
                    }
                  >
                    <Mark icon={counter.icon} />
                  </button>
                </div>
              );
            })}
          </section>
        ))}
      </main>
    </>
  );
}
