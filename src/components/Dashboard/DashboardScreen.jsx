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
      let bestDay = null, worstDay = null;
      
      stats.forEach(day => {
        totalCorrect += day.total_correct || 0;
        totalWrong += day.total_wrong || 0;
        
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
      
      setSummary({
        totalCorrect,
        totalWrong,
        totalAttempts,
        accuracy,
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

        {/* Bugün */}
        <div style={{ 
          background: "#131324", 
          borderRadius: 16, 
          padding: "16px 18px",
          border: "1px solid #1e1e38",
          marginBottom: 16
        }}>
          <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500, marginBottom: 8 }}>📅 Bugün</div>
          {todayStats ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#10b981" }}>{todayStats.total_correct || 0}</div>
                <div style={{ fontSize: 10, color: "#64748b" }}>✅ Doğru</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#ef4444" }}>{todayStats.total_wrong || 0}</div>
                <div style={{ fontSize: 10, color: "#64748b" }}>❌ Yanlış</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#818cf8" }}>%{todayStats.accuracy || 0}</div>
                <div style={{ fontSize: 10, color: "#64748b" }}>🎯 Başarı</div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", color: "#64748b", fontSize: 13, padding: "12px 0" }}>
              Bugün henüz çalışma yok 🌱
            </div>
          )}
        </div>

        {/* Özet Kartları */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div style={{ 
            background: "linear-gradient(135deg, #1a1a2e, #16213e)", 
            borderRadius: 14, 
            padding: "14px 16px",
            border: "1px solid #1e293b"
          }}>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>Son 30 Gün</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#818cf8", marginTop: 4 }}>
              {summary.totalAttempts}
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>toplam çözüm</div>
          </div>
          <div style={{ 
            background: "linear-gradient(135deg, #1a1a2e, #16213e)", 
            borderRadius: 14, 
            padding: "14px 16px",
            border: "1px solid #1e293b"
          }}>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>Başarı Oranı</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#f59e0b", marginTop: 4 }}>
              %{summary.accuracy}
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>
              {summary.totalCorrect} ✅ / {summary.totalWrong} ❌
            </div>
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
                  {summary.bestDay.total_correct} ✅ / {summary.bestDay.total_wrong} ❌
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
                  {summary.worstDay.total_correct} ✅ / {summary.worstDay.total_wrong} ❌
                </div>
              </>
            ) : (
              <div style={{ fontSize: 12, color: "#64748b" }}>Veri yok</div>
            )}
          </div>
        </div>

        {/* 🆕 Son 30 Gün Tablosu */}
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
              maxHeight: 300, 
              overflowY: "auto",
              scrollbarWidth: "thin",
              scrollbarColor: "#1e1e38 transparent"
            }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1e1e38" }}>
                    <th style={{ textAlign: "left", padding: "6px 4px", color: "#64748b", fontWeight: 600, fontSize: 11 }}>Tarih</th>
                    <th style={{ textAlign: "center", padding: "6px 4px", color: "#64748b", fontWeight: 600, fontSize: 11 }}>✅</th>
                    <th style={{ textAlign: "center", padding: "6px 4px", color: "#64748b", fontWeight: 600, fontSize: 11 }}>❌</th>
                    <th style={{ textAlign: "center", padding: "6px 4px", color: "#64748b", fontWeight: 600, fontSize: 11 }}>🎯</th>
                    <th style={{ textAlign: "right", padding: "6px 4px", color: "#64748b", fontWeight: 600, fontSize: 11 }}>Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  {last30Days.slice().reverse().map((day) => {
                    const total = (day.total_correct || 0) + (day.total_wrong || 0);
                    const accuracy = total > 0 ? Math.round(((day.total_correct || 0) / total) * 100) : 0;
                    const today = isToday(day.stat_date);
                    
                    // Başarı rengi
                    let accuracyColor = "#64748b";
                    if (accuracy >= 80) accuracyColor = "#10b981";
                    else if (accuracy >= 60) accuracyColor = "#f59e0b";
                    else if (accuracy > 0) accuracyColor = "#ef4444";
                    
                    return (
                      <tr 
                        key={day.stat_date} 
                        style={{ 
                          borderBottom: "1px solid #1a1a30",
                          background: today ? "rgba(99, 102, 241, 0.08)" : "transparent",
                          fontWeight: today ? 700 : 400
                        }}
                      >
                        <td style={{ padding: "8px 4px", color: today ? "#818cf8" : "#e2e8f0" }}>
                          {formatDate(day.stat_date)}
                          <span style={{ fontSize: 10, color: "#475569", marginLeft: 4 }}>
                            {getDayName(day.stat_date)}
                          </span>
                          {today && <span style={{ fontSize: 9, color: "#818cf8", marginLeft: 4 }}>⭐</span>}
                        </td>
                        <td style={{ textAlign: "center", padding: "8px 4px", color: "#10b981" }}>
                          {day.total_correct || 0}
                        </td>
                        <td style={{ textAlign: "center", padding: "8px 4px", color: "#ef4444" }}>
                          {day.total_wrong || 0}
                        </td>
                        <td style={{ textAlign: "center", padding: "8px 4px", color: accuracyColor, fontWeight: 700 }}>
                          {total > 0 ? `%${accuracy}` : "-"}
                        </td>
                        <td style={{ textAlign: "right", padding: "8px 4px", color: "#94a3b8" }}>
                          {total}
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

        {/* Basit Grafik (Bar Chart) */}
        <div style={{ 
          background: "#131324", 
          borderRadius: 16, 
          padding: "16px 18px",
          border: "1px solid #1e1e38"
        }}>
          <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500, marginBottom: 12 }}>📈 Günlük Çalışma Grafiği</div>
          {last30Days.length > 0 ? (
            <div>
              <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 80 }}>
                {last30Days.slice(-30).map((day, index) => {
                  const total = (day.total_correct || 0) + (day.total_wrong || 0);
                  const maxTotal = Math.max(...last30Days.map(d => (d.total_correct || 0) + (d.total_wrong || 0)), 1);
                  const height = maxTotal > 0 ? (total / maxTotal) * 70 : 0;
                  const isTodayDate = isToday(day.stat_date);
                  
                  return (
                    <div key={index} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ 
                        width: "100%", 
                        height: Math.max(height, total > 0 ? 4 : 0),
                        background: isTodayDate ? "#818cf8" : "#6366f1",
                        borderRadius: 3,
                        opacity: total > 0 ? 1 : 0.2,
                        transition: "height 0.3s ease"
                      }} />
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