"use client";

/**
 * AnimatedCanvas
 * ─────────────────────────────────────────────────────────────────────────────
 * Draws the Monte Carlo scatter plot on an HTML <canvas>:
 *   • Square bounding box
 *   • Quarter-circle arc inscribed in the square
 *   • Green (teal) dots = inside the circle, Red dots = outside
 *
 * Key design decisions:
 *   - ResizeObserver keeps the canvas square inside its flex container.
 *   - A shared `draw` callback is stored in a ref so both the resize handler
 *     and the dots/theme effect can trigger redraws without stale closures.
 *   - CSS custom properties are read at draw-time for correct theming.
 */

import { useCallback, useEffect, useRef } from "react";
import type { Dot } from "@/lib/monte-carlo-types";

interface AnimatedCanvasProps {
  dots: Dot[];
  isDark: boolean;
}

// Hard-coded palette per theme — avoids trying to pass OKLCH CSS vars to
// canvas fillStyle, which only understands legacy color formats (hex, rgb, hsl).
const PALETTE = {
  light: {
    bg: "#f8fafc",
    border: "#e2e8f0",
    circle: "#3563e9",
    inside: "#16a34a",  // green-700
    outside: "#dc2626", // red-600
    label: "#94a3b8",
  },
  dark: {
    bg: "#0d1117",
    border: "#2a2f3a",
    circle: "#6b8bff",
    inside: "#4ade80",  // green-400
    outside: "#f87171", // red-400
    label: "#4b5563",
  },
} as const;

export function AnimatedCanvas({ dots, isDark }: AnimatedCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep a ref to the latest dots + isDark so the resize handler can always
  // trigger a fresh draw without needing them in its dependency array.
  const dotsRef = useRef<Dot[]>(dots);
  const isDarkRef = useRef(isDark);
  dotsRef.current = dots;
  isDarkRef.current = isDark;

  // ── Core draw function ────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = canvas.width;
    if (size === 0) return;

    const currentDots = dotsRef.current;
    const dark = isDarkRef.current;
    const p = dark ? PALETTE.dark : PALETTE.light;

    const bgColor = p.bg;
    const borderColor = p.border;
    const circleColor = p.circle;
    const insideColor = p.inside;
    const outsideColor = p.outside;

    // Background fill
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);

    // Bounding-square stroke
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(1, 1, size - 2, size - 2);

    // Quarter-circle arc — drawn from bottom-left corner with radius = size
    // This represents the inscribed quarter-circle in the unit square [0,1]²
    ctx.beginPath();
    ctx.arc(0, size, size, -Math.PI / 2, 0);
    ctx.strokeStyle = circleColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Map [-1, 1] simulation coords → canvas pixel coords
    const DOT_RADIUS = Math.max(1.5, size / 280);
    const mapX = (x: number) => ((x + 1) / 2) * size;
    const mapY = (y: number) => ((1 - y) / 2) * size; // flip Y: canvas Y axis points down

    // Draw outside dots first (they sit "under" inside dots visually)
    ctx.beginPath();
    for (const dot of currentDots) {
      if (!dot.inside) {
        const px = mapX(dot.x);
        const py = mapY(dot.y);
        ctx.moveTo(px + DOT_RADIUS, py);
        ctx.arc(px, py, DOT_RADIUS, 0, Math.PI * 2);
      }
    }
    ctx.fillStyle = outsideColor + "bb";
    ctx.fill();

    // Draw inside dots on top
    ctx.beginPath();
    for (const dot of currentDots) {
      if (dot.inside) {
        const px = mapX(dot.x);
        const py = mapY(dot.y);
        ctx.moveTo(px + DOT_RADIUS, py);
        ctx.arc(px, py, DOT_RADIUS, 0, Math.PI * 2);
      }
    }
    ctx.fillStyle = insideColor + "bb";
    ctx.fill();

    // Corner coordinate labels for context
    ctx.fillStyle = p.label;
    ctx.font = `${Math.max(9, size / 42)}px monospace`;
    ctx.fillText("(−1,1)", 4, 13);
    ctx.fillText("(1,−1)", size - 44, size - 3);
  }, []); // stable — reads from refs at call time

  // ── Resize observer — keeps canvas square ────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resize = () => {
      const size = Math.min(container.clientWidth, container.clientHeight);
      if (size === 0) return;
      canvas.width = size;
      canvas.height = size;
      draw(); // redraw immediately after resize
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, [draw]);

  // ── Redraw whenever dots or theme change ─────────────────────────────────
  useEffect(() => {
    draw();
  }, [dots, isDark, draw]);

  return (
    <div
      ref={containerRef}
      className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-card"
      aria-label="Monte Carlo scatter plot canvas"
    >
      <canvas
        ref={canvasRef}
        className="block"
        aria-hidden="true"
      />
    </div>
  );
}
