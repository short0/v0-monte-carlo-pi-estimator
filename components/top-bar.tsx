"use client";

/**
 * TopBar
 * ─────────────────────────────────────────────────────────────────────────────
 * Sticky header with:
 *   • Centered title "Estimating π (Monte Carlo)"
 *   • Home/reset button (left)
 *   • Undo / Redo buttons (left, next to home)
 *   • Theme toggle (right)
 */

import { Home, Moon, Redo2, Sun, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  onHome: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isDark: boolean;
  onToggleTheme: () => void;
}

export function TopBar({
  onHome,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isDark,
  onToggleTheme,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-border bg-background/90 px-4 py-2.5 backdrop-blur-sm">
      {/* Left controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onHome}
          title="Reset to default preset"
          aria-label="Home — reset to default"
          className="h-8 w-8"
        >
          <Home className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo last action"
          aria-label="Undo"
          className="h-8 w-8"
        >
          <Undo2 className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo last action"
          aria-label="Redo"
          className="h-8 w-8"
        >
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Centered title */}
      <h1 className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold tracking-tight text-foreground sm:text-base">
        Estimating&nbsp;<span className="text-primary font-mono">π</span>&nbsp;
        <span className="hidden text-muted-foreground font-normal sm:inline">
          (Monte Carlo)
        </span>
      </h1>

      {/* Right — theme toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleTheme}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className="h-8 w-8"
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
    </header>
  );
}
