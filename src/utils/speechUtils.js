export function speak(text, { onWordBoundary, onEnd } = {}) {
  if (!window.speechSynthesis) return;

  // Zaten çalan/bekleyen bir konuşma varsa önce onu iptal et,
  // böylece yeni tıklama anında öncekini keser ve hemen yeniden başlar.
  window.speechSynthesis.cancel();

  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = "en-US";
  utt.rate = 0.85;

  const voices = window.speechSynthesis.getVoices();
  const eng = voices.find(v => v.lang.startsWith("en") && v.localService);
  if (eng) utt.voice = eng;

  if (onWordBoundary) {
    utt.onboundary = (event) => {
      // Bazı tarayıcılar 'word' dışında başka boundary tipleri de gönderebilir,
      // sadece kelime sınırlarını dinliyoruz (event.name tanımsızsa yine kelime kabul ediyoruz).
      if (!event.name || event.name === "word") {
        onWordBoundary(event.charIndex);
      }
    };
  }

  utt.onend = () => onEnd?.();
  utt.onerror = () => onEnd?.();

  window.speechSynthesis.speak(utt);
  return utt;
}