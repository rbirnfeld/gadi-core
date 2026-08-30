# @gadi/core

Gadi himself — the character, the rules that hold wherever he speaks, and the
guards that keep a model honest. Shared by every game in the Gadi Universe.

Gadi is a black French Bulldog who deals every game in the universe. Players
know him before they know the game, which is why he cannot be a string literal
beside each call site: in Gadi Poker he had already become two different
characters that way, "warm, quick-witted, a little smug" in one place and
"warm and direct" in another.

## What is in here

**The character.** `gadiSystemPrompt` composes who he is, the rules that hold
wherever he speaks, and whatever the job is this time. The character is
shared; the venue is not — a poker dealer and a blackjack dealer are the same
animal doing different jobs, so `setting` is passed in.

```ts
gadiSystemPrompt({
  setting: "the dealer at a friendly home poker game",
  task: ["Call ONE short line of live commentary, at most 12 words."],
});
```

`SPEAKING_AT_THE_TABLE` is exported separately for characters who are not Gadi
— a bot with its own persona is bound by the same rules about card codes and
invented figures, and a second copy of those is how one of them says "10D".

**The dog joke ration.** A model cannot see its own previous lines, so left
alone it makes the same joke every time. `gadiSystemPrompt` either permits one
or forbids it outright on each call; it is never left to the prompt to
self-moderate.

**`numberGuard`.** Instructing a model not to invent figures works most of the
time, and the failures are the expensive kind — a write-up confidently
reporting a number that is wrong reads exactly like one that is right.
`inventsNumbers(line, facts)` is the general form: discard any line stating a
figure it was never given.

Only ten and up is challenged. "two pair" and "one of your calls" are idiom
rather than claims, and guarding them throws away accurate write-ups to catch
nothing.

Thousands separators are collapsed first, and not only commas. A model wrote
`8 818` using U+202F, the narrow no-break space, and had an entirely accurate
review discarded for inventing 818. Nothing about that is visible on screen,
which is why every separator a model reaches for is handled and tested.

## Using it

```bash
npm install github:rbirnfeld/gadi-core
```

Installed straight from GitHub — no registry involved. The `prepare` script
builds it on install, so a consumer gets compiled output without this
repository carrying `dist/`.

## What does not belong here

Anything that knows about a specific game. This package has no dependencies
and no idea what a pot or a shoe is; it deals only in prompt text and the
guards around a model's output.

Conventions and procedures for *building* the games live in
[gadi-universe-knowledge](https://github.com/rbirnfeld/gadi-universe-knowledge),
which is a Claude Code plugin rather than a dependency.

## Checks

```bash
npm run check
```
