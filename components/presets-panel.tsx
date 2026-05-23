"use client";

/**
 * PresetsPanel
 * ─────────────────────────────────────────────────────────────────────────────
 * Renders the list of preset buttons.
 * Clicking a preset immediately runs the simulation (no extra confirm step).
 */

import { cn } from "@/lib/utils";
import type { Preset } from "@/lib/monte-carlo-types";

interface PresetsPanelProps {
  presets: Preset[];
  activePresetId: string | null;
  onSelect: (preset: Preset) => void;
}

export function PresetsPanel({ presets, activePresetId, onSelect }: PresetsPanelProps) {
  return (
    <section aria-label="Presets">
      <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Presets
      </p>
      <div className="flex flex-col gap-1.5">
        {presets.map((preset) => {
          const isActive = preset.id === activePresetId;
          return (
            <button
              key={preset.id}
              onClick={() => onSelect(preset)}
              aria-pressed={isActive}
              className={cn(
                "flex flex-col items-start rounded-md border px-3 py-2 text-left transition-colors",
                "hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card text-foreground"
              )}
            >
              <span className="text-sm font-medium leading-snug">{preset.label}</span>
              <span className="text-xs text-muted-foreground leading-snug">
                {preset.description}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
