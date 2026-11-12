import { describe, expect, it } from "vitest";
import en from "@/i18n/messages/en.json";
import fr from "@/i18n/messages/fr.json";

function collectKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return collectKeys(value as Record<string, unknown>, path);
    }
    return [path];
  });
}

describe("i18n translation parity (en <-> fr)", () => {
  it("contains identical translation keys in English and French", () => {
    const enKeys = collectKeys(en).sort();
    const frKeys = collectKeys(fr).sort();

    expect(frKeys).toEqual(enKeys);
  });

  it("has no empty translation strings", () => {
    const checkNonEmpty = (obj: Record<string, unknown>, prefix = "") => {
      for (const [key, value] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (typeof value === "string") {
          expect(value.trim().length, `Empty value at ${path}`).toBeGreaterThan(
            0,
          );
        } else if (
          value &&
          typeof value === "object" &&
          !Array.isArray(value)
        ) {
          checkNonEmpty(value as Record<string, unknown>, path);
        }
      }
    };

    checkNonEmpty(en);
    checkNonEmpty(fr);
  });
});
