import { RRule, rrulestr } from "rrule";

/**
 * Validate an RRULE string and optionally extract info.
 * @param {string} rruleStr - e.g. "FREQ=DAILY;INTERVAL=3;DTSTART=20251102T090000Z;UNTIL=20251231T090000Z"
 * @returns {{ valid: boolean, error?: string, rule?: RRule }}
 */
export function validateRRule(rruleStr: string) {
  try {
    // Try parsing
    const rule = rrulestr(rruleStr);

    // Extra sanity checks (optional)
    if (!(rule instanceof RRule)) {
      return { valid: false, error: "Parsed rule is not an RRule instance" };
    }

    // Check required FREQ
    if (!rule.options.freq && rule.options.freq !== 0) {
      return { valid: false, error: "Missing FREQ property" };
    }

    return { valid: true, rule };
  } catch (err) {
    if (err instanceof Error) {
      return { valid: false, error: err.message };
    }
    return { valid: false, error: "Invalid RRule string" };
  }
}
