// German word & sentence banks used to build lesson texts on the fly.
// Words are filtered at runtime by which characters the learner has unlocked so far.

export const WORDS_SHORT = [
  'der', 'die', 'das', 'und', 'ist', 'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr',
  'ein', 'eine', 'zu', 'in', 'im', 'an', 'am', 'auf', 'aus', 'bei', 'mit', 'von',
  'für', 'um', 'so', 'ja', 'nein', 'gut', 'neu', 'alt', 'da', 'hier', 'dort',
  'wer', 'wie', 'was', 'wo', 'nun', 'nur', 'noch', 'auch', 'aber', 'oder', 'doch',
  'sehr', 'mehr', 'viel', 'kein', 'man', 'uns', 'euch', 'mir', 'dir', 'ihm', 'ihn',
  'tag', 'jahr', 'zeit', 'weg', 'ort', 'welt', 'kind', 'mann', 'frau', 'haus',
  'baum', 'hund', 'katze', 'auto', 'buch', 'ball', 'brot', 'apfel', 'wasser',
]

export const WORDS_MEDIUM = [
  'zusammen', 'heute', 'morgen', 'gestern', 'immer', 'niemals', 'vielleicht',
  'schnell', 'langsam', 'wichtig', 'richtig', 'falsch', 'einfach', 'schwierig',
  'freundlich', 'lustig', 'traurig', 'spannend', 'ruhig', 'laut', 'leise',
  'schule', 'arbeit', 'freizeit', 'familie', 'freund', 'freundin', 'kollege',
  'garten', 'küche', 'zimmer', 'fenster', 'tür', 'straße', 'stadt', 'land',
  'wetter', 'sonne', 'regen', 'schnee', 'wind', 'wolke', 'himmel', 'stern',
  'tastatur', 'computer', 'bildschirm', 'programm', 'internet', 'nachricht',
  'training', 'übung', 'lektion', 'sprache', 'buchstabe', 'wort', 'satz',
  'geschichte', 'zukunft', 'gedanke', 'gefühl', 'moment', 'beispiel', 'grund',
]

export const WORDS_LONG = [
  'geschwindigkeit', 'genauigkeit', 'konzentration', 'wiederholung',
  'tastaturschreiben', 'fingerfertigkeit', 'herausforderung', 'gewöhnung',
  'zusammenhang', 'entwicklung', 'verantwortung', 'aufmerksamkeit',
  'wahrscheinlichkeit', 'selbstständig', 'außergewöhnlich', 'unglaublich',
  'freundschaft', 'gemeinschaft', 'wissenschaft', 'gesellschaft', 'wirtschaft',
]

export const SENTENCES = [
  'Die Sonne scheint heute besonders hell.',
  'Übung macht den Meister, auch beim Tippen.',
  'Ich lerne jeden Tag ein bisschen mehr dazu.',
  'Zehn Finger sind schneller als zwei.',
  'Wer schnell tippt, spart am Ende viel Zeit.',
  'Die Katze schläft ruhig auf dem warmen Sofa.',
  'Morgen gehen wir gemeinsam in den Park spazieren.',
  'Ein kluger Kopf merkt sich die Tastenkombination sofort.',
  'Guter Kaffee schmeckt am Morgen besonders lecker.',
  'Die Kinder spielen fröhlich im großen Garten.',
  'Am Wochenende lesen wir gerne spannende Bücher.',
  'Ohne Fleiß kein Preis, das gilt auch hier.',
  'Der Zug fährt pünktlich um acht Uhr ab.',
  'Wir freuen uns schon auf den nächsten Urlaub.',
  'Ruhig bleiben und einfach weiter üben, dann klappt es!',
  'Diese Übung wird jeden Tag ein kleines bisschen leichter.',
  'Konzentriere dich auf die Tasten, nicht auf den Bildschirm.',
  'Ein starkes Team schafft mehr als ein Einzelner.',
  'Die Bibliothek öffnet heute schon um neun Uhr.',
  'Zwischen den Zeilen steckt oft die beste Idee.',
  'Fleißige Finger tippen ohne hinzuschauen.',
  'Heute ist ein wunderschöner Tag für neue Rekorde.',
  'Wer übt, wird jeden Tag ein Stückchen besser.',
  'Am Ende zählt nur, dass man niemals aufgibt.',
  'Kleine Schritte führen auch zu großen Zielen.',
]

export const NUMBER_SNIPPETS = [
  '123', '456', '789', '2024', '2025', '19', '84', '3,14', '100%', '0,5',
  '365', '24', '60', '90', '12', '2026', '1000', '7', '42', '88',
]

export const PUNCTUATION_SNIPPETS = [
  'Hallo, wie geht es dir?', 'Ja, genau!', 'Nein, das stimmt nicht.',
  'Warte kurz - ich komme gleich.', 'Er sagte: "Alles klar."',
  'Fertig? Los geht\'s!', 'Toll, das hat geklappt!', 'Bitte, danke, gerne.',
  'Wirklich? Das ist super!', 'Auf geht\'s - los jetzt!',
]

/** deterministic pseudo-random generator (mulberry32) so daily content is stable per seed */
export function mulberry32(seed: number) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function seedFromString(s: string): number {
  let h = 1779033703 ^ s.length
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return h >>> 0
}
