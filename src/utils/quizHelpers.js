export function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

export function buildWordOptions(correct, allCards, count) {
  const others = allCards.filter(c => c.id !== correct.id).map(c => c.meaning);
  const wrong = shuffle(others).slice(0, count - 1);
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