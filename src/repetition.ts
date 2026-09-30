/** Bounded, session-scoped memory for text that was actually displayed. */
const STOPWORDS = new Set("a an and are as at but for from got had has have he her him his i if in is it its just like me my not of on one or our out s she so still t that the their them then there they this to up was we were what when with you your".split(" "));
export interface SpeakerMemoryOptions {
  linesRemembered?: number;
  maxWords?: number;
  maxSpeakers?: number;
}
export interface SpeakerMemory {
  wordsToAvoid(speakerId: string): string[];
  rememberWords(speakerId: string, line: string): void;
  /** Advances the cadence. Call once per intended displayed line, not retry. */
  dogJokeAllowed(speakerId: string, everyN?: number): boolean;
  clearSpeakerMemory(speakerId: string): void;
  clear(): void;
}
function positiveInteger(value: number, name: string): number {
  if (!Number.isInteger(value) || value < 1) throw new RangeError(`${name} must be a positive integer`);
  return value;
}
export function createSpeakerMemory({ linesRemembered = 4, maxWords = 18, maxSpeakers = 256 }: SpeakerMemoryOptions = {}): SpeakerMemory {
  positiveInteger(linesRemembered, "linesRemembered");
  positiveInteger(maxWords, "maxWords");
  positiveInteger(maxSpeakers, "maxSpeakers");
  const speakers = new Map<string, { lines: string[][]; count: number }>();
  const get = (id: string) => {
    const entry = speakers.get(id) ?? { lines: [], count: 0 };
    speakers.delete(id);
    speakers.set(id, entry);
    if (speakers.size > maxSpeakers) speakers.delete(speakers.keys().next().value!);
    return entry;
  };
  return {
    wordsToAvoid(id) {
      const entry = speakers.has(id) ? get(id) : undefined;
      return [...new Set(entry?.lines.flat() ?? [])].slice(0, maxWords);
    },
    rememberWords(id, line) {
      const words = line.toLowerCase().match(/[\p{L}\p{M}]+(?:'[\p{L}\p{M}]+)*/gu) ?? [];
      const content = [...new Set(words.filter((word) => Array.from(word).length > 2 && !STOPWORDS.has(word)))].slice(0, maxWords);
      const entry = get(id);
      entry.lines.unshift(content);
      entry.lines.length = Math.min(entry.lines.length, linesRemembered);
    },
    dogJokeAllowed(id, everyN = 6) {
      positiveInteger(everyN, "everyN");
      const entry = get(id);
      entry.count = (entry.count + 1) % Number.MAX_SAFE_INTEGER;
      return entry.count % everyN === 0;
    },
    clearSpeakerMemory(id) { speakers.delete(id); },
    clear() { speakers.clear(); },
  };
}
/** Compatibility helpers; new multi-room services should create one scope per room. */
const shared = createSpeakerMemory();
export const wordsToAvoid = shared.wordsToAvoid;
export const rememberWords = shared.rememberWords;
export const dogJokeAllowed = shared.dogJokeAllowed;
export const clearSpeakerMemory = shared.clearSpeakerMemory;
export const clearAllSpeakerMemory = shared.clear;
