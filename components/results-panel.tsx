"use client";

/**
 * ResultsPanel
 * ─────────────────────────────────────────────────────────────────────────────
 * Displays the three key numbers in a compact stat grid:
 *   • π estimate (formula: 4 × inside / total)
 *   • True π value
 *   • % error
 * Plus a small inside/outside count bar.
 */

import { cn } from "@/lib/utils";
import { TRUE_PI } from "@/lib/monte-carlo-types";

interface ResultsPanelProps {
  piEstimate: number;
  percentError: number;
  inside: number;
  total: number;
}

function StatCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 rounded-lg border border-border p-3",
        highlight && "border-primary/30 bg-primary/5"
      )}
    >
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-mono text-xl font-semibold leading-none tabular-nums",
          highlight ? "text-primary" : "text-foreground"
        )}
      >
        {value}
      </span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  );
}

export function ResultsPanel({ piEstimate, percentError, inside, total }: ResultsPanelProps) {
  const outside = total - inside;
  const insideFraction = total > 0 ? inside / total : 0;

  return (
    <div className="flex flex-col gap-3 p-4 lg:p-5">
      {/* Stat grid */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard
          label="π estimate"
          value={total > 0 ? piEstimate.toFixed(6) : "—"}
          sub="4 × in / total"
          highlight
        />
        <StatCard
          label="True π"
          value={TRUE_PI.toFixed(6)}
          sub="3.14159…"
        />
        <StatCard
          label="% error"
          value={total > 0 ? `${percentError.toFixed(3)}%` : "—"}
          sub={total > 0 ? (percentError < 1 ? "< 1% — good!" : "> 1%") : "waiting…"}
        />
      </div>

      {/* Inside / outside count bar */}
      <div>
        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
          <span>
            <span className="font-medium text-accent">Inside</span>
            {" "}({inside.toLocaleString()})
          </span>
          <span>
            <span className="font-medium text-destructive">Outside</span>
            {" "}({outside.toLocaleString()})
          </span>
        </div>
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-accent transition-all duration-150"
            style={{ width: `${insideFraction * 100}%` }}
            role="presentation"
          />
        </div>
        <p className="mt-1 text-center text-xs text-muted-foreground font-mono">
          {total.toLocaleString()} total samples
        </p>
      </div>
    </div>
  );
}
