# 0.1 → 0.2

All original exports and call signatures remain available. This is a source
upgrade, not a deployment or consumer dependency update.

| Area | Behavior and adoption |
| --- | --- |
| Identity | Shared character no longer implies gambling or smugness. |
| Existing Poker wrapper | Omitted `role` still selects neutral dealer rules. Add `role: 'dealer'` when updating the wrapper. |
| New roles | Racers uses `racer`; Adventures uses `adventurer`; computed advice uses `coach`. No table rules leak into those prompts. |
| Reviews | `task` still defines length. Do not run long reviews through the short-dialogue defaults. |
| Numeric parsing | Signs and decimals are preserved, and English hundreds/scales and common ordinals are recognized. `-25` and `25` differ now. Recheck review fixtures that mix signed facts with “lost 25” phrasing. |
| Threshold | Legacy helpers still default to 10, now by absolute value. Strict speech defaults to zero. |
| Repetition | Existing wrappers remain, but four actual lines expire and speaker count is bounded. Use scoped factories to prevent cross-room interference. |
| Formatting | Leading blank lines/wrapper whitespace are cleaned; Unicode code points are not split. Invalid length limits, joke rates and cadence values now throw `RangeError`. |
| Tooling | `npm run check` builds before testing compiled exports. No implicit download of tsx. |

Repository audit on 2026-09-30 found Poker importing prompt, table, formatting
and number helpers. Casino delegates numeric extraction to core but keeps
local review filtering. Adventures declares core in its server dependencies;
that does not establish active use by the runner. Racers is native GDScript
and has no direct npm-core integration.

After publishing an authorized revision, update each consumer's lockfile,
compile its wrapper, and run its review/number fixtures. Existing consumers
remain on their installed version until updated; none were edited here.

Use facts in the form narration should express: for “lost 25 chips”, supply a
code-computed positive magnitude plus a separate loss direction, not only
`net: -25`. A number match still cannot check that direction. Use templates
where a wrong direction would mislead the player.
