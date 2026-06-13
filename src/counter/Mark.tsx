import { type CounterIcon } from "../lib/state";

export function Mark({ icon }: { icon: CounterIcon }) {
  if (icon === "triangle") {
    return <span className="mark-triangle" />;
  }
  if (icon === "target") {
    return <span className="mark-target" />;
  }
  return <span className={`mark-dot mark-${icon}`} />;
}
