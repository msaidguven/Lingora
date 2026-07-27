// utils/speechUtils.js

/**
 * Konuşma sentezi fonksiyonu - Capacitor (WebView) uyumlu
 * @param {string} text - Okunacak metin
 * @param {Object} options - Seçenekler
 * @param {Function} options.onWordBoundary - Kelime sınırında çağrılacak fonksiyon
 * @param {Function} options.onEnd - Konuşma bittiğinde çağrılacak fonksiyon
 * @param {string} options.language - Dil kodu (varsayılan: 'en-US')
 * @param {number} options.rate - Konuşma hızı (varsayılan: 0.85)
 * @param {number} options.pitch - Ses perdesi (varsayılan: 1)
 * @returns {SpeechSynthesisUtterance|null}
 */
export function speak(text, { 
  onWordBoundary, 
  onEnd, 
  language = 'en-US', 
  rate = 0.85,
  pitch = 1
} = {}) {
  
  // WebView'de speechSynthesis kontrolü
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.warn('Speech synthesis desteklenmiyor');
    onEnd?.();
    return null;
  }

  // Zaten çalan/bekleyen bir konuşma varsa iptal et
  try {
    window.speechSynthesis.cancel();
  } catch (e) {
    // ignore
  }

  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = language;
  utt.rate = rate;
  utt.pitch = pitch;

  // Android/iOS için uygun İngilizce sesi bul
  try {
    const voices = window.speechSynthesis.getVoices();
    
    // Önce İngilizce ve Google sesini tercih et (Android'de genelde Google TTS var)
    let engVoice = voices.find(v => 
      v.lang.startsWith("en") && 
      (v.name.includes("Google") || v.name.includes("Enhanced"))
    );
    
    // Yoksa herhangi bir İngilizce ses
    if (!engVoice) {
      engVoice = voices.find(v => v.lang.startsWith("en"));
    }
    
    if (engVoice) utt.voice = engVoice;
  } catch (e) {
    // Ses seçimi başarısız olursa default kullan
  }

  // Kelime sınırı olayı
  if (onWordBoundary) {
    utt.onboundary = (event) => {
      if (!event.name || event.name === "word") {
        onWordBoundary(event.charIndex);
      }
    };
  }

  // Bitiş olayları
  utt.onend = () => {
    onEnd?.();
  };
  utt.onerror = (error) => {
    console.log('Speech hatası:', error);
    onEnd?.();
  };

  try {
    window.speechSynthesis.speak(utt);
  } catch (error) {
    console.log('Speak hatası:', error);
    onEnd?.();
    return null;
  }
  
  return utt;
}

/**
 * Konuşmayı durdur
 */
export function stopSpeaking() {
  try {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  } catch (e) {
    // ignore
  }
}

/**
 * Sesin çalıp çalmadığını kontrol et
 */
export function isSpeaking() {
  try {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      return window.speechSynthesis.speaking;
    }
  } catch (e) {
    return false;
  }
  return false;
}