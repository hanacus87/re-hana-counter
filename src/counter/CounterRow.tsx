import { applyAction, type Mode } from "../lib/counter";
import { type CounterIcon, DEFAULT_MAX, maxFor } from "../lib/state";
import { NumericInput } from "../shell/NumericInput";
import { Mark } from "./Mark";

export function CounterRow({
  id,
  icon,
  value,
  mode,
  onChange,
}: {
  id: string;
  icon: CounterIcon;
  value: number;
  mode: Mode;
  onChange: (id: string, value: number) => void;
}) {
  const max = maxFor(id);
  return (
    <div className="counter">
      <NumericInput
        className={`value${max > DEFAULT_MAX ? " value-wide" : ""}`}
        ariaLabel={`値 (${id})`}
        value={value}
        max={max}
        onChange={(next) => onChange(id, next)}
      />
      <button
        type="button"
        className="tile"
        aria-label={`カウント (${id})`}
        onClick={() => onChange(id, applyAction(value, mode, max))}
      >
        <Mark icon={icon} />
      </button>
    </div>
  );
}
