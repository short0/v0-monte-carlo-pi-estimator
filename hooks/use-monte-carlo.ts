"use client";

/**
 * useMonteCarloSimulation
 * ─────────────────────────────────────────────────────────────────────────────
 * Core engine hook for the Monte Carlo π estimator.
 *
 * How it works:
 *   1. Generate random (x, y) in [-1, 1] × [-1, 1].
 *   2. A point is "inside" the unit circle when x² + y² ≤ 1.
 *   3. π ≈ 4 × (inside count / total count)
 *
 * Animation is driven by requestAnimationFrame; each frame adds a batch of
 * new dots so we can keep the UI fluid even at 1M samples.
 *
 * The hook exposes the full SimulationState plus imperative controls so the
 * parent can wire undo/redo actions around state transitions.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { AnimationSpeed, Dot, SimulationState } from "@/lib/monte-carlo-types";

// How many dots to add per animation frame at each speed setting.
// Tuned so that even "fast" mode feels responsive without blocking the thread.
const DOTS_PER_FRAME: Record<AnimationSpeed, number> = {
  slow: 5,
  normal: 50,
  fast: 500,
};

// Maximum dots kept in the `dots` array passed to the canvas.
// Beyond this we still count samples but skip storing the point to save memory.
const MAX_STORED_DOTS = 4_000;

function computePiEstimate(inside: number, total: number): number {
  if (total === 0) return 0;
  return (4 * inside) / total;
}

function computePercentError(estimate: number): number {
  if (estimate === 0) return 100;
  return Math.abs((estimate - Math.PI) / Math.PI) * 100;
}

// Generate a single random dot
function randomDot(): Dot {
  const x = Math.random() * 2 - 1;
  const y = Math.random() * 2 - 1;
  return { x, y, inside: x * x + y * y <= 1 };
}

export interface UseMonteCarloReturn {
  state: SimulationState;
  start: () => void;
  pause: () => void;
  reset: () => void;
  setTargetSamples: (n: number) => void;
  setAnimationSpeed: (speed: AnimationSpeed) => void;
  /** Run to completion instantly (no animation) — used by presets */
  runInstant: (samples: number, speed?: AnimationSpeed) => void;
}

export function useMonteCarloSimulation(): UseMonteCarloReturn {
  // Internal counters kept in refs to avoid triggering re-renders every dot
  const insideRef = useRef(0);
  const totalRef = useRef(0);
  const dotsRef = useRef<Dot[]>([]);
  const rafRef = useRef<number | null>(null);

  const [state, setState] = useState<SimulationState>({
    dots: [],
    inside: 0,
    total: 0,
    piEstimate: 0,
    percentError: 100,
    isRunning: false,
    animationSpeed: "normal",
    targetSamples: 10_000,
  });

  // Speed ref so rAF callback always reads the latest value without closure issues
  const speedRef = useRef<AnimationSpeed>("normal");
  const targetRef = useRef(10_000);
  const isRunningRef = useRef(false);

  // Flush the current counters/dots into React state (triggers re-render)
  const flushState = useCallback((isRunning: boolean) => {
    const inside = insideRef.current;
    const total = totalRef.current;
    const piEstimate = computePiEstimate(inside, total);
    setState((prev) => ({
      ...prev,
      dots: [...dotsRef.current],
      inside,
      total,
      piEstimate,
      percentError: computePercentError(piEstimate),
      isRunning,
    }));
  }, []);

  // Main animation loop — called on every rAF tick while running
  const animate = useCallback(() => {
    const batchSize = DOTS_PER_FRAME[speedRef.current];
    const remaining = targetRef.current - totalRef.current;

    if (remaining <= 0) {
      // Reached target — stop and flush
      isRunningRef.current = false;
      flushState(false);
      return;
    }

    const actual = Math.min(batchSize, remaining);
    for (let i = 0; i < actual; i++) {
      const dot = randomDot();
      if (dot.inside) insideRef.current++;
      totalRef.current++;
      // Only store dots up to the cap to keep the canvas fast
      if (dotsRef.current.length < MAX_STORED_DOTS) {
        dotsRef.current.push(dot);
      }
    }

    flushState(true);
    rafRef.current = requestAnimationFrame(animate);
  }, [flushState]);

  const start = useCallback(() => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    setState((prev) => ({ ...prev, isRunning: true }));
    rafRef.current = requestAnimationFrame(animate);
  }, [animate]);

  const pause = useCallback(() => {
    isRunningRef.current = false;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setState((prev) => ({ ...prev, isRunning: false }));
  }, []);

  const reset = useCallback(() => {
    pause();
    insideRef.current = 0;
    totalRef.current = 0;
    dotsRef.current = [];
    setState((prev) => ({
      ...prev,
      dots: [],
      inside: 0,
      total: 0,
      piEstimate: 0,
      percentError: 100,
      isRunning: false,
    }));
  }, [pause]);

  const setTargetSamples = useCallback(
    (n: number) => {
      targetRef.current = n;
      setState((prev) => ({ ...prev, targetSamples: n }));
      // Note: intentionally NOT auto-resetting here so preset runInstant results
      // are preserved. Callers that want a fresh run should call reset() themselves.
    },
    []
  );

  const setAnimationSpeed = useCallback((speed: AnimationSpeed) => {
    speedRef.current = speed;
    setState((prev) => ({ ...prev, animationSpeed: speed }));
  }, []);

  /**
   * runInstant — deterministically adds all samples synchronously.
   * Used when a preset is clicked so the result is shown immediately.
   */
  const runInstant = useCallback(
    (samples: number, speed: AnimationSpeed = "fast") => {
      pause();
      // Reset counters
      insideRef.current = 0;
      totalRef.current = 0;
      dotsRef.current = [];

      speedRef.current = speed;
      targetRef.current = samples;

      // Add all samples at once
      for (let i = 0; i < samples; i++) {
        const dot = randomDot();
        if (dot.inside) insideRef.current++;
        totalRef.current++;
        if (dotsRef.current.length < MAX_STORED_DOTS) {
          dotsRef.current.push(dot);
        }
      }

      const inside = insideRef.current;
      const total = totalRef.current;
      const piEstimate = computePiEstimate(inside, total);
      setState({
        dots: [...dotsRef.current],
        inside,
        total,
        piEstimate,
        percentError: computePercentError(piEstimate),
        isRunning: false,
        animationSpeed: speed,
        targetSamples: samples,
      });
    },
    [pause]
  );

  // Clean up rAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { state, start, pause, reset, setTargetSamples, setAnimationSpeed, runInstant };
}
