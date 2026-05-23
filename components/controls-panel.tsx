"use client";

/**
 * ControlsPanel
 * ─────────────────────────────────────────────────────────────────────────────
 * Left-column controls:
 *   • Sample count input with a slider
 *   • Progression step buttons (100 → 1k → 10k → 100k → 1M)
 *   • Animation speed selector (slow / normal / fast)
 *   • Play / Pause button
 *   • Reset button
 *   • Presets section
 */

import { Pause, Play, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PresetsPanel } from "@/components/presets-panel";
import { cn } from "@/lib/utils";
import { PRESETS, PROGRESSION_STEPS } from "@/lib/monte-carlo-types";
import type { AnimationSpeed, Preset } from "@/lib/monte-carlo-types";

interface ControlsPanelProps {
  isRunning: boolean;
  targetSamples: number;
  animationSpeed: AnimationSpeed;
  activePresetId: string | null;
  total: number;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onSetTarget: (n: number) => void;
  onSetSpeed: (s: AnimationSpeed) => void;
  onSelectPreset: (preset: Preset) => void;
}

const SPEED_OPTIONS: { label: string; value: AnimationSpeed }[] = [
  { label: "Slow", value: "slow" },
  { label: "Normal", value: "normal" },
  { label: "Fast", value: "fast" },
];

function formatLabel(n: number): string {
  if (n >= 1_000_000) return `${n / 1_000_000}M`;
  if (n >= 1_000) return `${n / 1_000}k`;
  return String(n);
}

export function ControlsPanel({
  isRunning,
  targetSamples,
  animationSpeed,
  activePresetId,
  total,
  onPlay,
  onPause,
  onReset,
  onSetTarget,
  onSetSpeed,
  onSelectPreset,
}: ControlsPanelProps) {
  const progress = targetSamples > 0 ? Math.min(total / targetSamples, 1) : 0;

  return (
    <aside className="flex flex-col gap-5 p-4 lg:p-5">
      {/* Play / Pause / Reset row */}
      <div className="flex items-center gap-2">
        <Button
          onClick={isRunning ? onPause : onPlay}
          size="sm"
          className="flex-1 gap-1.5"
          aria-label={isRunning ? "Pause simulation" : "Start simulation"}
          disabled={!isRunning && total >= targetSamples && targetSamples > 0}
        >
          {isRunning ? (
            <>
              <Pause className="h-3.5 w-3.5" /> Pause
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5" /> Run
            </>
          )}
        </Button>
        <Button
          onClick={onReset}
          variant="outline"
          size="sm"
          className="gap-1.5"
          aria-label="Reset simulation"
        >
          <RefreshCcw className="h-3.5 w-3.5" />
          Reset
        </Button>
      </div>

      {/* Progress bar */}
      <div>
        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
          <span>Samples</span>
          <span className="font-mono">
            {total.toLocaleString()} / {targetSamples.toLocaleString()}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-100"
            style={{ width: `${progress * 100}%` }}
            role="progressbar"
            aria-valuenow={total}
            aria-valuemin={0}
            aria-valuemax={targetSamples}
          />
        </div>
      </div>

      {/* Sample target — progression buttons */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Target Samples
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PROGRESSION_STEPS.map((step) => (
            <button
              key={step}
              onClick={() => onSetTarget(step)}
              aria-pressed={targetSamples === step}
              className={cn(
                "rounded border px-2.5 py-1 text-xs font-mono font-medium transition-colors",
                "hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                targetSamples === step
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground"
              )}
            >
              {formatLabel(step)}
            </button>
          ))}
        </div>
      </div>

      {/* Animation speed */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Animation Speed
        </p>
        <div className="flex gap-1.5">
          {SPEED_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSetSpeed(opt.value)}
              aria-pressed={animationSpeed === opt.value}
              className={cn(
                "flex-1 rounded border py-1.5 text-xs font-medium transition-colors",
                "hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                animationSpeed === opt.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* Presets */}
      <PresetsPanel
        presets={PRESETS}
        activePresetId={activePresetId}
        onSelect={onSelectPreset}
      />
    </aside>
  );
}
