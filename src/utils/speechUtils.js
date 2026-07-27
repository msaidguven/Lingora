// utils/speechUtils.js

/**
 * Android WebView için optimize edilmiş speech synthesis
 */

let speechSynth = null;
let currentUtterance = null;
let isSpeaking = false;
let voiceList = [];

// Sesleri yükle
export const loadVoices = () => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve([]);
      return;
    }

    // Mevcut sesleri al
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      voiceList = voices;
      resolve(voices);
      return;
    }

    // Sesler yüklenene kadar bekle
    const onVoicesChanged = () => {
      const newVoices = window.speechSynthesis.getVoices();
      if (newVoices && newVoices.length > 0) {
        voiceList = newVoices;
        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
        resolve(newVoices);
      }
    };

    // Event listener ekle
    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);

    // 3 saniye timeout
    setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
      const finalVoices = window.speechSynthesis.getVoices();
      voiceList = finalVoices || [];
      resolve(voiceList);
    }, 3000);
  });
};

// İngilizce ses bul
const getEnglishVoice = () => {
  if (voiceList.length === 0) {
    // Sesler yüklenmemişse tekrar dene
    const voices = window.speechSynthesis?.getVoices() || [];
    voiceList = voices;
  }

  // Önce Google sesini dene
  let voice = voiceList.find(v => 
    v.lang.startsWith('en') && 
    (v.name.includes('Google') || v.name.includes('en-US') || v.name.includes('English United States'))
  );

  // Yoksa herhangi bir İngilizce ses
  if (!voice) {
    voice = voiceList.find(v => v.lang.startsWith('en'));
  }

  // Hiç İngilizce ses yoksa ilk sesi al
  if (!voice && voiceList.length > 0) {
    voice = voiceList[0];
  }

  return voice;
};

// Ana speak fonksiyonu
export const speak = (text, options = {}) => {
  console.log('🔊 speak çağrıldı:', text);
  
  return new Promise((resolve) => {
    // Web Speech API kontrolü
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('❌ speechSynthesis desteklenmiyor');
      options.onEnd?.();
      resolve(false);
      return;
    }

    try {
      // Önceki konuşmayı durdur
      window.speechSynthesis.cancel();

      // Utterance oluştur
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = options.language || 'en-US';
      utterance.rate = options.rate || 0.85;
      utterance.pitch = options.pitch || 1;
      utterance.volume = 1;

      // Ses seç
      const voice = getEnglishVoice();
      if (voice) {
        utterance.voice = voice;
        console.log('✅ Ses seçildi:', voice.name);
      } else {
        console.warn('⚠️ Uygun ses bulunamadı');
      }

      // Olaylar
      utterance.onstart = () => {
        console.log('🔊 Konuşma başladı');
        isSpeaking = true;
        options.onStart?.();
      };

      utterance.onend = () => {
        console.log('✅ Konuşma bitti');
        isSpeaking = false;
        options.onEnd?.();
        resolve(true);
      };

      utterance.onerror = (error) => {
        console.log('❌ Konuşma hatası:', error);
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

      // Konuşmayı başlat
      currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
      console.log('✅ Konuşma gönderildi');

    } catch (error) {
      console.error('❌ Speak hatası:', error);
      isSpeaking = false;
      options.onEnd?.();
      resolve(false);
    }
  });
};

// Konuşmayı durdur
export const stopSpeaking = () => {
  console.log('🔇 Konuşma durduruluyor...');
  try {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    isSpeaking = false;
    currentUtterance = null;
  } catch (e) {
    console.error('❌ Stop hatası:', e);
  }
};

// Ses çalıyor mu?
export const isSpeakingNow = () => {
  try {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      return window.speechSynthesis.speaking || isSpeaking;
    }
  } catch (e) {
    return false;
  }
  return isSpeaking;
};

// Test fonksiyonu
export const testSpeech = async () => {
  console.log('🧪 Test speech başlıyor...');
  
  // Önce sesleri yükle
  await loadVoices();
  
  return new Promise((resolve) => {
    speak('Hello, this is a test', {
      onStart: () => console.log('✅ Test başladı'),
      onEnd: () => {
        console.log('✅ Test bitti');
        resolve(true);
      }
    });
  });
};

// Sesleri getir
export const getVoices = () => {
  if (voiceList.length > 0) return voiceList;
  const voices = window.speechSynthesis?.getVoices() || [];
  voiceList = voices;
  return voices;
};