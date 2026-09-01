/**
 * src/lib/state/timeFilter.ts
 *
 * Lightweight, typed client state for temporal period focus in Charted Currents.
 * Preserves simple subscription pattern analogous to selectionStore.
 */

export interface TimeFilterState {
  id: "all" | "1684-1695" | "1702-1712";
  label: string;
  startYear: number;
  endYear: number;
}

export const TIME_FILTER_PRESETS: Record<string, TimeFilterState> = {
  all: {
    id: "all",
    label: "All (1650–1730)",
    startYear: 1650,
    endYear: 1730,
  },
  "1684-1695": {
    id: "1684-1695",
    label: "1684–1695 (Early / Disaster Context)",
    startYear: 1684,
    endYear: 1695,
  },
  "1702-1712": {
    id: "1702-1712",
    label: "1702–1712 (Prize Papers Sample)",
    startYear: 1702,
    endYear: 1712,
  },
};

type TimeFilterListener = (state: TimeFilterState) => void;

class TimeFilterStore {
  private current: TimeFilterState = TIME_FILTER_PRESETS.all;
  private listeners = new Set<TimeFilterListener>();

  get(): TimeFilterState {
    return this.current;
  }

  set(presetKey: "all" | "1684-1695" | "1702-1712" | TimeFilterState): void {
    if (typeof presetKey === "string") {
      this.current = TIME_FILTER_PRESETS[presetKey] || TIME_FILTER_PRESETS.all;
    } else {
      this.current = presetKey;
    }
    this.notify();
  }

  subscribe(listener: TimeFilterListener): () => void {
    this.listeners.add(listener);
    listener(this.current);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.current);
    }
  }
}

export const timeFilterStore = new TimeFilterStore();
