"use client";

/**
 * ExplainPanel
 * ─────────────────────────────────────────────────────────────────────────────
 * "Explain like I'm learning" toggle panel.
 *
 * When enabled, it simulates a streamed LLM response by revealing a mocked
 * explanation character by character using a typewriter effect.
 * No real API is called — this is entirely local, ready to swap in real
 * streaming once an LLM integration is added.
 *
 * The explanation adapts based on the current simulation result (total samples
 * and percent error) for a dynamic, contextual feel.
 */

import { useEffect, useRef, useState } from "react";
import { BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ExplainPanelProps {
  total: number;
  percentError: number;
  piEstimate: number;
}

/** Generate a mocked LLM explanation tailored to the simulation state */
function buildExplanation(total: number, percentError: number, piEstimate: number): string {
  const piStr = piEstimate > 0 ? piEstimate.toFixed(4) : "—";
  const errStr = total > 0 ? `${percentError.toFixed(2)}%` : "—";

  return `Monte Carlo methods use randomness to solve problems that are hard to solve directly.

Here's the idea: imagine throwing darts randomly at a square dartboard. Inside that square, draw a circle that just fits — a quarter-circle touching all four edges. Some darts land inside the circle, some outside.

The fraction of darts inside the circle turns out to be proportional to the area of the circle (π/4). So if you count how many land inside (call it "in") out of total throws, then:

  π ≈ 4 × in / total

Right now, with ${total.toLocaleString()} samples, the estimate is ${piStr} — about ${errStr} away from the true π (3.14159…).

The magic: with only 100 darts, errors are large (maybe 5–10%). With 10 000, they shrink to ~1%. With 1 million, you get ~0.1%. Error decreases as 1/√N — doubling precision requires 4× as many samples.

This is the "law of large numbers" in action: random guesses converge to truth over time.`;
}

export function ExplainPanel({ total, percentError, piEstimate }: ExplainPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [displayed, setDisplayed] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fullTextRef = useRef("");

  const startTyping = (text: string) => {
    // Clear any in-progress animation
    if (timerRef.current) clearTimeout(timerRef.current);
    setDisplayed("");
    setIsTyping(true);
    fullTextRef.current = text;
    let i = 0;

    const typeNext = () => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i < text.length) {
        // Vary speed slightly to feel natural — faster in bulk, slight pauses at punctuation
        const char = text[i - 1];
        const delay =
          char === "." || char === "\n" ? 30 : char === "," ? 20 : 5;
        timerRef.current = setTimeout(typeNext, delay);
      } else {
        setIsTyping(false);
      }
    };

    timerRef.current = setTimeout(typeNext, 0);
  };

  const handleToggle = () => {
    if (!isOpen) {
      setIsOpen(true);
      const explanation = buildExplanation(total, percentError, piEstimate);
      startTyping(explanation);
    } else {
      setIsOpen(false);
      setDisplayed("");
      setIsTyping(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  };

  // Re-run explanation when simulation data meaningfully changes
  useEffect(() => {
    if (isOpen) {
      const explanation = buildExplanation(total, percentError, piEstimate);
      // Only restart typing if text changed (debounce by checking ref)
      if (explanation !== fullTextRef.current) {
        startTyping(explanation);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <section className="rounded-lg border border-border bg-card" aria-label="Learning explanation">
      {/* Toggle button */}
      <button
        onClick={handleToggle}
        className={cn(
          "flex w-full items-center justify-between gap-2 px-4 py-3 text-left",
          "transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "rounded-lg"
        )}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            Explain like I&apos;m learning
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {isOpen && isTyping && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          )}
          {/* Mocked "AI" badge */}
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            AI
          </span>
          <span className="text-muted-foreground text-xs">{isOpen ? "▲" : "▼"}</span>
        </div>
      </button>

      {/* Explanation content */}
      {isOpen && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          {/* "Mocked response" label for transparency */}
          <p className="mb-2 text-xs text-muted-foreground italic">
            Simulated AI response (no real API call)
          </p>
          <div className="relative">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
              {displayed}
              {isTyping && (
                <span className="ml-px inline-block h-4 w-0.5 animate-pulse bg-primary" />
              )}
            </pre>
          </div>
          {/* Provide a "skip to end" button while typing */}
          {isTyping && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 h-6 text-xs"
              onClick={() => {
                if (timerRef.current) clearTimeout(timerRef.current);
                setDisplayed(fullTextRef.current);
                setIsTyping(false);
              }}
            >
              Skip animation
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
