import { useState, type ReactNode } from "react";
import { T } from "./lang";

/* A block of instructions / explanation with a close (✕) control in its
   corner. Tapping ✕ hides the block so the page is cleaner. The hidden
   state is component-local only — nothing is stored — so the instructions
   come back on a fresh visit (page reload), exactly as asked.
   Safety information (red-flag warnings, exercise stop signals, the two
   safety caveats) is never wrapped in this component. */
export function Dismissible({ children, className = "" }: { children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        aria-label={T("关闭这段说明", "Close these instructions")}
        title={T("关闭这段说明", "Close these instructions")}
        onClick={() => setOpen(false)}
        className="absolute right-1.5 top-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-sm font-bold leading-none text-[var(--dim)]"
      >
        ✕
      </button>
      {children}
    </div>
  );
}
