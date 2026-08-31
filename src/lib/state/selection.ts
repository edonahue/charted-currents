import type { Selection } from "../domain/types";

export type SelectionListener = (selection: Selection) => void;

export interface SelectionStore {
  get(): Selection;
  set(selection: Selection): void;
  clear(): void;
  subscribe(listener: SelectionListener): () => void;
}

/**
 * Small framework-free selection store for Packet 1's shared map/inspector path.
 * Keep selection semantics in domain types; UI components subscribe to this state.
 */
export function createSelectionStore(initial: Selection = null): SelectionStore {
  let current = initial;
  const listeners = new Set<SelectionListener>();

  const publish = () => {
    for (const listener of listeners) listener(current);
  };

  return {
    get: () => current,
    set(selection) {
      if (
        current?.kind === selection?.kind &&
        current?.id === selection?.id
      ) {
        return;
      }
      current = selection;
      publish();
    },
    clear() {
      if (current === null) return;
      current = null;
      publish();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export const selectionStore = createSelectionStore();
