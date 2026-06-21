// DashboardScreen.jsx
import { useState, useEffect } from "react";
import { supabase } from "../../config.js";
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const getAccColor = (acc) => {
  if (acc >= 85) return "text-emerald-400 dark:text-emerald-400";
  if (acc >= 60) return "text-amber-400 dark:text-amber-400";
  if (acc > 0) return "text-rose-400 dark:text-rose-400";
  return "text-slate-500 dark:text-slate-500";
};

const getAccBg = (acc) => {
  if (acc >= 85) return "bg-emerald-500/10 dark:bg-emerald-500/10 border-emerald-500/20 dark:border-emerald-500/20";
  if (acc >= 60) return "bg-amber-500/10 dark:bg-amber-500/10 border-amber-500/20 dark:border-amber-500/20";
  if (acc > 0) return "bg-rose-500/10 dark:bg-rose-500/10 border-rose-500/20 dark:border-rose-500/20";
  return "bg-slate-500/10 dark:bg-slate-500/10 border-slate-500/20 dark:border-slate-500/20";
};

const getAccBadge = (acc) => {
  if (acc >= 85) return "bg-emerald-500/20 dark:bg-emerald-500/20 border-emerald-500/40 dark:border-emerald-500/40 text-emerald-300 dark:text-emerald-300";
  if (acc >= 60) return "bg-amber-500/20 dark:bg-amber-500/20 border-amber-500/40 dark:border-amber-500/40 text-amber-300 dark:text-amber-300";
  if (acc > 0) return "bg-rose-500/20 dark:bg-rose-500/20 border-rose-500/40 dark:border-rose-500/40 text-rose-300 dark:text-rose-300";
  return "bg-slate-500/20 dark:bg-slate-500/20 border-slate-500/40 dark:border-slate-500/40 text-slate-300 dark:text-slate-300";
};

const calcAcc = (correct, wrong) => {
  const total = (correct || 0) + (wrong || 0);
  return total > 0 ? Math.round(((correct || 0) / total) * 100) : 0;
};

const StatPill = ({ value, label, color, bg, border }) => (
  <div className={`flex-1 min-w-0 rounded-xl px-2 py-2.5 text-center ${bg} ${border} border`}>
    <div className={`text-base font-extrabold leading-none ${color}`}>{value}</div>
    <div className={`text-[10px] font-semibold mt-1.5 uppercase tracking-wider ${color} opacity-70`}>{label}</div>
  </div>
);

const MiniBadge = ({ icon, value, color, bg, border }) => (
  <span className={`inline-flex items-center gap-1 px-1.5 py-1 rounded-lg text-[10px] font-bold leading-tight ${bg} ${border} border ${color}`}>
    <span className="text-[9px]">{icon}</span>
    <span>{value}</span>
  </span>
);

const SurfaceCard = ({ accentColor = "indigo", children, className = "" }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <div className={`flex-1 min-w-0 rounded-2xl p-4 sm:p-5 border shadow-xl shadow-black/30 relative overflow-hidden transition-all duration-300 ${
      isDark 
        ? `bg-gradient-to-br from-${accentColor}-950/40 to-slate-900/40 border-white/5`
        : `bg-gradient-to-br from-${accentColor}-50/80 to-slate-50/80 border-slate-200/50 shadow-slate-200/30`
    } ${className}`}>
      <div className={`absolute left-0 top-3 bottom-3 w-1 bg-gradient-to-b from-${accentColor}-400 to-${accentColor}-400/40 rounded-r-full`} />
      <div className={`absolute -top-5 -right-5 w-20 h-20 rounded-full pointer-events-none ${
        isDark ? `bg-${accentColor}-400/5` : `bg-${accentColor}-400/10`
      }`} />
      <div className="relative pl-2.5">
        {children}
      </div>
    </div>
  );
};

