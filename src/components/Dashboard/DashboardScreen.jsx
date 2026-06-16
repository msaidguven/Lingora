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

        {/* Özet */}
        <div style={{ 
          background: "linear-gradient(135deg, #1a1a2e, #16213e)", 
          borderRadius: 16, 
          padding: "16px 18px",
          border: "1px solid #1e293b",
          marginBottom: 16
        }}>
          <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500, marginBottom: 8 }}>📊 Son 30 Gün Özet</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#10b981" }}>{summary.totalCorrect}</div>
              <div style={{ fontSize: 9, color: "#64748b" }}>Doğru</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#ef4444" }}>{summary.totalWrong}</div>
              <div style={{ fontSize: 9, color: "#64748b" }}>Yanlış</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#818cf8" }}>{summary.totalAttempts}</div>
              <div style={{ fontSize: 9, color: "#64748b" }}>Toplam</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#f59e0b" }}>%{summary.accuracy}</div>
              <div style={{ fontSize: 9, color: "#64748b" }}>Başarı</div>
            </div>
          </div>
        </div>

        {/* En iyi / En kötü gün */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div style={{ background: "#131324", borderRadius: 12, padding: "12px 14px", border: "1px solid #1e1e38" }}>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>🔥 En İyi Gün</div>
            {summary.bestDay ? (
              <>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#10b981" }}>
                  {new Date(summary.bestDay.stat_date).toLocaleDateString('tr-TR')}
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>
                  {summary.bestDay.total_correct} doğru, {summary.bestDay.total_wrong} yanlış
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
                <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444" }}>
                  {new Date(summary.worstDay.stat_date).toLocaleDateString('tr-TR')}
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>
                  {summary.worstDay.total_correct} doğru, {summary.worstDay.total_wrong} yanlış
                </div>
              </>
            ) : (
              <div style={{ fontSize: 12, color: "#64748b" }}>Veri yok</div>
            )}
          </div>
        </div>

        {/* Basit Grafik (Bar Chart) */}
        <div style={{ 
          background: "#131324", 
          borderRadius: 16, 
          padding: "16px 18px",
          border: "1px solid #1e1e38"
        }}>
          <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500, marginBottom: 12 }}>📈 Günlük Çalışma</div>
          {last30Days.length > 0 ? (
            <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 80 }}>
              {last30Days.slice(-30).map((day, index) => {
                const total = (day.total_correct || 0) + (day.total_wrong || 0);
                const maxTotal = Math.max(...last30Days.map(d => (d.total_correct || 0) + (d.total_wrong || 0)), 1);
                const height = maxTotal > 0 ? (total / maxTotal) * 70 : 0;
                const isToday = day.stat_date === new Date().toISOString().split('T')[0];
                
                return (
                  <div key={index} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ 
                      width: "100%", 
                      height: height,
                      background: isToday ? "#818cf8" : "#6366f1",
                      borderRadius: 3,
                      minHeight: total > 0 ? 4 : 0,
                      opacity: total > 0 ? 1 : 0.2,
                      transition: "height 0.3s ease"
                    }} />
                    <div style={{ 
                      fontSize: 7, 
                      color: "#64748b", 
                      marginTop: 4,
                      transform: "rotate(-45deg)",
                      transformOrigin: "center",
                      whiteSpace: "nowrap"
                    }}>
                      {new Date(day.stat_date).getDate()}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: "center", color: "#64748b", fontSize: 13, padding: "12px 0" }}>
              Henüz veri yok
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#475569", marginTop: 8 }}>
            <span>{new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString('tr-TR')}</span>
            <span>Bugün</span>
          </div>
        </div>

      </div>
    </div>
  );
}