export function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

export function buildWordOptions(correct, allCards, count) {
  const others = allCards.filter(c => c.id !== correct.id).map(c => c.meaning);
  const wrong = shuffle(others).slice(0, count - 1);
  return shuffle([correct.meaning, ...wrong]);
}

export function buildSentenceOptions(correctSentence, allSentences, currentWordId, count) {
  const sameWordSentences = allSentences.filter(s => s.word_id === currentWordId && s.id !== correctSentence.id);
  const sameWordMeanings = sameWordSentences.map(s => s.sentence_tr).filter(Boolean);
  let wrong = [...sameWordMeanings];
  if (wrong.length < count - 1) {
    const otherSentences = allSentences.filter(s => s.word_id !== currentWordId && s.sentence_tr);
    const otherMeanings = shuffle(otherSentences.map(s => s.sentence_tr));
    wrong = [...wrong, ...otherMeanings].slice(0, count - 1);
  } else {
    wrong = shuffle(wrong).slice(0, count - 1);
  }
  return shuffle([correctSentence.sentence_tr, ...wrong]);
}