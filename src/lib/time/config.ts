export const TIMELINE_RANGE = {
  startYear: 1650,
  endYear: 1730,
} as const;

/**
 * Packet 1 renders this range as an intentional compositional rail only.
 * It must not imply historical filtering until Packet 2 supplies temporal data.
 */
export const TIMELINE_PACKET1_INTERACTIVE = false as const;
