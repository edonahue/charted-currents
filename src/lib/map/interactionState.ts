/**
 * Scoped client helper for tracking UI interaction trigger modality, origin, and focus target.
 *
 * Keeps transient focus management isolated from the canonical domain selection store
 * without leaking untyped mutable state onto window globals.
 */

export type SelectionTriggerOrigin =
  | "map"
  | "locator_menu"
  | "locator_browser"
  | "timeline"
  | "inspector_connection";
export type SelectionTriggerModality = "pointer" | "keyboard";

export interface SelectionTrigger {
  modality: SelectionTriggerModality;
  origin: SelectionTriggerOrigin;
  returnTarget?: HTMLElement | null;
}

let currentTrigger: SelectionTrigger = {
  modality: "pointer",
  origin: "map",
};

export function recordSelectionTrigger(trigger: SelectionTrigger): void {
  currentTrigger = trigger;
}

export function getSelectionTrigger(): SelectionTrigger {
  return currentTrigger;
}

export function consumeSelectionTrigger(): SelectionTrigger {
  const trigger = currentTrigger;
  currentTrigger = { modality: "pointer", origin: "map" };
  return trigger;
}
