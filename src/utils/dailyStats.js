// src/utils/dailyStats.js
import { supabase } from "../config.js";

const getTurkeyToday = () => {
  const now = new Date();
  const turkeyTime = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  return turkeyTime.toISOString().split('T')[0];
};

export async function updateDailyStats(userId, type, isCorrect) {
  if (!userId) {
    console.error('❌ updateDailyStats: userId gereklidir!');
    return;
  }

  const todayStr = getTurkeyToday();
  console.log(`📊 İstatistik güncelleniyor: userId=${userId}, type=${type}, isCorrect=${isCorrect}, date=${todayStr}`);
  
  try {
    // 1. Mevcut kaydı kontrol et
    const { data: existing, error: selectError } = await supabase
      .from('en_user_daily_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('stat_date', todayStr)
      .maybeSingle();

    if (selectError) {
      console.error('❌ Select hatası:', selectError);
      return;
    }

    console.log('📝 Mevcut kayıt:', existing);

    // 2. Güncel değerleri hesapla
    let wordCorrect = existing?.word_correct || 0;
    let wordWrong = existing?.word_wrong || 0;
    let sentenceCorrect = existing?.sentence_correct || 0;
    let sentenceWrong = existing?.sentence_wrong || 0;

    if (type === 'word') {
      if (isCorrect) {
        wordCorrect += 1;
      } else {
        wordWrong += 1;
      }
    } else if (type === 'sentence') {
      if (isCorrect) {
        sentenceCorrect += 1;
      } else {
        sentenceWrong += 1;
      }
    }

    const totalCorrect = wordCorrect + sentenceCorrect;
    const totalWrong = wordWrong + sentenceWrong;
    const totalAttempts = totalCorrect + totalWrong;
    const accuracy = totalAttempts > 0 ? parseFloat(((totalCorrect / totalAttempts) * 100).toFixed(2)) : 0;

    console.log('📊 Yeni değerler:', { wordCorrect, wordWrong, sentenceCorrect, sentenceWrong, totalCorrect, totalWrong, totalAttempts, accuracy });

    // 3. Upsert işlemi
    const { data, error } = await supabase
      .from('en_user_daily_stats')
      .upsert({
        user_id: userId,
        stat_date: todayStr,
        word_correct: wordCorrect,
        word_wrong: wordWrong,
        sentence_correct: sentenceCorrect,
        sentence_wrong: sentenceWrong,
        total_correct: totalCorrect,
        total_wrong: totalWrong,
        total_attempts: totalAttempts,
        accuracy: accuracy,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id, stat_date'
      })
      .select();

    if (error) {
      console.error('❌ Upsert hatası:', error);
      return;
    }

    console.log('✅ İstatistik güncellendi:', data);

  } catch (error) {
    console.error('❌ İstatistik hatası:', error);
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