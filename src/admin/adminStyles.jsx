// admin/adminStyles.js

// ============================
// ORTAK RENK VE TEMA DEĞİŞKENLERİ
// ============================
export const colors = {
  background: "#0f0f1a",
  surface: "#1a1a2e",
  surfaceLight: "#1e293b",
  surfaceDark: "#0f0f1a",
  text: "#e2e8f0",
  textSecondary: "#64748b",
  textMuted: "#475569",
  primary: "#6366f1",
  primaryLight: "#6366f122",
  success: "#10b981",
  successBg: "#0e2d1f",
  error: "#ef4444",
  errorBg: "#2d1a0e",
  border: "#1e293b",
};

// ============================
// ORTAK STILLER
// ============================
export const styles = {
  pageContainer: {
    minHeight: "100vh",
    background: colors.background,
    color: colors.text,
    fontFamily: "'Inter', system-ui, sans-serif",
    padding: "28px 20px 48px",
  },

  container: {
    maxWidth: 1000,
    margin: "0 auto",
  },

  smallContainer: {
    maxWidth: 560,
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },

  headerTitle: {
    fontSize: 10,
    letterSpacing: 3,
    color: colors.primary,
    fontWeight: 700,
    textTransform: "uppercase",
    marginBottom: 4,
  },

  headerMainTitle: {
    fontSize: 22,
    fontWeight: 800,
  },

  headerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },

  backButton: {
    background: colors.surfaceLight,
    border: "none",
    borderRadius: 8,
    padding: "8px 16px",
    color: colors.textSecondary,
    fontSize: 13,
    cursor: "pointer",
  },

  logoutButton: {
    background: colors.surfaceLight,
    border: "none",
    borderRadius: 8,
    padding: "6px 12px",
    color: colors.textSecondary,
    fontSize: 12,
    cursor: "pointer",
  },

  tabsContainer: {
    display: "flex",
    gap: 4,
    background: colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    border: `1px solid ${colors.border}`,
  },

  tabButton: (isActive) => ({
    flex: 1,
    padding: "10px",
    borderRadius: 8,
    border: "none",
    background: isActive ? colors.primary : "transparent",
    color: isActive ? "#fff" : colors.textSecondary,
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
    transition: "all 0.2s",
  }),

  card: {
    background: colors.surface,
    borderRadius: 14,
    padding: 24,
    border: `1px solid ${colors.border}`,
    marginBottom: 20,
  },

  cardSmall: {
    background: colors.surface,
    borderRadius: 14,
    padding: 16,
    border: `1px solid ${colors.border}`,
    marginBottom: 20,
  },

  cardCompact: {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: 10,
    padding: "14px",
    marginBottom: 20,
  },

  input: (isEditing = true) => ({
    width: "100%",
    boxSizing: "border-box",
    background: isEditing ? colors.surfaceDark : colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    padding: "8px 12px",
    color: colors.text,
    fontSize: 14,
    outline: "none",
    fontFamily: "inherit",
    opacity: isEditing ? 1 : 0.7,
  }),

  textarea: {
    width: "100%",
    boxSizing: "border-box",
    background: colors.surfaceDark,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    padding: "12px",
    color: colors.text,
    fontSize: 12,
    fontFamily: "monospace",
    lineHeight: 1.6,
    resize: "vertical",
    outline: "none",
  },

  message: (type) => ({
    marginBottom: 16,
    padding: 12,
    borderRadius: 10,
    background: type === "error" ? colors.errorBg : type === "success" ? colors.successBg : colors.surfaceDark,
    border: `1px solid ${type === "error" ? colors.error : type === "success" ? colors.success : colors.border}`,
    color: type === "error" ? colors.error : type === "success" ? colors.success : colors.textSecondary,
    fontSize: 14,
  }),

  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
  },

  menuButton: {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: 12,
    padding: "20px",
    color: colors.text,
    cursor: "pointer",
    textAlign: "center",
    transition: "all 0.2s",
  },

  recentItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 0",
    borderBottom: `1px solid ${colors.surfaceDark}`,
    fontSize: 13,
  },

  label: {
    fontSize: 11,
    color: colors.textSecondary,
    display: "block",
    marginBottom: 4,
  },

  badge: (color = colors.primary, bg = colors.primaryLight) => ({
    fontSize: 10,
    background: bg,
    color: color,
    padding: "2px 10px",
    borderRadius: 4,
    fontWeight: 600,
  }),

  resultItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "4px 0",
    borderBottom: `1px solid ${colors.surfaceDark}`,
    fontSize: 13,
  },

  promptBox: {
    background: colors.surfaceDark,
    borderRadius: 10,
    padding: 14,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 1.7,
    fontFamily: "monospace",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    maxHeight: 400,
    overflowY: "auto",
    border: `1px solid ${colors.border}`,
  },

  jsonDisplay: {
    background: colors.surfaceDark,
    padding: 12,
    borderRadius: 6,
    fontSize: 11,
    color: colors.textSecondary,
    margin: 0,
    overflowX: "auto",
    lineHeight: 1.5,
    border: `1px solid ${colors.border}`,
    maxHeight: 300,
    overflowY: "auto",
  },

  primaryButton: (disabled = false) => ({
    flex: 1,
    padding: "14px",
    borderRadius: 12,
    border: "none",
    background: disabled ? "#1e1e30" : colors.primary,
    color: disabled ? colors.textMuted : "#fff",
    fontWeight: 700,
    fontSize: 14,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.2s",
  }),

  successButton: (disabled = false) => ({
    flex: 2,
    padding: "14px",
    borderRadius: 12,
    border: "none",
    background: disabled ? "#1e1e30" : colors.success,
    color: disabled ? colors.textMuted : "#fff",
    fontWeight: 700,
    fontSize: 14,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.2s",
  }),

  dangerButton: (disabled = false) => ({
    padding: "6px 16px",
    borderRadius: 8,
    border: "none",
    background: colors.error,
    color: "#fff",
    fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
  }),

  editButton: (isEditing = false) => ({
    padding: "6px 14px",
    borderRadius: 8,
    border: `1px solid ${isEditing ? colors.primary : colors.primary}`,
    background: isEditing ? colors.primary : "transparent",
    color: isEditing ? "#fff" : colors.primary,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
  }),

  listItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderBottom: `1px solid ${colors.surfaceDark}`,
    cursor: "pointer",
    transition: "all 0.15s",
    borderRadius: 6,
    margin: "2px 0",
  },

  listItemHover: {
    background: colors.surfaceDark,
  },

  searchContainer: {
    position: "relative",
  },

  searchIcon: {
    position: "absolute",
    left: 14,
    top: "50%",
    transform: "translateY(-50%)",
    color: colors.textSecondary,
    fontSize: 18,
  },

  searchInput: {
    width: "100%",
    boxSizing: "border-box",
    background: colors.surfaceDark,
    border: `1px solid ${colors.border}`,
    borderRadius: 10,
    padding: "12px 16px",
    paddingLeft: 42,
    color: colors.text,
    fontSize: 15,
    outline: "none",
    fontFamily: "inherit",
  },

  clearButton: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    color: colors.textSecondary,
    cursor: "pointer",
    fontSize: 16,
  },
};

