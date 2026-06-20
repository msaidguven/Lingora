// Admin.jsx
import { useState, useEffect } from "react";
import { supabase } from "./config.js";
import { useAuth } from './contexts/AuthContext';
import WordManagement from "./admin/WordManagement.jsx";
import LessonManagement from "./admin/LessonManagement.jsx";
import { styles, colors, PageHeader, Card, Message } from "./admin/adminStyles.jsx";

// ============================
// YETKİ KONTROL FONKSİYONU
// ============================
const hasAdminAccess = (user) => {
  if (!user) return false;
  
  // Kullanıcının rolünü kontrol et
  const userRole = user?.user_metadata?.role || user?.role || 'user';
  return userRole === 'admin' || userRole === 'editor' || userRole === 'moderator';
};

// ============================
// YETKİSİZ EKRAN
// ============================
function UnauthorizedScreen({ onBack }) {
  return (
    <div style={styles.pageContainer}>
      <div style={styles.smallContainer}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>🚫</div>
          <div style={styles.headerTitle}>Erişim Engellendi</div>
          <div style={{ fontSize: 14, color: colors.textSecondary, marginTop: 8 }}>
            Bu sayfaya erişim yetkiniz yok.
          </div>
          <div style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>
            Yalnızca Admin, Editör ve Moderatör yetkisi olan kullanıcılar erişebilir.
          </div>
        </div>
        <button 
          onClick={onBack} 
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
          Ana Sayfaya Dön
        </button>
      </div>
    </div>
  );
}

// ============================
// ANA ADMIN PANELİ
// ============================
function AdminPanel({ onBack, user }) {
  const [currentPage, setCurrentPage] = useState("main");
  const [recentLessons, setRecentLessons] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [userRole, setUserRole] = useState('user');

  // Kullanıcı rolünü al
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from("en_users")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Rol çekme hatası:", error);
          return;
        }

        if (data) {
          setUserRole(data.role || 'user');
        }
      } catch (error) {
        console.error("Rol işlemleri hatası:", error);
      }
    };

    fetchUserRole();
  }, [user]);

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

  // Alt sayfalarda (kelime/ders yönetimi) header'ı gizle
  if (currentPage !== "main") {
    return (
      <div style={styles.pageContainer}>
        {renderPage()}
      </div>
    );
  }

  // Admin paneli ana sayfası
  const isAdmin = userRole === 'admin';
  const isEditor = userRole === 'editor';
  const isModerator = userRole === 'moderator';

  return (
    <div style={{ ...styles.pageContainer, maxWidth: 560, margin: "0 auto" }}>
      <div style={styles.header}>
        <div>
          <div style={styles.headerTitle}>WordFlow</div>
          <div style={styles.headerMainTitle}>Admin Paneli</div>
          <div style={styles.headerSubtitle}>
            {isAdmin && '👑 Admin'}
            {isEditor && '✏️ Editör'}
            {isModerator && '🛡️ Moderatör'}
          </div>
        </div>
        <button onClick={onBack} style={styles.logoutButton}>
          Ana Sayfaya Dön
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
        {/* Kelime Yönetimi - Admin ve Editör görebilir */}
        {(isAdmin || isEditor || isModerator) && (
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
            {!isAdmin && isEditor && (
              <span style={{ 
                fontSize: 9, 
                background: colors.warning, 
                color: '#fff', 
                padding: '2px 8px', 
                borderRadius: 4, 
                marginTop: 4 
              }}>
                Editör
              </span>
            )}
          </button>
        )}

        {/* Ders Yönetimi - Sadece Admin ve Editör görebilir */}
        {(isAdmin || isEditor) && (
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
            {!isAdmin && isEditor && (
              <span style={{ 
                fontSize: 9, 
                background: colors.warning, 
                color: '#fff', 
                padding: '2px 8px', 
                borderRadius: 4, 
                marginTop: 4 
              }}>
                Editör
              </span>
            )}
          </button>
        )}

        {/* Moderatör için sadece kelime yönetimi gösteriliyor */}
        {isModerator && !isAdmin && !isEditor && (
          <div style={{ 
            gridColumn: 'span 2', 
            textAlign: 'center', 
            fontSize: 12, 
            color: colors.textSecondary,
            padding: 12,
            background: colors.surfaceDark,
            borderRadius: 12
          }}>
            🛡️ Moderatör olarak sadece Kelime Yönetimi bölümüne erişiminiz var.
          </div>
        )}
      </div>
    </div>
  );
}

// ============================
// ANA ADMIN BİLEŞENİ
// ============================
export default function Admin({ onBack }) {
  const { user, loading } = useAuth();
  const [userRole, setUserRole] = useState('user');
  const [roleLoading, setRoleLoading] = useState(true);

  // Kullanıcı rolünü veritabanından al
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setRoleLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("en_users")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error("❌ Rol çekme hatası:", error);
          setRoleLoading(false);
          return;
        }

        if (data) {
          setUserRole(data.role || 'user');
        }
      } catch (error) {
        console.error("❌ Rol işlemleri hatası:", error);
      } finally {
        setRoleLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  // Auth yükleniyor
  if (loading || roleLoading) {
    return (
      <div style={styles.pageContainer}>
        <div style={styles.smallContainer}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, marginBottom: 10 }}>⏳</div>
            <div style={{ fontSize: 14, color: colors.textSecondary }}>Yükleniyor...</div>
          </div>
        </div>
      </div>
    );
  }

  // Kullanıcı yoksa veya admin yetkisi yoksa
  const hasAccess = userRole === 'admin' || userRole === 'editor' || userRole === 'moderator';
  if (!user || !hasAccess) {
    return <UnauthorizedScreen onBack={onBack} />;
  }

  // Admin panelini göster
  return <AdminPanel onBack={onBack} user={user} />;
}