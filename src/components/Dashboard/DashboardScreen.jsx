import { useState, useEffect } from "react";
import { getDailyStats, getTodayStats } from "../../utils/dailyStats.js";

// ── Yardımcılar ──────────────────────────────────────────────

const getAccColor = (acc) => {
  if (acc >= 85) return "#10b981";
  if (acc >= 60) return "#f59e0b";
  if (acc > 0) return "#ef4444";
  return "#64748b";
};

const getAccTones = (acc) => {
  const color = getAccColor(acc);
  if (acc >= 85) return { color, bg: "rgba(16,185,129,0.07)", border: "rgba(16,185,129,0.12)" };
  if (acc >= 60) return { color, bg: "rgba(245,158,11,0.07)", border: "rgba(245,158,11,0.12)" };
  if (acc > 0) return { color, bg: "rgba(239,68,68,0.07)", border: "rgba(239,68,68,0.12)" };
  return { color, bg: "rgba(100,116,139,0.07)", border: "rgba(100,116,139,0.12)" };
};

const calcAcc = (correct, wrong) => {
  const total = (correct || 0) + (wrong || 0);
  return total > 0 ? Math.round(((correct || 0) / total) * 100) : 0;
};

// Stats sayfasındaki 4'lü stat pili (Doğru / Yanlış / Başarı / Tekrar) ile aynı görsel dil
const StatPill = ({ value, label, color, bg, border }) => (
  <div style={{
    flex: 1,
    minWidth: 0,
    background: bg,
    border: `1px solid ${border}`,
    borderRadius: 10,
    padding: "8px 4px",
    textAlign: "center"
  }}>
    <div style={{ fontSize: 16, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 9, color: `${color}70`, fontWeight: 600, marginTop: 4, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</div>
  </div>
);

// Küçük, satır-içi kullanım için renkli çerçeveli mini rozet (Son 30 Gün listesinde)
const MiniBadge = ({ icon, value, color, bg, border }) => (
  <span style={{
    display: "inline-flex",
    alignItems: "center",
    gap: 3,
    padding: "2px 6px",
    borderRadius: 7,
    background: bg,
    border: `1px solid ${border}`,
    fontSize: 10,
    fontWeight: 700,
    color,
    lineHeight: 1.4
  }}>
    <span style={{ fontSize: 9 }}>{icon}</span>
    <span>{value}</span>
  </span>
);

// Stats kartlarındaki dış kabuk: gradient yüzey + sol accent çizgisi + sağ üst ambient ışık
const SurfaceCard = ({ accentColor = "#6366f1", children, style }) => (
  <div style={{
    flex: 1,
    minWidth: 0,
    background: "linear-gradient(160deg, #14142a 0%, #111126 100%)",
    borderRadius: 18,
    padding: "18px 20px",
    border: "1px solid rgba(255,255,255,0.05)",
    boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
    position: "relative",
    overflow: "hidden",
    ...style
  }}>
    <div style={{
      position: "absolute",
      left: 0, top: 12, bottom: 12,
      width: 3,
      background: `linear-gradient(180deg, ${accentColor}, ${accentColor}55)`,
      borderRadius: "0 3px 3px 0",
    }} />
    <div style={{
      position: "absolute",
      top: -20, right: -20,
      width: 80, height: 80,
      borderRadius: "50%",
      background: `radial-gradient(circle, ${accentColor}12 0%, transparent 70%)`,
      pointerEvents: "none"
    }} />
    <div style={{ paddingLeft: 10, position: "relative" }}>
      {children}
    </div>
  </div>
);

export default function DashboardScreen() {
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
    bestDay: null,
    worstDay: null
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);

    try {
      const today = await getTodayStats();
      setTodayStats(today);

      const stats = await getDailyStats(30);
      setLast30Days(stats);

      let totalCorrect = 0, totalWrong = 0;
      let wordTotalCorrect = 0, wordTotalWrong = 0;
      let sentenceTotalCorrect = 0, sentenceTotalWrong = 0;
      let bestDay = null, worstDay = null;

      stats.forEach(day => {
        totalCorrect += day.total_correct || 0;
        totalWrong += day.total_wrong || 0;
        wordTotalCorrect += day.word_correct || 0;
        wordTotalWrong += day.word_wrong || 0;
        sentenceTotalCorrect += day.sentence_correct || 0;
        sentenceTotalWrong += day.sentence_wrong || 0;

        const total = (day.total_correct || 0) + (day.total_wrong || 0);
        if (total > 0) {
          if (!bestDay || total > ((bestDay.total_correct || 0) + (bestDay.total_wrong || 0))) {
            bestDay = day;
          }
          if (!worstDay || total < ((worstDay.total_correct || 0) + (worstDay.total_wrong || 0))) {
            worstDay = day;
          }
        }
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
        bestDay,
        worstDay
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
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "70vh", background: "#0a0a18", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 44, height: 44,
            border: "3px solid rgba(99,102,241,0.15)",
            borderTopColor: "#6366f1",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            boxShadow: "0 0 20px rgba(99,102,241,0.2)"
          }} />
          <div style={{ color: "#475569", fontSize: 13, fontWeight: 500, letterSpacing: "0.05em" }}>Veriler yükleniyor...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  const todayWordAcc = todayStats ? calcAcc(todayStats.word_correct, todayStats.word_wrong) : 0;
  const todaySentenceAcc = todayStats ? calcAcc(todayStats.sentence_correct, todayStats.sentence_wrong) : 0;
  const todayTotalAcc = todayStats ? (todayStats.accuracy || calcAcc(todayStats.total_correct, todayStats.total_wrong)) : 0;

  return (
    <div style={{
      background: "#0a0a18",
      minHeight: "100vh",
      color: "#f8fafc",
      fontFamily: "system-ui, -apple-system, sans-serif",
      padding: "24px 16px 48px"
    }}>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: #1e1e38; border-radius: 6px; }
      `}</style>

      <div style={{ maxWidth: 480, margin: "0 auto" }}>

        {/* ── HEADER ── */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            fontSize: 10,
            letterSpacing: "4px",
            color: "#6366f1",
            fontWeight: 700,
            textTransform: "uppercase",
            marginBottom: 8,
            opacity: 0.7
          }}>
            DASHBOARD
          </div>
          <h1 style={{
            fontSize: 26,
            fontWeight: 900,
            margin: 0,
            color: "#f1f5f9",
            letterSpacing: "-0.8px",
            background: "linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            Çalışma İstatistiklerim
          </h1>
        </div>

        {/* ── BUGÜN ── */}
        <SurfaceCard accentColor="#6366f1" style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: "#475569", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 14 }}>
            📅 Bugün
          </div>

          {todayStats ? (
            <>
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                <StatPill value={todayStats.word_correct || 0} label="Kel. Doğru" color="#10b981" bg="rgba(16,185,129,0.07)" border="rgba(16,185,129,0.12)" />
                <StatPill value={todayStats.word_wrong || 0} label="Kel. Yanlış" color="#ef4444" bg="rgba(239,68,68,0.07)" border="rgba(239,68,68,0.12)" />
                <StatPill value={todayStats.sentence_correct || 0} label="Cüm. Doğru" color="#10b981" bg="rgba(16,185,129,0.07)" border="rgba(16,185,129,0.12)" />
                <StatPill value={todayStats.sentence_wrong || 0} label="Cüm. Yanlış" color="#ef4444" bg="rgba(239,68,68,0.07)" border="rgba(239,68,68,0.12)" />
              </div>

              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid rgba(255,255,255,0.05)",
                paddingTop: 12,
                marginTop: 4
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>📊 Toplam</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <MiniBadge icon="✅" value={todayStats.total_correct || 0} color="#34d399" bg="rgba(16,185,129,0.12)" border="rgba(16,185,129,0.3)" />
                  <MiniBadge icon="❌" value={todayStats.total_wrong || 0} color="#f87171" bg="rgba(239,68,68,0.14)" border="rgba(239,68,68,0.35)" />
                  <span style={{ fontSize: 15, fontWeight: 800, color: getAccColor(todayTotalAcc) }}>%{todayTotalAcc}</span>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.04)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{
                    width: `${todayTotalAcc}%`,
                    height: "100%",
                    background: `linear-gradient(90deg, ${getAccColor(todayTotalAcc)}99, ${getAccColor(todayTotalAcc)})`,
                    borderRadius: 4,
                    transition: "width 0.4s ease",
                    boxShadow: `0 0 8px ${getAccColor(todayTotalAcc)}60`
                  }} />
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", color: "#334155", fontSize: 13, padding: "16px 0" }}>
              Bugün henüz çalışma yok 🌱
            </div>
          )}
        </SurfaceCard>

        {/* ── KELİME / CÜMLE ÖZETİ ── */}
        <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
          <SurfaceCard accentColor="#818cf8">
            <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 10 }}>
              📖 Kelime
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: getAccColor(summary.wordAccuracy) }}>
                %{summary.wordAccuracy}
              </span>
              <span style={{ fontSize: 11, color: "#475569" }}>başarı</span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <StatPill value={summary.wordTotalCorrect} label="Doğru" color="#10b981" bg="rgba(16,185,129,0.07)" border="rgba(16,185,129,0.12)" />
              <StatPill value={summary.wordTotalWrong} label="Yanlış" color="#ef4444" bg="rgba(239,68,68,0.07)" border="rgba(239,68,68,0.12)" />
            </div>
          </SurfaceCard>

          <SurfaceCard accentColor="#60a5fa">
            <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 10 }}>
              📝 Cümle
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: getAccColor(summary.sentenceAccuracy) }}>
                %{summary.sentenceAccuracy}
              </span>
              <span style={{ fontSize: 11, color: "#475569" }}>başarı</span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <StatPill value={summary.sentenceTotalCorrect} label="Doğru" color="#10b981" bg="rgba(16,185,129,0.07)" border="rgba(16,185,129,0.12)" />
              <StatPill value={summary.sentenceTotalWrong} label="Yanlış" color="#ef4444" bg="rgba(239,68,68,0.07)" border="rgba(239,68,68,0.12)" />
            </div>
          </SurfaceCard>
        </div>

        {/* ── GENEL TOPLAM ── */}
        <SurfaceCard accentColor="#fbbf24" style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 12 }}>
            📊 Genel Toplam
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            <StatPill value={summary.totalCorrect} label="Doğru" color="#10b981" bg="rgba(16,185,129,0.07)" border="rgba(16,185,129,0.12)" />
            <StatPill value={summary.totalWrong} label="Yanlış" color="#ef4444" bg="rgba(239,68,68,0.07)" border="rgba(239,68,68,0.12)" />
            <StatPill value={`%${summary.accuracy}`} label="Başarı" color={getAccColor(summary.accuracy)} bg={getAccTones(summary.accuracy).bg} border={getAccTones(summary.accuracy).border} />
            <StatPill value={summary.totalAttempts} label="Çözüm" color="#818cf8" bg="rgba(99,102,241,0.07)" border="rgba(99,102,241,0.12)" />
          </div>
          <div style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.04)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{
              width: `${summary.accuracy}%`,
              height: "100%",
              background: `linear-gradient(90deg, ${getAccColor(summary.accuracy)}99, ${getAccColor(summary.accuracy)})`,
              borderRadius: 4,
              transition: "width 0.4s ease",
              boxShadow: `0 0 8px ${getAccColor(summary.accuracy)}60`
            }} />
          </div>
        </SurfaceCard>

        {/* ── EN İYİ / EN KÖTÜ GÜN ── */}
        <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
          <SurfaceCard accentColor="#10b981">
            <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 8 }}>
              🔥 En İyi Gün
            </div>
            {summary.bestDay ? (
              <>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#f1f5f9", marginBottom: 8 }}>
                  {formatDate(summary.bestDay.stat_date)}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <StatPill value={summary.bestDay.total_correct} label="Doğru" color="#10b981" bg="rgba(16,185,129,0.07)" border="rgba(16,185,129,0.12)" />
                  <StatPill value={summary.bestDay.total_wrong} label="Yanlış" color="#ef4444" bg="rgba(239,68,68,0.07)" border="rgba(239,68,68,0.12)" />
                </div>
              </>
            ) : (
              <div style={{ fontSize: 12, color: "#334155" }}>Veri yok</div>
            )}
          </SurfaceCard>

          <SurfaceCard accentColor="#ef4444">
            <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 8 }}>
              📉 En Kötü Gün
            </div>
            {summary.worstDay ? (
              <>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#f1f5f9", marginBottom: 8 }}>
                  {formatDate(summary.worstDay.stat_date)}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <StatPill value={summary.worstDay.total_correct} label="Doğru" color="#10b981" bg="rgba(16,185,129,0.07)" border="rgba(16,185,129,0.12)" />
                  <StatPill value={summary.worstDay.total_wrong} label="Yanlış" color="#ef4444" bg="rgba(239,68,68,0.07)" border="rgba(239,68,68,0.12)" />
                </div>
              </>
            ) : (
              <div style={{ fontSize: 12, color: "#334155" }}>Veri yok</div>
            )}
          </SurfaceCard>
        </div>

        {/* ── SON 30 GÜN TABLOSU ── */}
        <SurfaceCard accentColor="#6366f1" style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: "#475569", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              📋 Son 30 Gün
            </div>
            <div style={{ fontSize: 11, color: "#334155" }}>
              {last30Days.filter(d => (d.total_correct || 0) + (d.total_wrong || 0) > 0).length} gün çalışılmış
            </div>
          </div>

          {last30Days.length > 0 ? (
            <div style={{ maxHeight: 380, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
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
                    style={{
                      borderRadius: 12,
                      padding: "9px 12px",
                      background: today ? "rgba(99,102,241,0.1)" : "rgba(255,255,255,0.02)",
                      border: today ? "1px solid rgba(99,102,241,0.25)" : "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    {/* Üst satır: tarih + genel başarı */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: total > 0 ? 6 : 0 }}>
                      <span style={{ fontSize: 12, fontWeight: today ? 700 : 600, color: today ? "#818cf8" : "#e2e8f0" }}>
                        {formatDate(day.stat_date)}
                        <span style={{ fontSize: 9, color: "#475569", marginLeft: 5, fontWeight: 500 }}>
                          {getDayName(day.stat_date)}
                        </span>
                        {today && <span style={{ fontSize: 10, marginLeft: 4 }}>⭐</span>}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: getAccColor(totalAcc) }}>
                        {total > 0 ? `%${totalAcc}` : <span style={{ color: "#334155", fontWeight: 500 }}>Veri yok</span>}
                      </span>
                    </div>

                    {/* Alt satır: kelime ve cümle yan yana, tek satır */}
                    {total > 0 && (
                      <div style={{ display: "flex", gap: 8 }}>
                        <div style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          background: "rgba(255,255,255,0.025)",
                          borderRadius: 8,
                          padding: "5px 8px",
                        }}>
                          <span style={{ fontSize: 10, color: "#475569", fontWeight: 600 }}>Kelime</span>
                          {wordTotal > 0 ? (
                            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <MiniBadge icon="✅" value={day.word_correct || 0} color="#34d399" bg="rgba(16,185,129,0.12)" border="rgba(16,185,129,0.3)" />
                              <MiniBadge icon="❌" value={day.word_wrong || 0} color="#f87171" bg="rgba(239,68,68,0.14)" border="rgba(239,68,68,0.35)" />
                              <span style={{ fontSize: 11, color: getAccColor(wordAcc), fontWeight: 700 }}>%{wordAcc}</span>
                            </span>
                          ) : <span style={{ fontSize: 11, color: "#334155" }}>-</span>}
                        </div>

                        <div style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          background: "rgba(255,255,255,0.025)",
                          borderRadius: 8,
                          padding: "5px 8px",
                        }}>
                          <span style={{ fontSize: 10, color: "#475569", fontWeight: 600 }}>Cümle</span>
                          {sentenceTotal > 0 ? (
                            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <MiniBadge icon="✅" value={day.sentence_correct || 0} color="#34d399" bg="rgba(16,185,129,0.12)" border="rgba(16,185,129,0.3)" />
                              <MiniBadge icon="❌" value={day.sentence_wrong || 0} color="#f87171" bg="rgba(239,68,68,0.14)" border="rgba(239,68,68,0.35)" />
                              <span style={{ fontSize: 11, color: getAccColor(sentenceAcc), fontWeight: 700 }}>%{sentenceAcc}</span>
                            </span>
                          ) : <span style={{ fontSize: 11, color: "#334155" }}>-</span>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: "center", color: "#334155", fontSize: 13, padding: "20px 0" }}>
              Henüz veri yok
            </div>
          )}
        </SurfaceCard>

        {/* ── GRAFİK ── */}
        <SurfaceCard accentColor="#3b82f6">
          <div style={{ fontSize: 12, color: "#475569", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 12 }}>
            📈 Günlük Çalışma Grafiği
          </div>

          <div style={{ display: "flex", gap: 16, marginBottom: 14, fontSize: 11 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 10, height: 10, background: "#6366f1", borderRadius: 3, boxShadow: "0 0 6px rgba(99,102,241,0.5)" }}></span>
              <span style={{ color: "#94a3b8" }}>Kelime</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 10, height: 10, background: "#3b82f6", borderRadius: 3, boxShadow: "0 0 6px rgba(59,130,246,0.5)" }}></span>
              <span style={{ color: "#94a3b8" }}>Cümle</span>
            </div>
          </div>

          {last30Days.length > 0 ? (
            <div>
              <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 84 }}>
                {last30Days.slice(-30).map((day, index) => {
                  const wordTotal = (day.word_correct || 0) + (day.word_wrong || 0);
                  const sentenceTotal = (day.sentence_correct || 0) + (day.sentence_wrong || 0);
                  const maxTotal = Math.max(...last30Days.map(d =>
                    (d.word_correct || 0) + (d.word_wrong || 0) +
                    (d.sentence_correct || 0) + (d.sentence_wrong || 0)
                  ), 1);
                  const total = wordTotal + sentenceTotal;
                  const isTodayDate = isToday(day.stat_date);

                  return (
                    <div key={index} style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      position: "relative"
                    }}>
                      <div style={{
                        width: "100%",
                        height: 70,
                        display: "flex",
                        flexDirection: "column-reverse",
                        borderRadius: 3,
                        overflow: "hidden",
                        background: "rgba(255,255,255,0.03)",
                      }}>
                        {sentenceTotal > 0 && (
                          <div style={{
                            height: `${(sentenceTotal / maxTotal) * 100}%`,
                            background: isTodayDate ? "#60a5fa" : "#3b82f6",
                            transition: "height 0.3s ease",
                            minHeight: 2,
                            boxShadow: isTodayDate ? "0 0 6px rgba(96,165,250,0.5)" : "none"
                          }} />
                        )}
                        {wordTotal > 0 && (
                          <div style={{
                            height: `${(wordTotal / maxTotal) * 100}%`,
                            background: isTodayDate ? "#a78bfa" : "#6366f1",
                            borderRadius: "3px 3px 0 0",
                            transition: "height 0.3s ease",
                            minHeight: 2,
                            boxShadow: isTodayDate ? "0 0 6px rgba(167,139,250,0.5)" : "none"
                          }} />
                        )}
                      </div>
                      <div style={{
                        fontSize: 7,
                        color: isTodayDate ? "#818cf8" : "#334155",
                        marginTop: 4,
                        fontWeight: isTodayDate ? 700 : 400
                      }}>
                        {new Date(day.stat_date).getDate()}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#334155", marginTop: 8 }}>
                <span>{new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString('tr-TR')}</span>
                <span style={{ color: "#818cf8" }}>⭐ Bugün</span>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", color: "#334155", fontSize: 13, padding: "12px 0" }}>
              Henüz veri yok
            </div>
          )}
        </SurfaceCard>

      </div>
    </div>
  );
}