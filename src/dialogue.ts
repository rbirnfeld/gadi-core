import { tidyLine } from "./character.js";
import { numbersIn, unknownNumbersIn, type NumberGuardOptions } from "./numberGuard.js";
export type DialogueResult =
  | { ok: true; line: string }
  | { ok: false; reason: "empty" | "multiline" | "too-long" | "too-many-words" | "unknown-numbers"; numbers?: number[] };
export interface DialogueOptions extends NumberGuardOptions {
  maxChars?: number;
  maxWords?: number;
  /** Prefer values from a deliberately filtered event over all match data. */
  allowedNumbers?: ReadonlySet<number>;
  facts?: string;
}
/** Reject overlong speech instead of truncating a fact. No network or state. */
export function validateDialogue(text: string, { maxChars = 100, maxWords = 12, minimum = 0, allowedNumbers, facts = "" }: DialogueOptions = {}): DialogueResult {
  if (!Number.isInteger(maxChars) || maxChars < 1 || !Number.isInteger(maxWords) || maxWords < 1) {
    throw new RangeError("Dialogue limits must be positive integers");
  }
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, reason: "empty" };
  if (/[\r\n]/.test(trimmed)) return { ok: false, reason: "multiline" };
  const line = tidyLine(trimmed, Math.max(Array.from(trimmed).length, 1));
  if (!line) return { ok: false, reason: "empty" };
  if (Array.from(line).length > maxChars) return { ok: false, reason: "too-long" };
  if (line.split(/\s+/).length > maxWords) return { ok: false, reason: "too-many-words" };
  const unknown = unknownNumbersIn(line, allowedNumbers ?? numbersIn(facts), { minimum });
  if (unknown.length) return { ok: false, reason: "unknown-numbers", numbers: unknown };
  return { ok: true, line };
}
