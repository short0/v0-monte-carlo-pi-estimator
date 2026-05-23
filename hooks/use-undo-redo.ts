"use client";

/**
 * useUndoRedo<T>
 * ─────────────────────────────────────────────────────────────────────────────
 * Generic undo/redo stack for up to `maxHistory` actions.
 *
 * Usage:
 *   const { state, push, undo, redo, canUndo, canRedo, reset } =
 *     useUndoRedo(initialState, 15);
 *
 * `push` records the new state in the history stack and moves the pointer
 * forward, discarding any "future" states (like any good undo system).
 */

import { useCallback, useState } from "react";

const DEFAULT_MAX_HISTORY = 15;

export interface UseUndoRedoReturn<T> {
  state: T;
  push: (newState: T) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  reset: (initial: T) => void;
}

export function useUndoRedo<T>(
  initialState: T,
  maxHistory = DEFAULT_MAX_HISTORY
): UseUndoRedoReturn<T> {
  // history[pointer] is the "current" state
  const [history, setHistory] = useState<T[]>([initialState]);
  const [pointer, setPointer] = useState(0);

  const state = history[pointer];
  const canUndo = pointer > 0;
  const canRedo = pointer < history.length - 1;

  const push = useCallback(
    (newState: T) => {
      setHistory((prev) => {
        // Discard any redo states after current pointer
        const trimmed = prev.slice(0, pointer + 1);
        const next = [...trimmed, newState];
        // Keep at most maxHistory entries (drop oldest when overflow)
        return next.length > maxHistory ? next.slice(next.length - maxHistory) : next;
      });
      setPointer((p) => Math.min(p + 1, maxHistory - 1));
    },
    [pointer, maxHistory]
  );

  const undo = useCallback(() => {
    if (canUndo) setPointer((p) => p - 1);
  }, [canUndo]);

  const redo = useCallback(() => {
    if (canRedo) setPointer((p) => p + 1);
  }, [canRedo]);

  const reset = useCallback((initial: T) => {
    setHistory([initial]);
    setPointer(0);
  }, []);

  return { state, push, undo, redo, canUndo, canRedo, reset };
}
