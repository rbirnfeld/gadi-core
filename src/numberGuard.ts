/**
 * Catching a model that made a number up.
 *
 * Instructing a model not to invent figures works most of the time, and the
 * failures are the expensive kind: a review that confidently reports a
 * twenty-five coin win on a session that finished level reads exactly like a
 * true one. Every time one slipped through the answer was another line of
 * prompt — "never write a minus sign", "never say all-in unless the notes
 * say so" — which is whack-a-mole. This is the general form: throw out any
 * line stating a figure that was not in the facts it was given.
 */

const UNITS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
  fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
  nineteen: 19,
};

const TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70,
  eighty: 80, ninety: 90,
};

/**
 * Below this, a number in prose is idiom rather than a claim. "two pair",
 * "one of your calls", "a couple of hands" — guarding those throws away
 * accurate reviews to catch nothing. Everything that matters here is above
 * it: chip amounts, percentages, hand numbers, and every board total worth
 * arguing about.
 */
export const GUARDED_FROM = 10;

export function numbersIn(text: string): Set<number> {
  const found = new Set<number>();
  const normalised = text
    .toLowerCase()
    // 2,382 is one number. Without this it reads as 2 and 382, and 382 looks
    // invented — poker deals in thousands, so this is not an edge case.
    //
    // The separator is not always a comma. A model writing 8 818 with a
    // NARROW NO-BREAK SPACE (U+202F) — the typographic thousands separator —
    // had an entirely accurate review thrown out for inventing 818 and 645.
    // Nothing about that is visible on screen, which is what makes it worth
    // handling rather than hoping about: regular, no-break, thin and narrow
    // no-break spaces, and the Swiss apostrophe.
    .replace(/(\d)[,\u0020\u00a0\u2009\u202f\u2019'](?=\d{3}\b)/g, "$1")
    // Hyphens and dashes separate words, not digits.
    .replace(/[‐-―-]/g, " ");

  for (const match of normalised.matchAll(/\d+/g)) found.add(Number(match[0]));

  const words = normalised.split(/[^a-z]+/).filter(Boolean);
  for (let i = 0; i < words.length; i++) {
    const tens = TENS[words[i]];
    if (tens !== undefined) {
      // "seventy three" is one number, and it is not seventy either.
      const unit = UNITS[words[i + 1]];
      if (unit !== undefined && unit >= 1 && unit <= 9) {
        found.add(tens + unit);
        i++;
        continue;
      }
      found.add(tens);
      continue;
    }
    const unit = UNITS[words[i]];
    if (unit !== undefined) found.add(unit);
  }

  return found;
}

/** Guarded figures in `line` that the facts never mentioned. */
export function unknownNumbersIn(line: string, allowed: Set<number>): number[] {
  return [...numbersIn(line)].filter((n) => n >= GUARDED_FROM && !allowed.has(n));
}

export function inventsNumbers(line: string, facts: string): boolean {
  return unknownNumbersIn(line, numbersIn(facts)).length > 0;
}
