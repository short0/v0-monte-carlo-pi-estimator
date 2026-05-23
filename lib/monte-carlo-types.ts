/**
 * Shared types for the Monte Carlo π estimation engine.
 * Separating types keeps hooks and components clean and
 * makes it easy to extend for future learning-mode features.
 */

export type AnimationSpeed = "slow" | "normal" | "fast";

/** A single sampled point */
export interface Dot {
  x: number; // [-1, 1]
  y: number; // [-1, 1]
  inside: boolean;
}

/** The live simulation state exposed to components */
export interface SimulationState {
  dots: Dot[];
  inside: number;
  total: number;
  piEstimate: number;
  percentError: number;
  isRunning: boolean;
  animationSpeed: AnimationSpeed;
  targetSamples: number;
}

/** A preset configuration */
export interface Preset {
  id: string;
  label: string;
  description: string;
  targetSamples: number;
  animationSpeed: AnimationSpeed;
}

/** Default presets */
export const PRESETS: Preset[] = [
  {
    id: "quick",
    label: "Quick Demo",
    description: "100 samples — instant visual intuition",
    targetSamples: 100,
    animationSpeed: "fast",
  },
  {
    id: "medium",
    label: "10k Samples",
    description: "10 000 samples — good convergence",
    targetSamples: 10_000,
    animationSpeed: "normal",
  },
  {
    id: "large",
    label: "1M Samples",
    description: "1 000 000 samples — high precision",
    targetSamples: 1_000_000,
    animationSpeed: "fast",
  },
];

/** Step sizes for the progression button (100 → 1k → 10k → 100k → 1M) */
export const PROGRESSION_STEPS = [100, 1_000, 10_000, 100_000, 1_000_000];

export const TRUE_PI = Math.PI;
