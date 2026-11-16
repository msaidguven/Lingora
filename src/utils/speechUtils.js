// utils/speechUtils.js
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { Capacitor } from '@capacitor/core';

// Platform kontrolü
const isNative = Capacitor.isNativePlatform();

let isSpeaking = false;
let activeTimers = [];

const clearWordTimers = () => {
  activeTimers.forEach(clearTimeout);
  activeTimers = [];
};

/**
 * Web için speech synthesis.
 * Tarayıcı gerçek "kelime sınırı" (word boundary) event'i verdiği için
 * kelime kelime highlight burada tam senkrondur.
 */
const speakWeb = (text, options = {}) => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('❌ Web speechSynthesis desteklenmiyor');
      options.onEnd?.();
      resolve(false);
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = options.language || 'en-US';
      utterance.rate = options.rate || 0.85;
      utterance.pitch = options.pitch || 1;
      utterance.volume = 1;

      // Ses seçimi
      const voices = window.speechSynthesis.getVoices();
      let voice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google'));
      if (!voice) voice = voices.find(v => v.lang.startsWith('en'));
      if (voice) utterance.voice = voice;

      utterance.onstart = () => {
        isSpeaking = true;
        options.onStart?.();
      };

      utterance.onend = () => {
        isSpeaking = false;
        options.onEnd?.();
        resolve(true);
      };

      utterance.onerror = (error) => {
        console.log('❌ Web speech hatası:', error);
        isSpeaking = false;
        options.onEnd?.();
        resolve(false);
      };

      if (options.onWordBoundary) {
        utterance.onboundary = (event) => {
          if (!event.name || event.name === 'word') {
            options.onWordBoundary(event.charIndex);
          }
        };
      }

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('❌ Web speak hatası:', error);
      isSpeaking = false;
      options.onEnd?.();
      resolve(false);
    }
  });
};

/**
 * @capacitor-community/text-to-speech (Android/iOS native motor) kelime sınırı
 * event'i VERMİYOR. Bu yüzden gerçek zamanlı senkron highlight native'de mümkün
 * değil. Bunun yerine metindeki kelimelerin uzunluğuna göre TAHMİNİ bir zamanlama
 * kurup, o zamanlamaya göre sırayla "aktif kelime" bildiriyoruz. Konuşma hızıyla
 * birebir eşleşmez ama görsel olarak yeterince yakın takip eder.
 */
const estimateWordTimings = (text, rate = 0.85) => {
  const regex = /[\w']+|[.,!?;:]/g;
  const words = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (/^[.,!?;:]$/.test(match[0])) continue; // noktalama işaretlerini atla
    words.push({ start: match.index, length: match[0].length });
  }
  if (words.length === 0) return [];

  // Kabaca: karakter başına ~65ms + kelime arası ~110ms duraklama (rate=1 baz alınarak).
  // rate arttıkça (konuşma hızlanınca) süreler orantılı olarak kısalır.
  const msPerChar = 65 / rate;
  const pauseMs = 110 / rate;

  let cumulative = 250; // ilk kelime başlamadan önce küçük bir başlangıç gecikmesi
  return words.map((w) => {
    const delay = cumulative;
    cumulative += w.length * msPerChar + pauseMs;
    return { start: w.start, delay };
  });
};

/**
 * Native (Android/iOS) için Capacitor TTS
 */
const speakNative = async (text, options = {}) => {
  try {
    console.log('🔊 Native TTS ile konuşuyor:', text);
    clearWordTimers();
    isSpeaking = true;
    options.onStart?.();

    if (options.onWordBoundary) {
      const timings = estimateWordTimings(text, options.rate || 0.85);
      timings.forEach(({ start, delay }) => {
        const id = setTimeout(() => {
          if (isSpeaking) options.onWordBoundary(start);
        }, delay);
        activeTimers.push(id);
      });
    }

    await TextToSpeech.speak({
      text: text,
      lang: options.language || 'en-US',
      rate: options.rate || 0.85,
      pitch: options.pitch || 1.0,
      volume: 1.0,
    });

    clearWordTimers();
    isSpeaking = false;
    options.onEnd?.();
    return true;
  } catch (error) {
    console.error('❌ Native TTS hatası:', error);
    clearWordTimers();
    isSpeaking = false;
    options.onEnd?.();
    return false;
  }
};

/**
 * Ana speak fonksiyonu - Platforma göre seçim yapar.
 * Her çağrıda önce mevcut konuşmayı kesin şekilde durdurur (hem web hem native),
 * böylece kart/hoparlöre art arda tıklanınca eski konuşma ANINDA kesilip
 * yeni cümle baştan başlar.
 */
export const speak = async (text, options = {}) => {
  console.log('🔊 speak çağrıldı:', text, 'Platform:', Capacitor.getPlatform());

  await stopSpeaking();

  if (isNative) {
    return await speakNative(text, options);
  } else {
    return await speakWeb(text, options);
  }
};

/**
 * Konuşmayı durdur
 */
export const stopSpeaking = async () => {
  clearWordTimers();
  if (isNative) {
    try {
      await TextToSpeech.stop();
    } catch (e) {
      console.log('❌ Native stop hatası:', e);
    }
  } else {
    try {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    } catch (e) {
      console.log('❌ Web stop hatası:', e);
    }
  }
  isSpeaking = false;
};

/**
 * Ses çalıyor mu?
 */
export const isSpeakingNow = () => {
  return isSpeaking;
};

/**
 * Test fonksiyonu
 */
export const testSpeech = async () => {
  console.log('🧪 Test speech başlıyor... Platform:', Capacitor.getPlatform());
  try {
    const result = await speak('Hello, this is a test', {
      onStart: () => console.log('✅ Test başladı'),
      onEnd: () => console.log('✅ Test bitti'),
      language: 'en-US',
      rate: 0.85
    });
    return result;
  } catch (error) {
    console.error('❌ Test hatası:', error);
    return false;
  }
};