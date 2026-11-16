// src/utils/dailyStats.js
import { supabase } from "../config.js";

const getTurkeyToday = () => {
  const now = new Date();
  const turkeyTime = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  return turkeyTime.toISOString().split('T')[0];
};

// Sayaçlar sunucuda atomik artırılır (bump_daily_stat) — istemci "oku-hesapla-yaz"
// yapmaz, hızlı cevaplarda sayı kaybolmaz.
export async function updateDailyStats(userId, type, isCorrect) {
  if (!userId) {
    console.error('❌ updateDailyStats: userId gereklidir!');
    return;
  }

  const { error } = await supabase.rpc('bump_daily_stat', {
    p_type: type,
    p_correct: isCorrect,
    p_date: getTurkeyToday(),
  });

  if (error) {
    console.error('❌ İstatistik güncelleme hatası:', error);
  }
}

export async function getTodayStats(userId) {
  if (!userId) {
    console.error('❌ getTodayStats: userId gereklidir!');
    return null;
  }

  const todayStr = getTurkeyToday();
  
  const { data, error } = await supabase
    .from('en_user_daily_stats')
    .select('*')
    .eq('user_id', userId)
    .eq('stat_date', todayStr)
    .maybeSingle();
  
  if (error) {
    console.error('❌ Bugün istatistik çekme hatası:', error);
    return null;
  }
  
  return data;
}

export async function getDailyStats(userId, days = 30) {
  if (!userId) {
    console.error('❌ getDailyStats: userId gereklidir!');
    return [];
  }

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
    console.error('❌ Günlük istatistik çekme hatası:', error);
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