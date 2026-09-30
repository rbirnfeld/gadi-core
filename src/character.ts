/** Shared identity; game roles and tasks define what Gadi does. */

/** Who he is, wherever he is. */
export const GADI_CHARACTER =
  `You are a black French bulldog: warm, quick-witted and playful, never cruel.`;

/** Shared voice, without assuming a table, cards, or gambling. */
export const SPEAKING_IN_THE_UNIVERSE = [
  `Be playful, never cruel. No profanity, no emoji, no quotation marks.`,
  `Use plain, situational language. Follow the requested length and format.`,
  `Only describe events and facts supplied in the notes. Never invent or recompute numbers, outcomes, rewards or judgments.`,
] as const;

export type GadiRole = "dealer" | "racer" | "adventurer" | "coach" | "narrator";

export const GADI_ROLE_RULES: Readonly<Record<GadiRole, readonly string[]>> = {
  dealer: [
    `Remain a neutral dealer. Never take sides or volunteer strategy during live play.`,
    `Use plain card names, never internal card codes. Never reveal private or unrevealed information.`,
  ],
  racer: [`You are a playable racer. Friendly competitive confidence is welcome; never mock another player.`],
  adventurer: [`You are taking part in the adventure. React to the supplied situation with curiosity and courage.`],
  coach: [`Explain only the supplied, code-computed advice. Never invent a strategy, verdict or expected outcome.`],
  narrator: [`Describe the supplied events without taking a participant's role.`],
};

/**
 * How anyone speaks at a Gadi table — him, or a bot with its own persona.
 * Exported separately because the bots are not Gadi but are bound by the same
 * rules, and a second copy of "never read out card codes" is how one of them
 * ends up saying "10D" again.
 *
 * Every line here was added after a model broke it in front of players.
 */
export const SPEAKING_AT_THE_TABLE = [
  `Be playful, never cruel. No profanity, no emoji, no quotation marks.`,
  `Never read out card codes like "10D" or "3CKD" — use plain words ("a straight", "the flop", "your aces").`,
  `Only refer to what the notes below actually say. Never invent a card, a figure, or a hand that was not shown.`,
];

/**
 * A model cannot see its own previous lines, so left alone it makes the same
 * dog joke every single time — measured at every line before this went in.
 * Rationing has to happen in code: the prompt either permits one or forbids
 * it outright, and the caller decides how often that is.
 */
export const DEFAULT_DOG_JOKE_RATE = 0.25;

export function dogJokeRule(allowed: boolean): string {
  return allowed
    ? `You may work in one light dog joke.`
    : `Do NOT mention dogs, barking, bones, paws, tails or fetch in this line.`;
}

export interface VoiceOptions {
  /** Set explicitly in new code. Omission preserves the legacy dealer role. */
  role?: GadiRole;
  /** Where he is and what he is doing — "the dealer at a friendly home poker game". */
  setting: string;
  /** The job this time: length, shape, the beats to hit. */
  task: string[];
  /** Rules specific to this use that do not belong to every one. */
  extra?: string[];
  /** Force the dog joke on or off; omit to leave it to the ration. */
  dogJoke?: boolean;
  /** How often a joke is permitted when `dogJoke` is not given. */
  dogJokeRate?: number;
  /** Inject a seeded source for reproducible prompt construction. */
  random?: () => number;
  /**
   * Words from this speaker's recent lines, named so the model steers off
   * them. See `repetition.ts` — a model cannot see what it just wrote.
   */
  avoid?: string[];
}

/** The system prompt for one thing Gadi is being asked to say. */
export function gadiSystemPrompt({
  role = "dealer",
  setting,
  task,
  extra = [],
  dogJoke,
  dogJokeRate = DEFAULT_DOG_JOKE_RATE,
  random = Math.random,
  avoid = [],
}: VoiceOptions): string {
  if (!Number.isFinite(dogJokeRate) || dogJokeRate < 0 || dogJokeRate > 1) {
    throw new RangeError("dogJokeRate must be between 0 and 1");
  }
  if (!Object.hasOwn(GADI_ROLE_RULES, role)) throw new RangeError("Unknown Gadi role");
  const joke = dogJoke ?? (dogJokeRate === 1 || (dogJokeRate > 0 && random() < dogJokeRate));
  const steer = avoid.length ? [`Do not reuse these words from your recent lines: ${avoid.join(", ")}.`] : [];
  return [
    `You are Gadi, ${setting}.`,
    GADI_CHARACTER,
    ...task,
    ...SPEAKING_IN_THE_UNIVERSE,
    ...GADI_ROLE_RULES[role],
    ...extra,
    ...steer,
    dogJokeRule(joke),
  ].join(" ");
}

/**
 * One tidy line, however the model chose to format it. Strips the quotes and
 * asterisks models like to wrap speech in, and keeps only the first line.
 */
export function tidyLine(text: string, maxChars = 80): string | null {
  if (!Number.isInteger(maxChars) || maxChars < 1) throw new RangeError("maxChars must be a positive integer");
  const first = text.trim().split(/\r?\n/)[0];
  const clean = first.replace(/^[\s"'`*“”‘’]+|[\s"'`*“”‘’]+$/g, "").trim();
  const line = Array.from(clean).slice(0, maxChars).join("").trim();
  return line || null;
}
