export function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// wordPool: yanlış şıkların çekileceği havuz (session kuyruğu DEĞİL,
// aynı seviyedeki geniş bir kelime havuzu - bkz. useWordQuiz.js -> distractorPool)
export function buildWordOptions(correct, wordPool, count) {
  // Doğru cevabın kendisini havuzdan çıkar, anlamı olmayanları ele
  const candidates = wordPool.filter(
    w => w.id !== correct.id && w.meaning
  );

  // Aynı anlama sahip kelimeleri tekilleştir (aynı şık iki kez çıkmasın)
  const seenMeanings = new Set([correct.meaning]);
  const uniqueCandidates = [];
  for (const w of shuffle(candidates)) {
    if (!seenMeanings.has(w.meaning)) {
      seenMeanings.add(w.meaning);
      uniqueCandidates.push(w);
    }
  }

  const wrong = uniqueCandidates.slice(0, count - 1).map(w => w.meaning);
  return shuffle([correct.meaning, ...wrong]);
}

// allSentences: yanlış şıkların çekileceği havuz (session kuyruğu DEĞİL,
// aynı seviyedeki tüm onaylı cümleler - bkz. useSentenceQuiz.js -> distractorPool)
export function buildSentenceOptions(correctSentence, allSentences, count) {
  // Doğru cevabın kendisini havuzdan çıkar, metni olmayanları ele
  const candidates = allSentences.filter(
    s => s.id !== correctSentence.id && s.sentence_tr
  );

  // Aynı Türkçe metne sahip cümleleri tekilleştir (aynı şık iki kez çıkmasın)
  const seenTexts = new Set([correctSentence.sentence_tr]);
  const uniqueCandidates = [];
  for (const s of shuffle(candidates)) {
    if (!seenTexts.has(s.sentence_tr)) {
      seenTexts.add(s.sentence_tr);
      uniqueCandidates.push(s);
    }
  }

  const wrong = uniqueCandidates.slice(0, count - 1).map(s => s.sentence_tr);
  return shuffle([correctSentence.sentence_tr, ...wrong]);
}