// ============================
// ORTAK BİLEŞENLER
// ============================

export function PageHeader({ title, subtitle, onBack }) {
  return (
    <div style={styles.header}>
      <div>
        <div style={styles.headerTitle}>WordFlow</div>
        <div style={styles.headerMainTitle}>{title}</div>
        {subtitle && <div style={styles.headerSubtitle}>{subtitle}</div>}
      </div>
      {onBack && (
        <button onClick={onBack} style={styles.backButton}>
          ← Ana Sayfaya Dön
        </button>
      )}
    </div>
  );
}

export function Tabs({ tabs, activeTab, onTabChange }) {
  return (
    <div style={styles.tabsContainer}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={styles.tabButton(activeTab === tab.id)}
        >
          {tab.icon} {tab.label}
        </button>
      ))}
    </div>
  );
}

export function Message({ type, text }) {
  if (!text) return null;
  return <div style={styles.message(type)}>{text}</div>;
}

export function Card({ children, small = false, compact = false }) {
  let style = styles.card;
  if (small) style = styles.cardSmall;
  if (compact) style = styles.cardCompact;
  return <div style={style}>{children}</div>;
}

export function Input({ label, disabled, ...props }) {
  return (
    <div>
      {label && <label style={styles.label}>{label}</label>}
      <input style={styles.input(!disabled)} disabled={disabled} {...props} />
    </div>
  );
}

export function TextArea({ label, ...props }) {
  return (
    <div>
      {label && <label style={styles.label}>{label}</label>}
      <textarea style={styles.textarea} {...props} />
    </div>
  );
}

export function Badge({ text, color, bg }) {
  return <span style={styles.badge(color, bg)}>{text}</span>;
}

export function JsonDisplay({ data }) {
  const prettyJson = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  return <pre style={styles.jsonDisplay}>{prettyJson}</pre>;
}

export function SearchInput({ value, onChange, placeholder, loading, onClear }) {
  return (
    <div style={styles.searchContainer}>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus
        style={styles.searchInput}
      />
      <span style={styles.searchIcon}>{loading ? "⏳" : "🔍"}</span>
      {value && (
        <button onClick={onClear} style={styles.clearButton}>
          ✕
        </button>
      )}
    </div>
  );
}