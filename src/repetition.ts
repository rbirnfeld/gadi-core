/**
 * Stopping Gadi from wearing out a phrase.
 *
 * A model has no memory of what it just wrote, so it finds a turn of phrase
 * it likes and repeats it. Measured in the casino: a run of twenty-one lines
 * used "grin" five times, "staring back" three times and "cozy spot" twice —
 * each line fine on its own, the set unmistakably canned. Naming the recent
 * words in the prompt took repeated content words from 48% to 35%.
 *
 * The dog joke is the same blind spot in a different costume, and is rationed
 * the same way: counted here, and either permitted or forbidden outright in
 * the prompt. Never left to the model to moderate itself.
 *
 * State is per speaker and in memory. Losing it costs one repeated word.
 */

/** Banning "the" would be useless and actively harmful to the writing. */
const STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "but", "for", "from", "got", "had",
  "has", "have", "he", "her", "him", "his", "i", "if", "in", "is", "it",
  "its", "just", "like", "me", "my", "not", "of", "on", "one", "or", "our",
  "out", "s", "she", "so", "still", "t", "that", "the", "their", "them",
  "then", "there", "they", "this", "to", "up", "was", "we", "were", "what",
  "when", "with", "you", "your",
]);

/**
 * Measured: a nine-word memory was too short — a word fell out of the window
 * and came straight back. Four lines' worth holds a streak long enough to
 * break it.
 */
const LINES_REMEMBERED = 4;
const MAX_REMEMBERED = 18;

const recentWords = new Map<string, string[]>();
const lineCounts = new Map<string, number>();

/** Distinctive words from this speaker's last few lines. */
export function wordsToAvoid(speakerId: string): string[] {
  return recentWords.get(speakerId) ?? [];
}

/** Call with every line actually shown, so the next prompt can avoid it. */
export function rememberWords(speakerId: string, line: string): void {
  const content = line
    .toLowerCase()
    .split(/[^a-z']+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));

  const previous = recentWords.get(speakerId) ?? [];
  // Newest first, so the oldest line's words fall off the end.
  const merged = [...content, ...previous].slice(0, MAX_REMEMBERED * LINES_REMEMBERED);
  recentWords.set(speakerId, [...new Set(merged)].slice(0, MAX_REMEMBERED));
}

/** True once every `everyN` lines from this speaker, and false otherwise. */
export function dogJokeAllowed(speakerId: string, everyN = 6): boolean {
  const n = (lineCounts.get(speakerId) ?? 0) + 1;
  lineCounts.set(speakerId, n);
  return n % everyN === 0;
}

export function clearSpeakerMemory(speakerId: string): void {
  recentWords.delete(speakerId);
  lineCounts.delete(speakerId);
}