export default function DashboardScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [loading, setLoading] = useState(true);
  const [todayStats, setTodayStats] = useState(null);
  const [last30Days, setLast30Days] = useState([]);
  const [summary, setSummary] = useState({
    totalCorrect: 0,
    totalWrong: 0,
    totalAttempts: 0,
    accuracy: 0,
    wordTotalCorrect: 0,
    wordTotalWrong: 0,
    wordAccuracy: 0,
    sentenceTotalCorrect: 0,
    sentenceTotalWrong: 0,
    sentenceAccuracy: 0,
  });

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const now = new Date();
      const turkeyNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);
      const todayStr = turkeyNow.toISOString().split('T')[0];

      const thirtyDaysAgo = new Date(turkeyNow);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

      const { data: todayData, error: todayError } = await supabase
        .from("en_user_daily_stats")
        .select("*")
        .eq("user_id", user.id)
        .eq("stat_date", todayStr)
        .maybeSingle();

      if (todayError) console.error("Bugün istatistikleri hatası:", todayError);
      setTodayStats(todayData || null);

      const { data: statsData, error: statsError } = await supabase
        .from("en_user_daily_stats")
        .select("*")
        .eq("user_id", user.id)
        .gte("stat_date", thirtyDaysAgoStr)
        .lte("stat_date", todayStr)
        .order("stat_date", { ascending: true });

      if (statsError) {
        console.error("Son 30 gün istatistikleri hatası:", statsError);
        setLast30Days([]);
      } else {
        setLast30Days(statsData || []);
      }

      let totalCorrect = 0, totalWrong = 0;
      let wordTotalCorrect = 0, wordTotalWrong = 0;
      let sentenceTotalCorrect = 0, sentenceTotalWrong = 0;

      (statsData || []).forEach(day => {
        totalCorrect += day.total_correct || 0;
        totalWrong += day.total_wrong || 0;
        wordTotalCorrect += day.word_correct || 0;
        wordTotalWrong += day.word_wrong || 0;
        sentenceTotalCorrect += day.sentence_correct || 0;
        sentenceTotalWrong += day.sentence_wrong || 0;
      });

      const totalAttempts = totalCorrect + totalWrong;
      const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
      const wordAccuracy = (wordTotalCorrect + wordTotalWrong) > 0
        ? Math.round((wordTotalCorrect / (wordTotalCorrect + wordTotalWrong)) * 100)
        : 0;
      const sentenceAccuracy = (sentenceTotalCorrect + sentenceTotalWrong) > 0
        ? Math.round((sentenceTotalCorrect / (sentenceTotalCorrect + sentenceTotalWrong)) * 100)
        : 0;

      setSummary({
        totalCorrect,
        totalWrong,
        totalAttempts,
        accuracy,
        wordTotalCorrect,
        wordTotalWrong,
        wordAccuracy,
        sentenceTotalCorrect,
        sentenceTotalWrong,
        sentenceAccuracy,
      });

    } catch (error) {
      console.error('Dashboard verisi çekme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  const getDayName = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', { weekday: 'short' });
  };

  const isToday = (dateStr) => {
    const now = new Date();
    const turkeyNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    const today = turkeyNow.toISOString().split('T')[0];
    return dateStr === today;
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center min-h-[70vh] font-sans transition-colors duration-300 ${
        isDark ? 'bg-slate-950' : 'bg-slate-50'
      }`}>
        <div className="flex flex-col items-center gap-4">
          <div className={`w-11 h-11 border-4 rounded-full animate-spin shadow-lg ${
            isDark 
              ? 'border-indigo-500/15 border-t-indigo-400 shadow-indigo-500/20'
              : 'border-indigo-300/30 border-t-indigo-500 shadow-indigo-200/50'
          }`} />
          <div className={`text-xs font-medium tracking-wider ${
            isDark ? 'text-slate-500' : 'text-slate-400'
          }`}>
            Veriler yükleniyor...
          </div>
        </div>
      </div>
    );
  }

  const todayWordAcc = todayStats ? calcAcc(todayStats.word_correct, todayStats.word_wrong) : 0;
  const todaySentenceAcc = todayStats ? calcAcc(todayStats.sentence_correct, todayStats.sentence_wrong) : 0;
  const todayTotalAcc = todayStats ? (todayStats.accuracy || calcAcc(todayStats.total_correct, todayStats.total_wrong)) : 0;

  const maxTotal = last30Days.length > 0 ? Math.max(...last30Days.map(d =>
    (d.word_correct || 0) + (d.word_wrong || 0) +
    (d.sentence_correct || 0) + (d.sentence_wrong || 0)
  ), 1) : 1;

  return (
    <div className={`min-h-screen font-sans p-4 sm:p-6 pb-12 transition-colors duration-300 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      <style>
        {`
          ::-webkit-scrollbar { width: 6px; height: 6px; }
          ::-webkit-scrollbar-thumb { 
            background: ${isDark ? '#1e1e38' : '#cbd5e1'}; 
            border-radius: 6px; 
          }
          ::-webkit-scrollbar-track {
            background: ${isDark ? 'transparent' : '#f1f5f9'};
          }
        `}
      </style>

      <div className="max-w-md mx-auto">
        {/* HEADER */}
        <div className="text-center mb-7">
          <div className={`text-[10px] tracking-[4px] font-bold uppercase opacity-70 mb-2 ${
            isDark ? 'text-indigo-400' : 'text-indigo-600'
          }`}>
            Çalışma İstatistikleri
          </div>
        </div>

        {/* BUGÜN */}
        <SurfaceCard accentColor="indigo" className="mb-3.5">
          <div className={`text-xs font-bold tracking-wider uppercase mb-3.5 ${
            isDark ? 'text-slate-500' : 'text-slate-400'
          }`}>
            📅 Bugün
          </div>

          {todayStats && ((todayStats.total_correct || 0) + (todayStats.total_wrong || 0) > 0) ? (
            <>
              <div className="grid grid-cols-4 gap-1.5 mb-2.5">
                <StatPill value={todayStats.word_correct || 0} label="Kel. Doğru" color="text-emerald-400 dark:text-emerald-400" bg="bg-emerald-500/10 dark:bg-emerald-500/10" border="border-emerald-500/20 dark:border-emerald-500/20" />
                <StatPill value={todayStats.word_wrong || 0} label="Kel. Yanlış" color="text-rose-400 dark:text-rose-400" bg="bg-rose-500/10 dark:bg-rose-500/10" border="border-rose-500/20 dark:border-rose-500/20" />
                <StatPill value={todayStats.sentence_correct || 0} label="Cüm. Doğru" color="text-emerald-400 dark:text-emerald-400" bg="bg-emerald-500/10 dark:bg-emerald-500/10" border="border-emerald-500/20 dark:border-emerald-500/20" />
                <StatPill value={todayStats.sentence_wrong || 0} label="Cüm. Yanlış" color="text-rose-400 dark:text-rose-400" bg="bg-rose-500/10 dark:bg-rose-500/10" border="border-rose-500/20 dark:border-rose-500/20" />
              </div>

              <div className={`flex items-center justify-between border-t pt-3 mt-1 ${
                isDark ? 'border-white/5' : 'border-slate-200/50'
              }`}>
                <span className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  📊 Toplam
                </span>
                <div className="flex gap-2 items-center">
                  <MiniBadge icon="✅" value={todayStats.total_correct || 0} color="text-emerald-300 dark:text-emerald-300" bg="bg-emerald-500/20 dark:bg-emerald-500/20" border="border-emerald-500/40 dark:border-emerald-500/40" />
                  <MiniBadge icon="❌" value={todayStats.total_wrong || 0} color="text-rose-300 dark:text-rose-300" bg="bg-rose-500/20 dark:bg-rose-500/20" border="border-rose-500/40 dark:border-rose-500/40" />
                  <span className={`text-base font-extrabold ${getAccColor(todayTotalAcc)}`}>
                    %{todayTotalAcc}
                  </span>
                </div>
              </div>

              <div className="mt-3">
                <div className={`w-full h-1 rounded-full overflow-hidden ${
                  isDark ? 'bg-white/5' : 'bg-slate-200'
                }`}>
                  <div
                    className={`h-full rounded-full transition-all duration-400 ${
                      todayTotalAcc >= 85 ? 'bg-emerald-400' :
                      todayTotalAcc >= 60 ? 'bg-amber-400' :
                      todayTotalAcc > 0 ? 'bg-rose-400' : 'bg-slate-400'
                    }`}
                    style={{ width: `${todayTotalAcc}%` }}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className={`text-center text-sm py-4 ${
              isDark ? 'text-slate-600' : 'text-slate-400'
            }`}>
              Bugün henüz çalışma yok 🌱
            </div>
          )}
        </SurfaceCard>

        {/* KELİME / CÜMLE ÖZETİ */}
        <div className="grid grid-cols-2 gap-3 mb-3.5">
          <SurfaceCard accentColor="indigo">
            <div className={`text-[11px] font-bold tracking-wider uppercase mb-2.5 ${
              isDark ? 'text-slate-500' : 'text-slate-400'
            }`}>
              📖 Kelime
            </div>
            <div className="flex items-baseline gap-1.5 mb-2.5">
              <span className={`text-2xl font-extrabold ${getAccColor(summary.wordAccuracy)}`}>
                %{summary.wordAccuracy}
              </span>
              <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                başarı
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <StatPill value={summary.wordTotalCorrect} label="Doğru" color="text-emerald-400 dark:text-emerald-400" bg="bg-emerald-500/10 dark:bg-emerald-500/10" border="border-emerald-500/20 dark:border-emerald-500/20" />
              <StatPill value={summary.wordTotalWrong} label="Yanlış" color="text-rose-400 dark:text-rose-400" bg="bg-rose-500/10 dark:bg-rose-500/10" border="border-rose-500/20 dark:border-rose-500/20" />
            </div>
          </SurfaceCard>

          <SurfaceCard accentColor="blue">
            <div className={`text-[11px] font-bold tracking-wider uppercase mb-2.5 ${
              isDark ? 'text-slate-500' : 'text-slate-400'
            }`}>
              📝 Cümle
            </div>
            <div className="flex items-baseline gap-1.5 mb-2.5">
              <span className={`text-2xl font-extrabold ${getAccColor(summary.sentenceAccuracy)}`}>
                %{summary.sentenceAccuracy}
              </span>
              <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                başarı
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <StatPill value={summary.sentenceTotalCorrect} label="Doğru" color="text-emerald-400 dark:text-emerald-400" bg="bg-emerald-500/10 dark:bg-emerald-500/10" border="border-emerald-500/20 dark:border-emerald-500/20" />
              <StatPill value={summary.sentenceTotalWrong} label="Yanlış" color="text-rose-400 dark:text-rose-400" bg="bg-rose-500/10 dark:bg-rose-500/10" border="border-rose-500/20 dark:border-rose-500/20" />
            </div>
          </SurfaceCard>
        </div>

        {/* SON 30 GÜN TABLOSU */}
        <SurfaceCard accentColor="indigo" className="mb-3.5">
          <div className="flex items-center justify-between mb-3">
            <div className={`text-xs font-bold tracking-wider uppercase ${
              isDark ? 'text-slate-500' : 'text-slate-400'
            }`}>
              📋 Son 30 Gün
            </div>
            <div className={`text-[11px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
              {last30Days.filter(d => (d.total_correct || 0) + (d.total_wrong || 0) > 0).length} gün çalışılmış
            </div>
          </div>

          {last30Days.length > 0 ? (
            <div className="max-h-[380px] overflow-y-auto flex flex-col gap-2">
              {last30Days.slice().reverse().map((day) => {
                const total = (day.total_correct || 0) + (day.total_wrong || 0);
                const today = isToday(day.stat_date);

                const wordTotal = (day.word_correct || 0) + (day.word_wrong || 0);
                const sentenceTotal = (day.sentence_correct || 0) + (day.sentence_wrong || 0);
                const wordAcc = calcAcc(day.word_correct, day.word_wrong);
                const sentenceAcc = calcAcc(day.sentence_correct, day.sentence_wrong);
                const totalAcc = total > 0 ? Math.round(((day.total_correct || 0) / total) * 100) : 0;

                return (
                  <div
                    key={day.stat_date}
                    className={`rounded-xl p-2.5 transition-all duration-300 ${
                      today 
                        ? isDark 
                          ? 'bg-indigo-500/10 border border-indigo-500/25' 
                          : 'bg-indigo-50/70 border border-indigo-200/50'
                        : isDark
                          ? 'bg-white/5 border border-white/5'
                          : 'bg-white/50 border border-slate-200/50'
                    }`}
                  >
                    <div className={`flex items-center justify-between ${total > 0 ? 'mb-1.5' : ''}`}>
                      <span className={`text-xs ${today ? 'font-bold text-indigo-300 dark:text-indigo-300' : `font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}`}>
                        {formatDate(day.stat_date)}
                        <span className={`text-[9px] ml-1.5 font-medium ${
                          isDark ? 'text-slate-500' : 'text-slate-400'
                        }`}>
                          {getDayName(day.stat_date)}
                        </span>
                        {today && <span className="text-[10px] ml-1">⭐</span>}
                      </span>
                      <span className={`text-sm font-extrabold ${getAccColor(totalAcc)}`}>
                        {total > 0 ? `%${totalAcc}` : <span className={`font-medium ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Veri yok</span>}
                      </span>
                    </div>

                    {total > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className={`flex items-center justify-between rounded-lg px-2 py-1.5 ${
                          isDark ? 'bg-white/5' : 'bg-slate-100/50'
                        }`}>
                          <span className={`text-[10px] font-semibold ${
                            isDark ? 'text-slate-500' : 'text-slate-400'
                          }`}>
                            Kelime
                          </span>
                          {wordTotal > 0 ? (
                            <span className="flex items-center gap-1">
                              <MiniBadge icon="✅" value={day.word_correct || 0} color="text-emerald-300 dark:text-emerald-300" bg="bg-emerald-500/20 dark:bg-emerald-500/20" border="border-emerald-500/40 dark:border-emerald-500/40" />
                              <MiniBadge icon="❌" value={day.word_wrong || 0} color="text-rose-300 dark:text-rose-300" bg="bg-rose-500/20 dark:bg-rose-500/20" border="border-rose-500/40 dark:border-rose-500/40" />
                              <span className={`text-[11px] font-bold ${getAccColor(wordAcc)}`}>
                                %{wordAcc}
                              </span>
                            </span>
                          ) : <span className={`text-[11px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>-</span>}
                        </div>

                        <div className={`flex items-center justify-between rounded-lg px-2 py-1.5 ${
                          isDark ? 'bg-white/5' : 'bg-slate-100/50'
                        }`}>
                          <span className={`text-[10px] font-semibold ${
                            isDark ? 'text-slate-500' : 'text-slate-400'
                          }`}>
                            Cümle
                          </span>
                          {sentenceTotal > 0 ? (
                            <span className="flex items-center gap-1">
                              <MiniBadge icon="✅" value={day.sentence_correct || 0} color="text-emerald-300 dark:text-emerald-300" bg="bg-emerald-500/20 dark:bg-emerald-500/20" border="border-emerald-500/40 dark:border-emerald-500/40" />
                              <MiniBadge icon="❌" value={day.sentence_wrong || 0} color="text-rose-300 dark:text-rose-300" bg="bg-rose-500/20 dark:bg-rose-500/20" border="border-rose-500/40 dark:border-rose-500/40" />
                              <span className={`text-[11px] font-bold ${getAccColor(sentenceAcc)}`}>
                                %{sentenceAcc}
                              </span>
                            </span>
                          ) : <span className={`text-[11px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>-</span>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={`text-center text-sm py-5 ${
              isDark ? 'text-slate-600' : 'text-slate-400'
            }`}>
              Henüz veri yok
            </div>
          )}
        </SurfaceCard>

        {/* GRAFİK */}
        <SurfaceCard accentColor="blue">
          <div className={`text-xs font-bold tracking-wider uppercase mb-3 ${
            isDark ? 'text-slate-500' : 'text-slate-400'
          }`}>
            📈 Günlük Çalışma Grafiği
          </div>

          <div className="flex gap-4 mb-3.5 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded shadow-lg ${
                isDark 
                  ? 'bg-indigo-400 shadow-indigo-500/50'
                  : 'bg-indigo-500 shadow-indigo-300/50'
              }`} />
              <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Kelime</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded shadow-lg ${
                isDark 
                  ? 'bg-blue-400 shadow-blue-500/50'
                  : 'bg-blue-500 shadow-blue-300/50'
              }`} />
              <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Cümle</span>
            </div>
          </div>

          {last30Days.length > 0 ? (
            <div>
              <div className="flex gap-1 items-end h-[84px]">
                {last30Days.slice(-30).map((day, index) => {
                  const wordTotal = (day.word_correct || 0) + (day.word_wrong || 0);
                  const sentenceTotal = (day.sentence_correct || 0) + (day.sentence_wrong || 0);
                  const today = isToday(day.stat_date);

                  return (
                    <div key={index} className="flex-1 flex flex-col items-center relative">
                      <div className={`w-full h-[70px] flex flex-col-reverse rounded overflow-hidden ${
                        isDark ? 'bg-white/5' : 'bg-slate-200/30'
                      }`}>
                        {sentenceTotal > 0 && (
                          <div
                            className={`transition-all duration-300 min-h-[2px] ${
                              today 
                                ? isDark ? 'bg-blue-300 shadow-lg shadow-blue-500/50' : 'bg-blue-400 shadow-lg shadow-blue-300/50'
                                : isDark ? 'bg-blue-400' : 'bg-blue-500'
                            }`}
                            style={{ height: `${(sentenceTotal / maxTotal) * 100}%` }}
                          />
                        )}
                        {wordTotal > 0 && (
                          <div
                            className={`transition-all duration-300 rounded-t min-h-[2px] ${
                              today 
                                ? isDark ? 'bg-indigo-300 shadow-lg shadow-indigo-500/50' : 'bg-indigo-400 shadow-lg shadow-indigo-300/50'
                                : isDark ? 'bg-indigo-400' : 'bg-indigo-500'
                            }`}
                            style={{ height: `${(wordTotal / maxTotal) * 100}%` }}
                          />
                        )}
                      </div>
                      <div className={`text-[7px] mt-1 ${
                        today 
                          ? isDark ? 'text-indigo-300 font-bold' : 'text-indigo-600 font-bold'
                          : isDark ? 'text-slate-600' : 'text-slate-400'
                      }`}>
                        {new Date(day.stat_date).getDate()}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className={`flex justify-between text-[9px] mt-2 ${
                isDark ? 'text-slate-600' : 'text-slate-400'
              }`}>
                <span>{new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString('tr-TR')}</span>
                <span className={isDark ? 'text-indigo-300' : 'text-indigo-600'}>⭐ Bugün</span>
              </div>
            </div>
          ) : (
            <div className={`text-center text-sm py-3 ${
              isDark ? 'text-slate-600' : 'text-slate-400'
            }`}>
              Henüz veri yok
            </div>
          )}
        </SurfaceCard>
      </div>
    </div>
  );
}