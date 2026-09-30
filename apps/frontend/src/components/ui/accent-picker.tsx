import { Fragment } from "react";
import { useTheme, type Accent } from "@/lib/theme";
import { cn } from "@/lib/utils";

const SWATCHES: { id: Accent; label: string; from: string; to: string }[] = [
  { id: "purple", label: "Purple & Magenta", from: "#9327DB", to: "#F722A6" },
  { id: "neon", label: "Neon Blue & Green", from: "#00FFFF", to: "#39FF14" },
];

// Enclosed pill: "Accent" label, then the two swatches split by a hairline.
export function AccentPicker() {
  const { accent, setAccent } = useTheme();

  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border-hover px-3 py-1.5">
      <span className="text-muted-foreground">Accent</span>
      {SWATCHES.map((s, i) => (
        <Fragment key={s.id}>
          {i > 0 && <span className="h-4 w-px bg-border-hover" />}
          <button
            title={s.label}
            aria-label={s.label}
            aria-pressed={accent === s.id}
            onClick={() => setAccent(s.id)}
            className={cn(
              "h-4 w-4 shrink-0 rounded-full ring-2 ring-offset-2 ring-offset-surface transition-shadow",
              accent === s.id ? "ring-foreground/70" : "ring-transparent opacity-70 hover:opacity-100",
            )}
            style={{ background: `linear-gradient(135deg, ${s.from}, ${s.to})` }}
          />
        </Fragment>
      ))}
    </div>
  );
}
