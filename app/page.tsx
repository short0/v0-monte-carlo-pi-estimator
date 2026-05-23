"use client";

/**
 * app/page.tsx — Monte Carlo π Estimator
 * ─────────────────────────────────────────────────────────────────────────────
 * Root page that:
 *   1. Owns the simulation engine (useMonteCarloSimulation)
 *   2. Owns the undo/redo stack for user actions (useUndoRedo)
 *   3. Persists theme, target, and last run state to localStorage
 *   4. Wires TopBar, ControlsPanel, AnimatedCanvas, ResultsPanel,
 *      AnalysisPanel, and ExplainPanel together
 *
 * Layout:
 *   ┌────────────────────────── TopBar ───────────────────────────┐
 *   │  Left column (controls)  │  Right column (canvas + results) │
 *   └─────────────────────────────────────────────────────────────┘
 *   On small screens the columns stack vertically.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { TopBar } from "@/components/top-bar";
import { ControlsPanel } from "@/components/controls-panel";
import { AnimatedCanvas } from "@/components/animated-canvas";
import { ResultsPanel } from "@/components/results-panel";
import { AnalysisPanel } from "@/components/analysis-panel";
import { ExplainPanel } from "@/components/explain-panel";
import { useMonteCarloSimulation } from "@/hooks/use-monte-carlo";
import { useUndoRedo } from "@/hooks/use-undo-redo";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { PRESETS } from "@/lib/monte-carlo-types";
import type { AnimationSpeed, Preset } from "@/lib/monte-carlo-types";

// ──────────────────────────────────────────────────────────────────────────────
// Undo/redo action shape — tracks user-driven configuration changes
// ──────────────────────────────────────────────────────────────────────────────
interface AppConfig {
  targetSamples: number;
  animationSpeed: AnimationSpeed;
  activePresetId: string | null;
}

const DEFAULT_PRESET = PRESETS[1]; // "10k samples" as default
const DEFAULT_CONFIG: AppConfig = {
  targetSamples: DEFAULT_PRESET.targetSamples,
  animationSpeed: DEFAULT_PRESET.animationSpeed,
  activePresetId: DEFAULT_PRESET.id,
};

// ──────────────────────────────────────────────────────────────────────────────
// Theme bootstrapping helper
// Applies/removes the "dark" class on <html> to match Tailwind's dark variant.
// ──────────────────────────────────────────────────────────────────────────────
function applyTheme(dark: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", dark);
}

export default function MonteCarloPage() {
  // ── Simulation engine ────────────────────────────────────────────────────
  const { state: sim, start, pause, reset, setTargetSamples, setAnimationSpeed, runInstant } =
    useMonteCarloSimulation();

  // ── Undo / redo for config changes ──────────────────────────────────────
  const {
    state: config,
    push: pushConfig,
    undo,
    redo,
    canUndo,
    canRedo,
    reset: resetConfig,
  } = useUndoRedo<AppConfig>(DEFAULT_CONFIG, 15);

  // ── Persisted preferences ───────────────────────────────────────────────
  const [storedTheme, setStoredTheme] = useLocalStorage<"light" | "dark">(
    "mc-pi-theme",
    "light"
  );
  const [storedTarget, setStoredTarget] = useLocalStorage<number>(
    "mc-pi-target",
    DEFAULT_CONFIG.targetSamples
  );

  // ── Local UI state ───────────────────────────────────────────────────────
  const [isDark, setIsDark] = useState<boolean>(storedTheme === "dark");

  // ── Apply theme on mount and whenever isDark changes ────────────────────
  useEffect(() => {
    applyTheme(isDark);
    setStoredTheme(isDark ? "dark" : "light");
  }, [isDark, setStoredTheme]);

  // ── Respect system prefers-color-scheme on very first load ──────────────
  useEffect(() => {
    // Only auto-apply system preference when user has never set a preference
    const hasStoredPref =
      typeof window !== "undefined" && localStorage.getItem("mc-pi-theme") !== null;
    if (hasStoredPref) return;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDark(prefersDark);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Restore last target on mount ────────────────────────────────────────
  useEffect(() => {
    if (storedTarget !== DEFAULT_CONFIG.targetSamples) {
      setTargetSamples(storedTarget);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Config change helpers (wrapped to push to undo stack) ─────────────
  const handleSetTarget = useCallback(
    (n: number) => {
      const next: AppConfig = { ...config, targetSamples: n, activePresetId: null };
      pushConfig(next);
      setTargetSamples(n);
      setStoredTarget(n);
    },
    [config, pushConfig, setTargetSamples, setStoredTarget]
  );

  const handleSetSpeed = useCallback(
    (speed: AnimationSpeed) => {
      const next: AppConfig = { ...config, animationSpeed: speed };
      pushConfig(next);
      setAnimationSpeed(speed);
    },
    [config, pushConfig, setAnimationSpeed]
  );

  const handleSelectPreset = useCallback(
    (preset: Preset) => {
      const next: AppConfig = {
        targetSamples: preset.targetSamples,
        animationSpeed: preset.animationSpeed,
        activePresetId: preset.id,
      };
      pushConfig(next);
      setAnimationSpeed(preset.animationSpeed);
      // runInstant shows results immediately, per spec (no extra click needed)
      runInstant(preset.targetSamples, preset.animationSpeed);
      setStoredTarget(preset.targetSamples);
    },
    [pushConfig, setAnimationSpeed, runInstant, setStoredTarget]
  );

  // ── Undo/Redo — sync config back to engine ────────────────────────────
  // We use a ref flag so that normal pushConfig actions (preset, speed, target)
  // do NOT re-trigger setTargetSamples — only explicit undo/redo actions do.
  const isUndoRedoRef = useRef(false);

  useEffect(() => {
    if (!isUndoRedoRef.current) return;
    isUndoRedoRef.current = false;
    setTargetSamples(config.targetSamples);
    setAnimationSpeed(config.animationSpeed);
    reset(); // reset simulation when undoing/redoing to a different config
  }, [config, setTargetSamples, setAnimationSpeed, reset]);

  const handleUndo = useCallback(() => {
    isUndoRedoRef.current = true;
    undo();
  }, [undo]);

  const handleRedo = useCallback(() => {
    isUndoRedoRef.current = true;
    redo();
  }, [redo]);

  // ── Home / reset ────────────────────────────────────────────────────────
  const handleHome = useCallback(() => {
    resetConfig(DEFAULT_CONFIG);
    setTargetSamples(DEFAULT_CONFIG.targetSamples);
    setAnimationSpeed(DEFAULT_CONFIG.animationSpeed);
    reset();
  }, [resetConfig, setTargetSamples, setAnimationSpeed, reset]);

  // ── Theme toggle ────────────────────────────────────────────────────────
  const handleToggleTheme = useCallback(() => {
    setIsDark((d) => !d);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <TopBar
        onHome={handleHome}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
      />

      {/* ── Main two-column layout ───────────────────────────────────────── */}
      <main className="flex flex-1 flex-col lg:flex-row">
        {/* Left column — controls */}
        <aside className="w-full border-b border-border lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r xl:w-72">
          <ControlsPanel
            isRunning={sim.isRunning}
            targetSamples={config.targetSamples}
            animationSpeed={config.animationSpeed}
            activePresetId={config.activePresetId}
            total={sim.total}
            onPlay={start}
            onPause={pause}
            onReset={reset}
            onSetTarget={handleSetTarget}
            onSetSpeed={handleSetSpeed}
            onSelectPreset={handleSelectPreset}
          />
        </aside>

        {/* Right column — canvas + results */}
        <section className="flex flex-1 flex-col overflow-y-auto">
          {/* Canvas */}
          <div className="p-4 lg:p-6">
            <AnimatedCanvas dots={sim.dots} isDark={isDark} />
          </div>

          {/* Results stats */}
          <div className="border-t border-border">
            <ResultsPanel
              piEstimate={sim.piEstimate}
              percentError={sim.percentError}
              inside={sim.inside}
              total={sim.total}
            />
          </div>

          {/* Analysis & Explain panels */}
          <div className="flex flex-col gap-3 border-t border-border p-4 lg:p-5">
            <AnalysisPanel
              piEstimate={sim.piEstimate}
              percentError={sim.percentError}
              total={sim.total}
              inside={sim.inside}
            />
            <ExplainPanel
              total={sim.total}
              percentError={sim.percentError}
              piEstimate={sim.piEstimate}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
