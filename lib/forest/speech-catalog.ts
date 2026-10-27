import { words } from './content';
import { tales, trainRounds } from './adventures';
import { soccerChallenges } from './soccer-content';

import { normalizeSpeech } from './speech-text';

export const speechTexts = [
  ...new Set(
    [
      'May I sit here?',
      'Hello. May I sit here, please?',
      ...words.flatMap((w) => [
        w.name,
        ...w.sentences,
        ...w.alternate,
        ...w.story.pages,
        ...w.glossary.map((g) => g.term),
      ]),
      ...tales.flatMap((t) => t.pages.flatMap((p) => [p.english, p.vocabulary.english])),
      ...trainRounds.map((r) => r.english),
      ...soccerChallenges.map((r) => r.answer),
    ].map(normalizeSpeech),
  ),
].sort();
