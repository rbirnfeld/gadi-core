/** English numeric-claim screening, not semantic fact verification. */
const UNITS: Record<string, number> = Object.fromEntries(
  "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen"
    .split(" ").map((word, value) => [word, value]),
);
const TENS: Record<string, number> = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
const SCALES: Record<string, number> = { thousand: 1000, million: 1e6, billion: 1e9 };
const ORDINALS: Record<string, number> = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10, eleventh: 11, twelfth: 12 };

function lookup(values: Record<string, number>, key: string): number | undefined {
  return Object.hasOwn(values, key) ? values[key] : undefined;
}

/** Legacy poker idiom tolerance. Use minimum: 0 for ranks, laps and medals. */
export const GUARDED_FROM = 10;
export interface NumberGuardOptions {
  /** Minimum absolute magnitude challenged; zero includes every parsed value. */
  minimum?: number;
}

/**
 * Recognizes signed decimal digits, grouped thousands, numeric ordinals,
 * English cardinals through billions, and first–twelfth. Decimal point is '.',
 * comma is a thousands separator. Not a locale-aware parser; dates, fractions,
 * scientific notation and arbitrary prose arithmetic are not supported.
 */
export function numbersIn(text: string): Set<number> {
  const found = new Set<number>();
  const normalised = text.toLowerCase().replace(/\u2212/g, "-")
    .replace(/\d{1,3}(?:[,\u0020\u00a0\u2009\u202f\u2019']\d{3})+(?!\d)/g,
      (group) => group.replace(/[,\s\u2009\u202f\u2019']/g, ""));
  for (const match of normalised.matchAll(/[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:st|nd|rd|th)?/g)) {
    const value = Number(match[0].replace(/(?:st|nd|rd|th)$/, ""));
    if (Number.isFinite(value)) found.add(value);
  }
  const words = normalised.replace(/[‐-―-]/g, " ").split(/[^a-z]+/).filter(Boolean);
  for (let i = 0; i < words.length; i++) {
    let j = i;
    let sign = 1;
    if (words[j] === "minus" || words[j] === "negative") { sign = -1; j++; }
    let total = 0;
    let group = 0;
    let seen = false;
    let last = "";
    for (; j < words.length; j++) {
      const word = words[j];
      const unit = lookup(UNITS, word);
      const tens = lookup(TENS, word);
      if (unit !== undefined || tens !== undefined) {
        // Adjacent independent numbers must not be added together ("one two").
        if (last === "unit" || (last === "tens" && (unit === undefined || unit < 1 || unit > 9))) break;
        group += unit ?? tens!;
        last = tens !== undefined ? "tens" : "unit";
        seen = true;
      } else if (word === "hundred" && last === "unit" && group > 0 && group < 10) {
        group *= 100;
        last = "scale";
      } else if (lookup(SCALES, word) !== undefined && seen && group > 0) {
        total += group * lookup(SCALES, word)!;
        group = 0;
        last = "scale";
      } else if (word === "and" && last === "scale" && (lookup(UNITS, words[j + 1]) !== undefined || lookup(TENS, words[j + 1]) !== undefined)) {
        continue;
      } else break;
    }
    if (seen) {
      found.add(sign * (total + group));
      i = j - 1;
    } else if (lookup(ORDINALS, words[i]) !== undefined) {
      found.add(lookup(ORDINALS, words[i])!);
    }
  }
  return found;
}

/** A matching value cannot establish its owner, unit, event, or meaning. */
export function unknownNumbersIn(line: string, allowed: ReadonlySet<number>, { minimum = GUARDED_FROM }: NumberGuardOptions = {}): number[] {
  if (!Number.isFinite(minimum) || minimum < 0) throw new RangeError("minimum must be finite and nonnegative");
  return [...numbersIn(line)].filter((n) => Math.abs(n) >= minimum && !allowed.has(n));
}
export function inventsNumbers(line: string, facts: string, options?: NumberGuardOptions): boolean {
  return unknownNumbersIn(line, numbersIn(facts), options).length > 0;
}
