/**
 * The one-line assertion every check script shares.
 *
 * Deliberately not a test framework. These run under `tsx` with no runner, no
 * config and no watch mode, so a check is just a file you can run — which is
 * what makes them cheap enough to actually write.
 */
let failures = 0;

export function check(label: string, actual: unknown, expected: unknown) {
  const pass = Object.is(actual, expected);
  if (!pass) failures++;
  console.log(`${pass ? "  ok  " : "  FAIL"}  ${label}${pass ? "" : `  got ${actual} want ${expected}`}`);
}

/** For a value that only has to land inside a range — simulations, mostly. */
export function checkNear(label: string, actual: number, expected: number, tolerance: number) {
  const pass = Math.abs(actual - expected) <= tolerance;
  if (!pass) failures++;
  console.log(
    `${pass ? "  ok  " : "  FAIL"}  ${label}${pass ? "" : `  got ${actual.toFixed(3)} want ${expected}±${tolerance}`}`
  );
}

export function checkTrue(label: string, actual: boolean) {
  check(label, actual, true);
}

/** Call at the end of every script. Exit 1 on failure, so run-all.sh sees it. */
export function done() {
  console.log();
  if (failures > 0) {
    console.log(`${failures} FAILED`);
    process.exit(1);
  }
  console.log("all passed");
  process.exit(0);
}

/**
 * Exit 3 means "declined to run for want of an environment". run-all.sh
 * reports that as SKIP and never as a pass — an unrun check mistaken for a
 * green one is the whole failure mode this suite exists to avoid.
 */
export function skip(reason: string, hint?: string) {
  console.log(`\nSKIP: ${reason}`);
  if (hint) console.log(`  ${hint}`);
  process.exit(3);
}
