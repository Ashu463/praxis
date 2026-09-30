import { Link } from "react-router-dom";
import { Layers, Mail, Star } from "lucide-react";
import { AccentPicker } from "@/components/ui/accent-picker";

const LINK =
  "flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-colors hover:bg-surface-hover hover:text-foreground";

// The persistent top strip on every page — brand left, the few places worth going right.
export function StatusLine() {
  return (
    <header className="flex h-[52px] shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-4 font-mono text-xs text-muted">
      <Link
        to="/"
        className="flex items-center gap-2 font-display text-[16px] font-semibold tracking-tight text-foreground"
      >
        <img src="/logo.svg" alt="" className="h-8 w-8" />
        Praxis
      </Link>

      <nav className="flex items-center gap-1">
        <Link to="/#starred" className={LINK}>
          <Star className="h-3.5 w-3.5" />{" "}
          <span className="hidden sm:inline">Projects</span>
        </Link>
        <Link to="/#architecture" className={LINK}>
          <Layers className="h-3.5 w-3.5" />{" "}
          <span className="hidden sm:inline">Architecture</span>
        </Link>
        <Link to="/#access" className={LINK}>
          <Mail className="h-3.5 w-3.5" />{" "}
          <span className="hidden sm:inline">Contact</span>
        </Link>
        <AccentPicker />
      </nav>
    </header>
  );
}
