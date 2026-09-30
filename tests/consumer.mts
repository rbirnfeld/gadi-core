// Compile against the exported package declarations, like an existing Poker wrapper.
import { gadiSystemPrompt, type VoiceOptions, numbersIn, unknownNumbersIn,
  inventsNumbers, tidyLine, SPEAKING_AT_THE_TABLE, createSpeakerMemory,
  validateDialogue } from '@gadi/core';
function pokerVoice(options: Omit<VoiceOptions, 'setting'>): string {
  return gadiSystemPrompt({ setting: 'the dealer at a friendly home poker game', ...options });
}
pokerVoice({ task: ['One line.'] });
const allowed: Set<number> = numbersIn('25 chips');
const offenders: number[] = unknownNumbersIn('25', allowed);
const invented: boolean = inventsNumbers('25', '25');
const line: string | null = tidyLine('Hello', 90);
SPEAKING_AT_THE_TABLE.map(rule => rule.toUpperCase());
const memory = createSpeakerMemory();
const result = validateDialogue('Second!', { allowedNumbers: new Set([2]) });
if (result.ok) memory.rememberWords('gadi', result.line);
void [offenders, invented, line];
