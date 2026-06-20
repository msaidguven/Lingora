import { supabase } from "../config.js";

// ✅ Türkiye saatiyle bugünün tarihini döndürür (YYYY-MM-DD)
const getTurkeyToday = () => {
  const now = new Date();
  // Türkiye saati (UTC+3)
  const turkeyTime = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  return turkeyTime.toISOString().split('T')[0];
};

/**
 * Günlük istatistikleri güncelle
 * @param {string} userId - Kullanıcı ID'si
 * @param {string} type - 'word' veya 'sentence'
 * @param {boolean} isCorrect - Doğru mu?
 */
export async function updateDailyStats(userId, type, isCorrect) {
  if (!userId) {
    console.error('❌ updateDailyStats: userId gereklidir!');
    return;
  }

  // ✅ Türkiye saatiyle bugün
  const todayStr = getTurkeyToday();
  
  try {
    // 1. Mevcut kaydı kontrol et
    const { data: existing } = await supabase
      .from('en_user_daily_stats')
      .select('*')
      .eq('user_id', userId)
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
        user_id: userId,
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
 * @param {string} userId - Kullanıcı ID'si
 * @param {number} days - Kaç gün (varsayılan: 30)
 */
export async function getDailyStats(userId, days = 30) {
  if (!userId) {
    console.error('❌ getDailyStats: userId gereklidir!');
    return [];
  }

  // ✅ Türkiye saatiyle bugün
  const todayStr = getTurkeyToday();
  
  const startDate = new Date(todayStr);
  startDate.setDate(startDate.getDate() - days + 1);
  const startDateStr = startDate.toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('en_user_daily_stats')
    .select('*')
    .eq('user_id', userId)
    .gte('stat_date', startDateStr)
    .lte('stat_date', todayStr)
    .order('stat_date', { ascending: true });
  
  if (error) {
    console.error('İstatistik çekme hatası:', error);
    return [];
  }
  
  // Eksik günleri doldur
  const result = [];
  const currentDate = new Date(startDateStr);
  const endDate = new Date(todayStr);

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const existing = data?.find(d => d.stat_date === dateStr);
    
    if (existing) {
      result.push(existing);
    } else {
      result.push({
        stat_date: dateStr,
        total_correct: 0,
        total_wrong: 0,
        word_correct: 0,
        word_wrong: 0,
        sentence_correct: 0,
        sentence_wrong: 0,
        accuracy: 0,
      });
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return result;
}

/**
 * Bugünün istatistiklerini getir
 * @param {string} userId - Kullanıcı ID'si
 */
export async function getTodayStats(userId) {
  if (!userId) {
    console.error('❌ getTodayStats: userId gereklidir!');
    return null;
  }

  // ✅ Türkiye saatiyle bugün
  const todayStr = getTurkeyToday();
  
  const { data, error } = await supabase
    .from('en_user_daily_stats')
    .select('*')
    .eq('user_id', userId)
    .eq('stat_date', todayStr)
    .maybeSingle();
  
  if (error) {
    console.error('Bugün istatistik çekme hatası:', error);
    return null;
  }
  
  return data;
}