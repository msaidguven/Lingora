// utils/speechUtils.js
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { Capacitor } from '@capacitor/core';

// Platform kontrolü
const isNative = Capacitor.isNativePlatform();
const isAndroid = Capacitor.getPlatform() === 'android';
const isWeb = !isNative;

let isSpeaking = false;

/**
 * Web için speech synthesis
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
 * Native (Android/iOS) için Capacitor TTS
 */
const speakNative = async (text, options = {}) => {
  try {
    console.log('🔊 Native TTS ile konuşuyor:', text);
    
    isSpeaking = true;
    options.onStart?.();

    await TextToSpeech.speak({
      text: text,
      lang: options.language || 'en-US',
      rate: options.rate || 0.85,
      pitch: options.pitch || 1.0,
      volume: 1.0,
    });

    isSpeaking = false;
    options.onEnd?.();
    return true;
  } catch (error) {
    console.error('❌ Native TTS hatası:', error);
    isSpeaking = false;
    options.onEnd?.();
    return false;
  }
};

/**
 * Ana speak fonksiyonu - Platforma göre seçim yapar
 */
export const speak = async (text, options = {}) => {
  console.log('🔊 speak çağrıldı:', text, 'Platform:', Capacitor.getPlatform());
  
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
  console.log('🔇 Konuşma durduruluyor...');
  
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