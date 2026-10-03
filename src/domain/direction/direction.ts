import type { DirectionVersion } from "./types";

/** A historical season reads the version that was in effect on its start date. */
export function directionVersionAt(versions: DirectionVersion[], date: string) {
  return versions.find((version) => version.effectiveFrom <= date && (!version.effectiveTo || version.effectiveTo >= date));
}

export function isDirectionStatement(value: string) {
  return value.trim().length > 0 && value.trim().length <= 500;
}
