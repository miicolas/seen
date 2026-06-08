// Fixed mood vocabulary for taste preferences. Tone/vibe descriptors kept
// deliberately orthogonal to genres (no "Funny"/"Scary" that just echo Comedy/
// Horror). The string doubles as the stored value and the (English) label.
export const MOODS = [
  "Feel-good",
  "Dark",
  "Mind-bending",
  "Tense",
  "Lighthearted",
  "Emotional",
  "Thought-provoking",
  "Cozy",
] as const;

export type Mood = (typeof MOODS)[number];

export function isKnownMood(value: string): value is Mood {
  return (MOODS as readonly string[]).includes(value);
}
