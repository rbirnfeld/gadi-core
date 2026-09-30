# @gadi/core

Shared identity and optional dialogue utilities for Gadi Universe. Gadi is a
black French bulldog: warm, quick-witted, playful, never cruel. His role belongs
to the game: playable racer, adventurer, dealer, or coach explaining computed
facts. There is no universal gambling persona.

This dependency-free TypeScript/ESM package composes prompts, screens numeric
claims, validates short dialogue and bounds repetition memory. It does not run
a game, call a provider, decide rewards, store progress or verify truth.
Engineering knowledge and game maps live in
[gadi-universe-knowledge](https://github.com/rbirnfeld/gadi-universe-knowledge).

## Install and check

```sh
npm install github:rbirnfeld/gadi-core
npm run check
```

The first command is for consumers; the second runs in this repository. Git
installation builds `dist/` through `prepare`. Pin a reviewed commit in a
consumer's dependency and lockfile for a reproducible release. Source edits do
not update installed copies. Node 20+ is supported; the package uses ESM.
`npm run check` builds and runs Node's built-in test runner with no network or
unlisted `npx` dependency. `npm pack` also runs the checks.

## Role-aware prompts

```ts
import { gadiSystemPrompt, createSpeakerMemory } from '@gadi/core';

const memory = createSpeakerMemory(); // one scope per room/session
const prompt = gadiSystemPrompt({
  role: 'racer',
  setting: 'on the starting grid in Gadi Racers',
  task: ['Say one situational line, at most twelve words.'],
  dogJoke: memory.dogJokeAllowed('gadi'),
  avoid: memory.wordsToAvoid('gadi'),
});
```

Use `dealer`, `racer`, `adventurer`, `coach`, or `narrator` explicitly in new
code. **Omitting `role` retains the legacy dealer rules** so current Poker
wrappers remain safe. `coach` may explain supplied computed advice; it does not
calculate strategy. `SPEAKING_IN_THE_UNIVERSE` contains the shared voice rules;
`SPEAKING_AT_THE_TABLE` remains available for existing poker bots.

`task` controls length and output shape; long reviews are not forced into a
12-word character line. `extra` carries trusted game rules. Never interpolate
player-authored instructions into these fields. Pass filtered event data in a
separate provider message, excluding hidden cards and secrets.

`dogJoke` overrides the ration. Otherwise `dogJokeRate` defaults to 0.25, and
`random` can inject a seeded RNG. A cadence advances on each call: reserve the
choice once and reuse it during retries. Only call `rememberWords` after text
is actually displayed. Dispose the memory with `clear()` when the room ends.

## Validate speech before displaying it

```ts
import { validateDialogue } from '@gadi/core';

const result = validateDialogue('A clean second place!', {
  allowedNumbers: new Set([2]), // event-specific, computed by the game
});
const line = result.ok ? result.line : 'Ready for another round?';
// Display line, then memory.rememberWords('gadi', line).
```

`validateDialogue` defaults to 100 Unicode code points, 12 whitespace-separated
words, one line, and numeric screening from zero. It returns a discriminated
result with `empty`, `multiline`, `too-long`, `too-many-words`, or
`unknown-numbers`; it never truncates a claim. Supply `facts` as text or prefer
`allowedNumbers` for a deliberately narrow event. No numbers are allowed by
default. Word segmentation is intended for space-delimited dialogue.

`tidyLine(text, maxChars = 80)` remains the compatibility formatting helper:
it strips wrappers, keeps the first nonblank line and truncates by code point.
Use the validator when truncation could change meaning.

## Numeric screening and its limits

`numbersIn(text)` returns a set of signed values; `unknownNumbersIn(line, set,
options)` reports unsupported values; `inventsNumbers(line, facts, options)`
returns a boolean. The legacy default `minimum: 10` tolerates poker idioms such
as “two pair”. Racing ranks, medals, lap counts and small deltas need
`{ minimum: 0 }`. Thresholds use absolute magnitude, including negatives.

Supported: signed decimal digits, decimal point `.`, grouped thousands using
commas/spaces/apostrophes, numeric ordinals, English cardinal phrases through
billions, and first–twelfth. This is not a locale parser: decimal commas,
scientific notation, fractions, times such as `1:23`, arbitrary compound
ordinals and number words in other languages are outside its contract.

A matching number does **not** prove the correct player, unit, action, result,
or relationship. “Lost 20” and “won 20” contain the same value. For decisive
UI, localize deterministic templates from typed game facts. Optional model
text needs a bounded deadline, stale-event cancellation, and a local fallback.
The parser is an additional screen, never an authority or security boundary.

## Memory API

`createSpeakerMemory({ linesRemembered: 4, maxWords: 18, maxSpeakers: 256 })`
returns `wordsToAvoid`, `rememberWords`, `dogJokeAllowed`,
`clearSpeakerMemory`, and `clear`. It retains actual line windows, returns
copies, and evicts the least recently used speaker at the cap. Unicode letter
words are retained; the stopword list is English. Top-level legacy memory
functions still work, including the new `clearAllSpeakerMemory`, but share a
bounded process-wide scope.

## Native games and migration

Godot/GDScript cannot import an npm package directly. Racers currently uses
local rules and authored text; no AI service or JavaScript bridge is needed.
Share the identity and design principles through the knowledge plugin, and
keep actual racing rules in GDScript. Do not add a network dependency merely
to use this package.

See [0.2 migration and compatibility](docs/migration-0.2.md) for existing users.
