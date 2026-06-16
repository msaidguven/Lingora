import { useState, useEffect } from "react";
import { getDailyStats, getTodayStats } from "../../utils/dailyStats.js";

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
      // Bugün
      const today = await getTodayStats();
      setTodayStats(today);
      
      // Son 30 gün
      const stats = await getDailyStats(30);
      setLast30Days(stats);
      
      // Özet hesapla
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

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "70vh", background: "#0b0b14" }}>
        <div style={{ color: "#64748b" }}>Yükleniyor...</div>
      </div>
    );
  }

  // Tarih formatı
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: '2-digit' 
    });
  };

  // Gün ismi
  const getDayName = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', { weekday: 'short' });
  };

  // Bugün mü kontrolü
  const isToday = (dateStr) => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };

  // Bugünün doğruluk oranlarını hesapla
  const getTodayAccuracy = (correct, wrong) => {
    const total = correct + wrong;
    return total > 0 ? Math.round((correct / total) * 100) : 0;
  };

  return (
    <div style={{ 
      background: "#0b0b14", 
      minHeight: "100vh", 
      color: "#f8fafc", 
      fontFamily: "system-ui, -apple-system, sans-serif",
      padding: "20px 16px 40px"
    }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 11, letterSpacing: "3px", color: "#818cf8", fontWeight: 700 }}>📊 DASHBOARD</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginTop: 4, color: "#ffffff" }}>
            Çalışma İstatistiklerim
          </h1>
        </div>

        {/* 📅 Bugün - Ayrı ayrı gösterim */}
        <div style={{ 
          background: "#131324", 
          borderRadius: 16, 
          padding: "16px 18px",
          border: "1px solid #1e1e38",
          marginBottom: 16
        }}>
          <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500, marginBottom: 12 }}>📅 Bugün</div>
          
          {todayStats ? (
            <>
              {/* Kelime */}
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                padding: "8px 12px",
                background: "#1a1a30",
                borderRadius: 8,
                marginBottom: 6
              }}>
                <span style={{ fontSize: 13, color: "#94a3b8" }}>📖 Kelime</span>
                <div style={{ display: "flex", gap: 12, fontSize: 13 }}>
                  <span style={{ color: "#10b981" }}>✅ {todayStats.word_correct || 0}</span>
                  <span style={{ color: "#ef4444" }}>❌ {todayStats.word_wrong || 0}</span>
                  <span style={{ 
                    color: getTodayAccuracy(todayStats.word_correct, todayStats.word_wrong) >= 70 ? "#10b981" : "#f59e0b", 
                    fontWeight: 700 
                  }}>
                    %{getTodayAccuracy(todayStats.word_correct, todayStats.word_wrong)}
                  </span>
                </div>
              </div>
              
              {/* Cümle */}
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                padding: "8px 12px",
                background: "#1a1a30",
                borderRadius: 8,
                marginBottom: 8
              }}>
                <span style={{ fontSize: 13, color: "#94a3b8" }}>📝 Cümle</span>
                <div style={{ display: "flex", gap: 12, fontSize: 13 }}>
                  <span style={{ color: "#10b981" }}>✅ {todayStats.sentence_correct || 0}</span>
                  <span style={{ color: "#ef4444" }}>❌ {todayStats.sentence_wrong || 0}</span>
                  <span style={{ 
                    color: getTodayAccuracy(todayStats.sentence_correct, todayStats.sentence_wrong) >= 70 ? "#10b981" : "#f59e0b", 
                    fontWeight: 700 
                  }}>
                    %{getTodayAccuracy(todayStats.sentence_correct, todayStats.sentence_wrong)}
                  </span>
                </div>
              </div>
              
              {/* Toplam - Çizgi ile ayrılmış */}
              <div style={{ 
                borderTop: "1px solid #1e1e38", 
                marginTop: 8, 
                paddingTop: 8,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#f8fafc" }}>📊 Toplam</span>
                <div style={{ display: "flex", gap: 12, fontSize: 13, fontWeight: 600 }}>
                  <span style={{ color: "#10b981" }}>✅ {todayStats.total_correct || 0}</span>
                  <span style={{ color: "#ef4444" }}>❌ {todayStats.total_wrong || 0}</span>
                  <span style={{ color: "#f59e0b" }}>🎯 %{todayStats.accuracy || 0}</span>
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", color: "#64748b", fontSize: 13, padding: "12px 0" }}>
              Bugün henüz çalışma yok 🌱
            </div>
          )}
        </div>

        {/* 📊 Özet Kartları - Kelime ve Cümle ayrı */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          {/* Kelime Özeti */}
          <div style={{ 
            background: "linear-gradient(135deg, #1a1a2e, #16213e)", 
            borderRadius: 14, 
            padding: "14px 16px",
            border: "1px solid #1e293b"
          }}>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>📖 Kelime</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#818cf8" }}>
                %{summary.wordAccuracy}
              </span>
              <span style={{ fontSize: 12, color: "#64748b" }}>başarı</span>
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
              ✅ {summary.wordTotalCorrect} / ❌ {summary.wordTotalWrong}
            </div>
          </div>
          
          {/* Cümle Özeti */}
          <div style={{ 
            background: "linear-gradient(135deg, #1a1a2e, #16213e)", 
            borderRadius: 14, 
            padding: "14px 16px",
            border: "1px solid #1e293b"
          }}>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>📝 Cümle</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#818cf8" }}>
                %{summary.sentenceAccuracy}
              </span>
              <span style={{ fontSize: 12, color: "#64748b" }}>başarı</span>
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
              ✅ {summary.sentenceTotalCorrect} / ❌ {summary.sentenceTotalWrong}
            </div>
          </div>
        </div>

        {/* Genel Özet */}
        <div style={{ 
          background: "linear-gradient(135deg, #1a1a2e, #16213e)", 
          borderRadius: 14, 
          padding: "14px 16px",
          border: "1px solid #1e293b",
          marginBottom: 16
        }}>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>📊 Genel Toplam</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
            <div style={{ display: "flex", gap: 16 }}>
              <div>
                <span style={{ fontSize: 20, fontWeight: 800, color: "#10b981" }}>{summary.totalCorrect}</span>
                <span style={{ fontSize: 11, color: "#64748b", marginLeft: 2 }}>✅</span>
              </div>
              <div>
                <span style={{ fontSize: 20, fontWeight: 800, color: "#ef4444" }}>{summary.totalWrong}</span>
                <span style={{ fontSize: 11, color: "#64748b", marginLeft: 2 }}>❌</span>
              </div>
            </div>
            <div>
              <span style={{ fontSize: 24, fontWeight: 800, color: "#f59e0b" }}>%{summary.accuracy}</span>
            </div>
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
            {summary.totalAttempts} toplam çözüm
          </div>
        </div>

        {/* En iyi / En kötü gün */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div style={{ background: "#131324", borderRadius: 12, padding: "12px 14px", border: "1px solid #1e1e38" }}>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>🔥 En İyi Gün</div>
            {summary.bestDay ? (
              <>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#10b981" }}>
                  {formatDate(summary.bestDay.stat_date)}
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>
                  ✅ {summary.bestDay.total_correct} / ❌ {summary.bestDay.total_wrong}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 12, color: "#64748b" }}>Veri yok</div>
            )}
          </div>
          <div style={{ background: "#131324", borderRadius: 12, padding: "12px 14px", border: "1px solid #1e1e38" }}>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>📉 En Kötü Gün</div>
            {summary.worstDay ? (
              <>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#ef4444" }}>
                  {formatDate(summary.worstDay.stat_date)}
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>
                  ✅ {summary.worstDay.total_correct} / ❌ {summary.worstDay.total_wrong}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 12, color: "#64748b" }}>Veri yok</div>
            )}
          </div>
        </div>

        {/* 📋 Son 30 Gün Tablosu - Kelime ve Cümle ayrı */}
        <div style={{ 
          background: "#131324", 
          borderRadius: 16, 
          padding: "16px 18px",
          border: "1px solid #1e1e38",
          marginBottom: 16
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>📋 Son 30 Gün</div>
            <div style={{ fontSize: 11, color: "#475569" }}>
              {last30Days.filter(d => (d.total_correct || 0) + (d.total_wrong || 0) > 0).length} gün çalışılmış
            </div>
          </div>
          
          {last30Days.length > 0 ? (
            <div style={{ 
              maxHeight: 350, 
              overflowY: "auto",
              scrollbarWidth: "thin",
              scrollbarColor: "#1e1e38 transparent"
            }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1e1e38" }}>
                    <th style={{ textAlign: "left", padding: "6px 4px", color: "#64748b", fontWeight: 600, fontSize: 10 }}>Tarih</th>
                    <th style={{ textAlign: "center", padding: "6px 4px", color: "#64748b", fontWeight: 600, fontSize: 10 }}>📖</th>
                    <th style={{ textAlign: "center", padding: "6px 4px", color: "#64748b", fontWeight: 600, fontSize: 10 }}>📝</th>
                    <th style={{ textAlign: "right", padding: "6px 4px", color: "#64748b", fontWeight: 600, fontSize: 10 }}>📊</th>
                  </tr>
                </thead>
                <tbody>
                  {last30Days.slice().reverse().map((day) => {
                    const total = (day.total_correct || 0) + (day.total_wrong || 0);
                    const today = isToday(day.stat_date);
                    
                    // Başarı renkleri
                    const wordTotal = (day.word_correct || 0) + (day.word_wrong || 0);
                    const sentenceTotal = (day.sentence_correct || 0) + (day.sentence_wrong || 0);
                    const wordAcc = wordTotal > 0 ? Math.round(((day.word_correct || 0) / wordTotal) * 100) : 0;
                    const sentenceAcc = sentenceTotal > 0 ? Math.round(((day.sentence_correct || 0) / sentenceTotal) * 100) : 0;
                    const totalAcc = total > 0 ? Math.round(((day.total_correct || 0) / total) * 100) : 0;
                    
                    const getColor = (acc) => {
                      if (acc >= 80) return "#10b981";
                      if (acc >= 60) return "#f59e0b";
                      if (acc > 0) return "#ef4444";
                      return "#64748b";
                    };
                    
                    return (
                      <tr 
                        key={day.stat_date} 
                        style={{ 
                          borderBottom: "1px solid #1a1a30",
                          background: today ? "rgba(99, 102, 241, 0.08)" : "transparent",
                          fontWeight: today ? 700 : 400
                        }}
                      >
                        <td style={{ padding: "6px 4px", color: today ? "#818cf8" : "#e2e8f0" }}>
                          {formatDate(day.stat_date)}
                          <span style={{ fontSize: 9, color: "#475569", marginLeft: 4 }}>
                            {getDayName(day.stat_date)}
                          </span>
                          {today && <span style={{ fontSize: 9, color: "#818cf8", marginLeft: 4 }}>⭐</span>}
                        </td>
                        <td style={{ textAlign: "center", padding: "6px 4px", fontSize: 11 }}>
                          {wordTotal > 0 ? (
                            <span style={{ color: getColor(wordAcc) }}>
                              ✅{day.word_correct || 0} ❌{day.word_wrong || 0}
                              <span style={{ fontSize: 9, marginLeft: 2, color: "#818cf8" }}>%{wordAcc}</span>
                            </span>
                          ) : "-"}
                        </td>
                        <td style={{ textAlign: "center", padding: "6px 4px", fontSize: 11 }}>
                          {sentenceTotal > 0 ? (
                            <span style={{ color: getColor(sentenceAcc) }}>
                              ✅{day.sentence_correct || 0} ❌{day.sentence_wrong || 0}
                              <span style={{ fontSize: 9, marginLeft: 2, color: "#818cf8" }}>%{sentenceAcc}</span>
                            </span>
                          ) : "-"}
                        </td>
                        <td style={{ textAlign: "right", padding: "6px 4px", fontWeight: 700, color: getColor(totalAcc) }}>
                          {total > 0 ? `%${totalAcc}` : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: "center", color: "#64748b", fontSize: 13, padding: "20px 0" }}>
              Henüz veri yok
            </div>
          )}
        </div>

        {/* 📈 Grafik - Kelime ve Cümle ayrı renklerle */}
        <div style={{ 
          background: "#131324", 
          borderRadius: 16, 
          padding: "16px 18px",
          border: "1px solid #1e1e38"
        }}>
          <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500, marginBottom: 12 }}>📈 Günlük Çalışma Grafiği</div>
          
          {/* Lejant */}
          <div style={{ display: "flex", gap: 16, marginBottom: 10, fontSize: 11 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 12, height: 12, background: "#6366f1", borderRadius: 3 }}></span>
              <span style={{ color: "#94a3b8" }}>Kelime</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 12, height: 12, background: "#3b82f6", borderRadius: 3 }}></span>
              <span style={{ color: "#94a3b8" }}>Cümle</span>
            </div>
          </div>
          
          {last30Days.length > 0 ? (
            <div>
              <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 80 }}>
                {last30Days.slice(-30).map((day, index) => {
                  const wordTotal = (day.word_correct || 0) + (day.word_wrong || 0);
                  const sentenceTotal = (day.sentence_correct || 0) + (day.sentence_wrong || 0);
                  const maxTotal = Math.max(...last30Days.map(d => 
                    (d.word_correct || 0) + (d.word_wrong || 0) + 
                    (d.sentence_correct || 0) + (d.sentence_wrong || 0)
                  ), 1);
                  const total = wordTotal + sentenceTotal;
                  const height = maxTotal > 0 ? (total / maxTotal) * 70 : 0;
                  const wordHeight = maxTotal > 0 ? (wordTotal / maxTotal) * 70 : 0;
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
                        height: Math.max(height, total > 0 ? 4 : 0),
                        display: "flex",
                        flexDirection: "column-reverse",
                        borderRadius: 3,
                        overflow: "hidden",
                        background: "#1a1a30",
                        minHeight: total > 0 ? 4 : 0
                      }}>
                        {/* Cümle (mavi) */}
                        {sentenceTotal > 0 && (
                          <div style={{ 
                            height: `${(sentenceTotal / maxTotal) * 70}%`,
                            background: isTodayDate ? "#60a5fa" : "#3b82f6",
                            borderRadius: "0 0 3px 3px",
                            transition: "height 0.3s ease",
                            minHeight: 2
                          }} />
                        )}
                        {/* Kelime (mor) */}
                        {wordTotal > 0 && (
                          <div style={{ 
                            height: `${(wordTotal / maxTotal) * 70}%`,
                            background: isTodayDate ? "#a78bfa" : "#6366f1",
                            borderRadius: "3px 3px 0 0",
                            transition: "height 0.3s ease",
                            minHeight: 2
                          }} />
                        )}
                      </div>
                      <div style={{ 
                        fontSize: 7, 
                        color: isTodayDate ? "#818cf8" : "#475569", 
                        marginTop: 4,
                        fontWeight: isTodayDate ? 700 : 400
                      }}>
                        {new Date(day.stat_date).getDate()}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#475569", marginTop: 6 }}>
                <span>{new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString('tr-TR')}</span>
                <span style={{ color: "#818cf8" }}>⭐ Bugün</span>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", color: "#64748b", fontSize: 13, padding: "12px 0" }}>
              Henüz veri yok
            </div>
          )}
        </div>

      </div>
    </div>
  );
}