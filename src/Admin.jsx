// Admin.jsx
import { useState, useEffect } from "react";
import { supabase } from "./config.js";
import WordManagement from "./admin/WordManagement.jsx";
import LessonManagement from "./admin/LessonManagement.jsx";
import { styles, colors, PageHeader, Card, Message } from "./admin/adminStyles.js";

const ADMIN_PASSWORD = "123456";

// ============================
// GİRİŞ EKRANI
// ============================
function LoginScreen({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = () => {
    if (password === ADMIN_PASSWORD) {
      onLogin();
    } else {
      setError(true);
      setPassword("");
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.smallContainer}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🔒</div>
          <div style={styles.headerTitle}>WordFlow</div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Admin Girişi</div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(false); }}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            placeholder="Şifre"
            autoFocus
            style={{
              width: "100%", boxSizing: "border-box",
              background: colors.surface, 
              border: `1.5px solid ${error ? colors.error : colors.border}`,
              borderRadius: 12, 
              padding: "14px 16px", 
              color: colors.text,
              fontSize: 15, 
              outline: "none", 
              fontFamily: "inherit",
            }}
          />
          {error && <div style={{ fontSize: 12, color: colors.error, marginTop: 6 }}>⚠️ Şifre yanlış</div>}
        </div>
        <button 
          onClick={handleSubmit} 
          style={{
            width: "100%", 
            padding: 14, 
            borderRadius: 12, 
            border: "none", 
            background: colors.primary, 
            color: "#fff", 
            fontWeight: 700, 
            fontSize: 15, 
            cursor: "pointer" 
          }}
        >
          Giriş Yap →
        </button>
      </div>
    </div>
  );
}

// ============================
// ANA ADMIN PANELİ
// ============================
function AdminPanel({ onLogout }) {
  const [currentPage, setCurrentPage] = useState("main");
  const [recentLessons, setRecentLessons] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  const fetchRecentLessons = async () => {
    setLoadingRecent(true);
    try {
      const { data, error } = await supabase
        .from("en_lessons")
        .select("lesson_number, title, level, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentLessons(data || []);
    } catch (error) {
      console.error("Son dersler çekilirken hata:", error);
    } finally {
      setLoadingRecent(false);
    }
  };

  useEffect(() => {
    fetchRecentLessons();
  }, []);

  const renderPage = () => {
    switch(currentPage) {
      case "words":
        return <WordManagement onBack={() => setCurrentPage("main")} />;
      case "lessons":
        return <LessonManagement onBack={() => setCurrentPage("main")} />;
      default:
        return null;
    }
  };

  if (currentPage !== "main") {
    return (
      <div style={styles.pageContainer}>
        {renderPage()}
      </div>
    );
  }

  return (
    <div style={{ ...styles.pageContainer, maxWidth: 560, margin: "0 auto" }}>
      <div style={styles.header}>
        <div>
          <div style={styles.headerTitle}>WordFlow</div>
          <div style={styles.headerMainTitle}>Admin Paneli</div>
          <div style={styles.headerSubtitle}>Kelime ve Ders Yönetimi</div>
        </div>
        <button onClick={onLogout} style={styles.logoutButton}>
          Çıkış
        </button>
      </div>

      <Card compact>
        <div style={{ 
          fontSize: 10, 
          letterSpacing: 2, 
          color: colors.primary, 
          fontWeight: 600, 
          textTransform: "uppercase",
          marginBottom: 8
        }}>
          📚 Son Eklenen Dersler
        </div>
        {loadingRecent ? (
          <div style={{ fontSize: 12, color: colors.textSecondary }}>Yükleniyor...</div>
        ) : recentLessons.length > 0 ? (
          <div>
            {recentLessons.map((lesson, index) => (
              <div 
                key={index} 
                style={{
                  ...styles.recentItem,
                  borderBottom: index < recentLessons.length - 1 ? `1px solid ${colors.surfaceDark}` : "none"
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, color: colors.text }}>{lesson.title}</span>
                  <span style={{ fontSize: 11, color: colors.textMuted, marginLeft: 6 }}>#{lesson.lesson_number}</span>
                </div>
                <span style={{ 
                  fontSize: 10, 
                  color: colors.textSecondary, 
                  background: colors.surfaceDark, 
                  padding: "1px 8px", 
                  borderRadius: 4 
                }}>
                  {lesson.level || "A1"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: colors.textSecondary }}>Henüz ders yok</div>
        )}
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <button
          onClick={() => setCurrentPage("words")}
          style={styles.menuButton}
          onMouseEnter={(e) => { 
            e.currentTarget.style.borderColor = colors.primary; 
            e.currentTarget.style.transform = "translateY(-2px)"; 
          }}
          onMouseLeave={(e) => { 
            e.currentTarget.style.borderColor = colors.border; 
            e.currentTarget.style.transform = "translateY(0)"; 
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 8 }}>📝</div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Kelime Yönetimi</div>
          <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>Ekle, düzenle, sil</div>
        </button>

        <button
          onClick={() => setCurrentPage("lessons")}
          style={styles.menuButton}
          onMouseEnter={(e) => { 
            e.currentTarget.style.borderColor = colors.primary; 
            e.currentTarget.style.transform = "translateY(-2px)"; 
          }}
          onMouseLeave={(e) => { 
            e.currentTarget.style.borderColor = colors.border; 
            e.currentTarget.style.transform = "translateY(0)"; 
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 8 }}>📚</div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Ders Yönetimi</div>
          <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>Ekle, düzenle, sil</div>
        </button>
      </div>
    </div>
  );
}

export default function Admin() {
  const [loggedIn, setLoggedIn] = useState(false);
  if (!loggedIn) return <LoginScreen onLogin={() => setLoggedIn(true)} />;
  return <AdminPanel onLogout={() => setLoggedIn(false)} />;
}