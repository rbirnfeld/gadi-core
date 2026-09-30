/**
 * The guard that throws out a review stating a figure it was never given.
 *
 * Two ways to get this wrong, and both are costly. Too loose and a fabricated
 * coin figure ships; too tight and accurate reviews are discarded for saying
 * "two pair". The threshold is the whole design, so it is checked from both
 * sides.
 */
import { GUARDED_FROM, inventsNumbers, numbersIn, unknownNumbersIn } from "../dist/numberGuard.js";
import assert from "node:assert/strict";
import { test } from "node:test";
const check = (label, actual, expected) => test(label, () => assert.equal(actual, expected));
const checkTrue = (label, actual) => check(label, actual, true);
const done = () => {};

const of = (text) => [...numbersIn(text)].sort((a, b) => a - b).join(",");

console.log("\ndigits");
check("plain", of("you lost 1288 chips"), "1288");
check("several", of("hand 8, pot 5152, down 1288"), "8,1288,5152");
check("a percentage", of("a 33% chance"), "33");

console.log("\nthousands separators are one number, not two");
// Without this, a model writing 2,382 looks like it invented 382 — and poker
// deals in thousands constantly, so this would fire on ordinary reviews.
check("2,382", of("finished down 2,382 chips"), "2382");
check("10,000", of("a stack of 10,000"), "10000");
check("4,456 and 1,204", of("the pot reached 4,456 from 1,204"), "1204,4456");
check("a comma that is not a separator still splits", of("hand 8, pot 90"), "8,90");

// A model reached for the typographic separator unprompted and had an
// accurate review discarded for it. None of these are visible on screen.
check("narrow no-break space", of("ending 8\u202f818 chips in the red"), "8818");
check("no-break space", of("a pot of 6\u00a0645"), "6645");
check("thin space", of("a stack of 10\u2009000"), "10000");
check("plain space", of("down 2 382 chips"), "2382");
check("swiss apostrophe", of("won 4\u2019456"), "4456");
check("but a space before a non-group still splits", of("hand 8 pot 90"), "8,90");

console.log("\nnumbers written as words");
check("nine", of("nine hands"), "9");
check("nineteen", of("nineteen hands"), "19");
check("seventy three is not seventy", of("seventy three chips"), "73");
check("and bare seventy still counts", of("seventy chips"), "70");
check("hyphenated", of("twenty-five chips"), "25");

console.log("\nwhat counts as invented");
{
  const facts = "Session: 9 hands, finishing down 2382 chips. Biggest pot won 300, biggest lost 1288.";
  checkTrue("restating a fact is fine", !inventsNumbers("You finished down 2,382 chips over nine hands.", facts));
  checkTrue("a figure never given is not", inventsNumbers("You finished down 2,500 chips.", facts));
  checkTrue("even when it looks plausible", inventsNumbers("Your biggest pot was 350.", facts));
  checkTrue("a formatted restatement passes", !inventsNumbers("The pot reached 1,288.", facts));
}

console.log("\nidiom below the threshold is left alone");
{
  const facts = "Session: 9 hands, finishing down 2382 chips.";
  checkTrue("two pair", !inventsNumbers("You called with two pair and lost.", facts));
  checkTrue("one of your calls", !inventsNumbers("One of your calls was a long shot.", facts));
  checkTrue("a couple of times", !inventsNumbers("That happened three times.", facts));
  check("the threshold itself", GUARDED_FROM, 10);
  checkTrue("but ten and up is challenged", inventsNumbers("You won 11 of them.", facts));
}

console.log("\nit reports which figures were invented");
{
  const allowed = numbersIn("9 hands, down 2382 chips");
  check("names the offender", unknownNumbersIn("You lost 4,000 chips over nine hands.", allowed).join(), "4000");
  check("and finds several", unknownNumbersIn("You lost 4000 across 25 hands.", allowed).sort((a, b) => a - b).join(), "25,4000");
  check("nothing to report when clean", unknownNumbersIn("You lost 2,382 chips.", allowed).length, 0);
}

done();
