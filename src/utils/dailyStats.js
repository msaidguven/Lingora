import { supabase } from "../config.js";

const FIXED_USER_ID = "302a3b6b-c1e9-49c4-98fe-52115bd7d204";

/**
 * Günlük istatistikleri güncelle
 * @param {string} type - 'word' veya 'sentence'
 * @param {boolean} isCorrect - Doğru mu?
 */
export async function updateDailyStats(type, isCorrect) {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0]; // '2024-01-15'
  
  try {
    // 1. Mevcut kaydı kontrol et
    const { data: existing } = await supabase
      .from('en_user_daily_stats')
      .select('*')
      .eq('user_id', FIXED_USER_ID)
      .eq('stat_date', todayStr)
      .maybeSingle();
    
    // 2. Güncel değerleri hesapla
    let updates = {};
    
    if (type === 'word') {
      if (isCorrect) {
        updates.word_correct = (existing?.word_correct || 0) + 1;
      } else {
        updates.word_wrong = (existing?.word_wrong || 0) + 1;
      }
    } else if (type === 'sentence') {
      if (isCorrect) {
        updates.sentence_correct = (existing?.sentence_correct || 0) + 1;
      } else {
        updates.sentence_wrong = (existing?.sentence_wrong || 0) + 1;
      }
    }
    
    // 3. Toplam hesaplamalar
    const wordCorrect = existing?.word_correct || 0;
    const wordWrong = existing?.word_wrong || 0;
    const sentenceCorrect = existing?.sentence_correct || 0;
    const sentenceWrong = existing?.sentence_wrong || 0;
    
    const totalCorrect = wordCorrect + sentenceCorrect + (updates.word_correct ? 1 : 0) + (updates.sentence_correct ? 1 : 0);
    const totalWrong = wordWrong + sentenceWrong + (updates.word_wrong ? 1 : 0) + (updates.sentence_wrong ? 1 : 0);
    const totalAttempts = totalCorrect + totalWrong;
    const accuracy = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0;
    
    // 4. Kaydet veya güncelle
    const { error } = await supabase
      .from('en_user_daily_stats')
      .upsert({
        user_id: FIXED_USER_ID,
        stat_date: todayStr,
        ...updates,
        total_correct: totalCorrect,
        total_wrong: totalWrong,
        total_attempts: totalAttempts,
        accuracy: parseFloat(accuracy.toFixed(2)),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id, stat_date'
      });
    
    if (error) {
      console.error('Günlük istatistik güncelleme hatası:', error);
    }
    
  } catch (error) {
    console.error('Günlük istatistik hatası:', error);
  }
}

/**
 * Son X günün istatistiklerini getir
 */
export async function getDailyStats(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);
  
  const { data, error } = await supabase
    .from('en_user_daily_stats')
    .select('*')
    .eq('user_id', FIXED_USER_ID)
    .gte('stat_date', startDate.toISOString().split('T')[0])
    .order('stat_date', { ascending: true });
  
  if (error) {
    console.error('İstatistik çekme hatası:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Bugünün istatistiklerini getir
 */
export async function getTodayStats() {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('en_user_daily_stats')
    .select('*')
    .eq('user_id', FIXED_USER_ID)
    .eq('stat_date', todayStr)
    .maybeSingle();
  
  if (error) {
    console.error('Bugün istatistik çekme hatası:', error);
    return null;
  }
  
  return data;
}