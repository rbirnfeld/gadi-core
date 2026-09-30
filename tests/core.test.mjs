import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as core from '../dist/index.js';

test('racer, adventure and coaching roles do not inherit table restrictions', () => {
  for (const role of ['racer', 'adventurer', 'coach', 'narrator']) {
    const prompt = core.gadiSystemPrompt({ role, setting: 'in this game', task: ['One short line.'], dogJoke: false });
    assert.doesNotMatch(prompt, /gambl|dealer|card codes|never take sides/i);
    assert.match(prompt, /black French bulldog/);
  }
  const legacy = core.gadiSystemPrompt({ setting: 'at a poker table', task: [], dogJoke: false });
  assert.match(legacy, /neutral dealer/);
  assert.match(legacy, /unrevealed information/);
  assert.ok(core.SPEAKING_AT_THE_TABLE.some(rule => rule.includes('10D')));
});
test('explicit joke choice avoids RNG; seeded ration is repeatable', () => {
  const options = { role: 'racer', setting: 'on the grid', task: [], random: () => { throw new Error('must not sample'); } };
  assert.match(core.gadiSystemPrompt({ ...options, dogJoke: false }), /Do NOT mention dogs/);
  assert.match(core.gadiSystemPrompt({ ...options, dogJokeRate: 1 }), /one light dog joke/);
  assert.match(core.gadiSystemPrompt({ ...options, dogJokeRate: 0 }), /Do NOT mention dogs/);
  assert.match(core.gadiSystemPrompt({ ...options, random: () => 0.1 }), /one light dog joke/);
  assert.throws(() => core.gadiSystemPrompt({ ...options, dogJokeRate: NaN }), RangeError);
});
test('tidying strips whitespace before wrappers and preserves Unicode code points', () => {
  assert.equal(core.tidyLine('\n  “Clean corner!”  \r\nAnother line'), 'Clean corner!');
  assert.equal(core.tidyLine('  ***  '), null);
  assert.equal(core.tidyLine('🏁🏁x', 2), '🏁🏁');
  assert.throws(() => core.tidyLine('hello', -1), RangeError);
});
test('signed decimals and complete grouped values remain atomic', () => {
  assert.deepEqual([...core.numbersIn('−12.5, +30.25, .75, 1,234,567.89')], [-12.5, 30.25, .75, 1234567.89]);
  assert.ok(core.inventsNumbers('Lost -25.', 'Lost 25.'));
  assert.ok(core.inventsNumbers('Time 12.6', 'Time 12.5'));
  assert.equal(core.inventsNumbers('Time 12.50', 'Time 12.5'), false);
  assert.deepEqual([...core.numbersIn('two hundred and thirty-five; one thousand two hundred; negative twenty-five')], [235, 1200, -25]);
  assert.deepEqual([...core.numbersIn('constructor prototype toString')], []);
  assert.deepEqual([...core.numbersIn('one two twenty three')], [1, 2, 23]);
});
test('strict number screening covers racing ranks, medals, zero and small negatives', () => {
  assert.ok(core.inventsNumbers('Finished third with 2 medals.', 'Finished first with 1 medal.', { minimum: 0 }));
  assert.ok(core.inventsNumbers('0 laps', '1 lap', { minimum: 0 }));
  assert.ok(core.inventsNumbers('-0.5 seconds', '0.5 seconds', { minimum: 0 }));
  assert.equal(core.inventsNumbers('two pair', ''), false);
  assert.deepEqual(core.unknownNumbersIn('3rd', new Set(), { minimum: 0 }), [3]);
  assert.throws(() => core.inventsNumbers('x', 'x', { minimum: -1 }), RangeError);
});
test('dialogue rejects incomplete claims, oversized and multiple lines', () => {
  assert.deepEqual(core.validateDialogue('  “A clean second place!” ', { facts: 'place 2' }), { ok: true, line: 'A clean second place!' });
  assert.equal(core.validateDialogue('Won 3 medals.', { facts: 'Won 2 medals.' }).reason, 'unknown-numbers');
  assert.equal(core.validateDialogue('Great!\nYou won.').reason, 'multiline');
  assert.equal(core.validateDialogue('won 1000 points', { maxChars: 8 }).reason, 'too-long');
  assert.equal(core.validateDialogue('one more clean corner', { maxWords: 3 }).reason, 'too-many-words');
  assert.equal(core.validateDialogue(' *** ').reason, 'empty');
});
test('speaker memory isolates rooms and speakers, and returns defensive copies', () => {
  const a = core.createSpeakerMemory(); const b = core.createSpeakerMemory();
  a.rememberWords('gadi', 'Bright corners sparkle.');
  assert.deepEqual(b.wordsToAvoid('gadi'), []);
  assert.deepEqual(a.wordsToAvoid('rival'), []);
  a.wordsToAvoid('gadi').push('corrupt');
  assert.ok(!a.wordsToAvoid('gadi').includes('corrupt'));
  a.clear(); assert.deepEqual(a.wordsToAvoid('gadi'), []);
});
test('memory expires by actual displayed lines and bounds speaker count', () => {
  const memory = core.createSpeakerMemory({ linesRemembered: 2, maxSpeakers: 2 });
  memory.rememberWords('a', 'ancient'); memory.rememberWords('a', 'middle'); memory.rememberWords('a', 'newest');
  assert.deepEqual(memory.wordsToAvoid('a'), ['newest', 'middle']);
  memory.rememberWords('b', 'second'); memory.wordsToAvoid('a'); memory.rememberWords('c', 'third');
  assert.deepEqual(memory.wordsToAvoid('b'), []);
  assert.deepEqual(memory.wordsToAvoid('a'), ['newest', 'middle']);
  memory.rememberWords('c', 'פנייה נהדרת'); assert.ok(memory.wordsToAvoid('c').includes('נהדרת'));
});
test('joke cadence resets, stays per speaker and rejects invalid configuration', () => {
  const memory = core.createSpeakerMemory();
  assert.deepEqual(Array.from({ length: 6 }, () => memory.dogJokeAllowed('a')), [false, false, false, false, false, true]);
  assert.equal(memory.dogJokeAllowed('b'), false);
  memory.clearSpeakerMemory('a'); assert.equal(memory.dogJokeAllowed('a'), false);
  assert.throws(() => memory.dogJokeAllowed('a', 0), RangeError);
  assert.throws(() => core.createSpeakerMemory({ maxSpeakers: Infinity }), RangeError);
});
