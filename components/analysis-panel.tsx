"use client";

/**
 * AnalysisPanel
 * ─────────────────────────────────────────────────────────────────────────────
 * Shows a human-readable summary of the current simulation run:
 *   • Convergence quality assessment
 *   • Precision tier
 *   • Key formula reminder
 *   • Tip for improving accuracy
 *
 * All text is generated deterministically from the simulation state —
 * no backend required.
 */

import { TRUE_PI } from "@/lib/monte-carlo-types";

interface AnalysisPanelProps {
  piEstimate: number;
  percentError: number;
  total: number;
  inside: number;
}

/** Describe convergence quality based on % error */
function qualityLabel(err: number): string {
  if (err < 0.01) return "Excellent — within 0.01%";
  if (err < 0.1) return "Very Good — within 0.1%";
  if (err < 1) return "Good — within 1%";
  if (err < 5) return "Fair — above 1%";
  return "Early — still converging";
}

/** Suggest next step */
function suggestion(total: number, err: number): string {
  if (total === 0) return "Run the simulation to start sampling.";
  if (err < 0.01) return "Excellent convergence! Try 10M samples to push further.";
  if (err < 1) return "Good result. Increasing sample count will improve precision.";
  if (total < 1000) return "Try at least 10 000 samples for better accuracy.";
  return "More samples reduce random noise — try 100k or 1M.";
}

export function AnalysisPanel({ piEstimate, percentError, total, inside }: AnalysisPanelProps) {
  const outside = total - inside;
  const isReady = total > 0;

  return (
    <section
      className="rounded-lg border border-border bg-card p-4"
      aria-label="Analysis summary"
    >
      <p className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Analysis
      </p>

      {!isReady ? (
        <p className="text-sm text-muted-foreground leading-relaxed">
          Start the simulation to see a live analysis of the π estimate.
        </p>
      ) : (
        <div className="flex flex-col gap-3 text-sm leading-relaxed text-foreground">
          {/* Quality */}
          <div className="flex items-start gap-2">
            <span className="mt-0.5 shrink-0 text-xs font-mono font-medium text-primary w-20">
              Quality
            </span>
            <span className="text-muted-foreground">{qualityLabel(percentError)}</span>
          </div>

          {/* Formula recap */}
          <div className="flex items-start gap-2">
            <span className="mt-0.5 shrink-0 text-xs font-mono font-medium text-primary w-20">
              Formula
            </span>
            <span className="text-muted-foreground">
              π ≈ 4 × {inside.toLocaleString()} /{" "}
              {total.toLocaleString()} ={" "}
              <span className="font-mono text-foreground">{piEstimate.toFixed(6)}</span>
            </span>
          </div>

          {/* Absolute error */}
          <div className="flex items-start gap-2">
            <span className="mt-0.5 shrink-0 text-xs font-mono font-medium text-primary w-20">
              Abs. error
            </span>
            <span className="text-muted-foreground font-mono">
              {Math.abs(piEstimate - TRUE_PI).toFixed(7)}
            </span>
          </div>

          {/* Inside ratio */}
          <div className="flex items-start gap-2">
            <span className="mt-0.5 shrink-0 text-xs font-mono font-medium text-primary w-20">
              Ratio
            </span>
            <span className="text-muted-foreground">
              {inside.toLocaleString()} inside,{" "}
              {outside.toLocaleString()} outside (
              <span className="font-mono text-foreground">
                {total > 0 ? ((inside / total) * 100).toFixed(2) : 0}%
              </span>{" "}
              hit rate, target ≈ 78.54%)
            </span>
          </div>

          {/* Suggestion */}
          <div className="flex items-start gap-2">
            <span className="mt-0.5 shrink-0 text-xs font-mono font-medium text-primary w-20">
              Tip
            </span>
            <span className="text-muted-foreground">{suggestion(total, percentError)}</span>
          </div>
        </div>
      )}
    </section>
  );
}
