/**
 * Scoped client helper for tracking UI interaction trigger modality and focus origin.
 *
 * Keeps transient focus management isolated from the canonical domain selection store
 * without leaking untyped mutable state onto window globals.
 */

let lastKeyboardTrigger: HTMLElement | null = null;
let lastTriggerType: "pointer" | "keyboard" = "pointer";

export function recordSelectionTrigger(type: "pointer" | "keyboard", element?: HTMLElement | null): void {
  lastTriggerType = type;
  lastKeyboardTrigger = type === "keyboard" && element ? element : null;
}

export function getLastSelectionTrigger(): "pointer" | "keyboard" {
  return lastTriggerType;
}

export function popLastKeyboardTrigger(): HTMLElement | null {
  const el = lastKeyboardTrigger;
  lastKeyboardTrigger = null;
  lastTriggerType = "pointer";
  return el;
}

export function clearSelectionTrigger(): void {
  lastKeyboardTrigger = null;
  lastTriggerType = "pointer";
}
