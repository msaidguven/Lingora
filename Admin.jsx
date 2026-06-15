import { useState } from "react";
import { supabase } from "./config.js";

const ADMIN_PASSWORD = "123456";

const EXAMPLE_JSON = `[
  {
    "word": "happy",
    "meaning": "mutlu",
    "example": "She felt very happy today.",
    "example_tr": "Bugün çok mutlu hissetti.",
    "level": "A1",
    "type": "word",
    "part_of_speech": ["adjective"],
    "category": ["daily", "emotion"],
    "difficulty": 1,
    "synonyms": ["joyful", "cheerful"],
    "antonyms": ["sad", "unhappy"]
  }
]`;

const PROMPT_TEXT = `Aşağıdaki kelimeleri analiz et. SADECE JSON array döndür, başka hiçbir şey yazma.

[
  {
    "word": "kelime",
    "meaning": "türkçe anlam",
    "example": "İngilizce örnek cümle",
    "example_tr": "Türkçe çevirisi",
    "level": "A1|A2|B1|B2",
    "type": "word|phrase",
    "part_of_speech": ["noun","verb","adjective","adverb"],
    "category": ["daily","business","travel","food","emotion","health","technology","education","social"],
    "difficulty": 1,
    "synonyms": ["eş1","eş2"],
    "antonyms": ["zıt1","zıt2"]
  }
]

Kelimeler: [KELİMELERİ BURAYA YAZ]`;

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// ── GİRİŞ EKRANI ─────────────────────────────────────────────────────────────
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
    <div style={{ minHeight: "100vh", background: "#0f0f1a", color: "#e2e8f0", fontFamily: "'Inter', system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 360 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🔒</div>
          <div style={{ fontSize: 11, letterSpacing: 3, color: "#6366f1", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>WordFlow</div>
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
              background: "#1a1a2e", border: `1.5px solid ${error ? "#ef4444" : "#1e293b"}`,
              borderRadius: 12, padding: "14px 16px", color: "#e2e8f0",
              fontSize: 15, outline: "none", fontFamily: "inherit",
            }}
          />
          {error && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 6 }}>⚠️ Şifre yanlış</div>}
        </div>
        <button onClick={handleSubmit} style={{ width: "100%", padding: 14, borderRadius: 12, border: "none", background: "#6366f1", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
          Giriş Yap →
        </button>
      </div>
    </div>
  );
}

// ── ADMIN PANELİ ─────────────────────────────────────────────────────────────
function AdminPanel({ onLogout }) {
  const [jsonInput, setJsonInput] = useState("");
  const [parsed, setParsed] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [status, setStatus] = useState(null);
  const [results, setResults] = useState([]);
  const [showExample, setShowExample] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleParse = () => {
    setParseError(null);
    setParsed(null);
    try {
      const data = JSON.parse(jsonInput.trim());
      if (!Array.isArray(data)) throw new Error("JSON bir array olmalı: [ ... ]");
      if (data.length === 0) throw new Error("Array boş.");
      setParsed(data);
    } catch (e) {
      setParseError(e.message);
    }
  };

  const handleInsert = async () => {
    if (!parsed) return;
    setStatus("loading");
    setResults([]);
    const resultList = [];
    for (const item of parsed) {
      try {
        const { error } = await supabase.from("en_words").insert({
          word: item.word,
          meaning: item.meaning,
          example: item.example || null,
          example_tr: item.example_tr || null,
          level: item.level || null,
          type: item.type || "word",
          part_of_speech: item.part_of_speech || [],
          category: item.category || [],
          difficulty: item.difficulty || null,
          synonyms: item.synonyms || [],
          antonyms: item.antonyms || [],
        });
        if (error) throw error;
        resultList.push({ word: item.word, ok: true });
      } catch (e) {
        resultList.push({ word: item.word, ok: false, error: e.message });
      }
    }
    setResults(resultList);
    setStatus(resultList.every(r => r.ok) ? "success" : "error");
  };

  const handleReset = () => {
    setJsonInput("");
    setParsed(null);
    setParseError(null);
    setStatus(null);
    setResults([]);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(PROMPT_TEXT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const successCount = results.filter(r => r.ok).length;
  const failCount = results.filter(r => !r.ok).length;

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f1a", color: "#e2e8f0", fontFamily: "'Inter', system-ui, sans-serif", maxWidth: 560, margin: "0 auto", padding: "28px 20px 48px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 3, color: "#6366f1", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>WordFlow</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>Admin — Kelime Ekle</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>JSON formatında toplu kelime ekle</div>
        </div>
        <button onClick={onLogout} style={{ background: "#1e293b", border: "none", borderRadius: 8, padding: "6px 12px", color: "#64748b", fontSize: 12, cursor: "pointer" }}>
          Çıkış
        </button>
      </div>

      {/* Prompt kutusu */}
      <div style={{ background: "#1a1a2e", borderRadius: 14, padding: 16, marginBottom: 20, border: "1px solid #1e293b" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>🤖 Yapay Zeka Promptu</div>
          <button onClick={() => setShowExample(e => !e)} style={{ background: "none", border: "1px solid #1e293b", borderRadius: 8, color: "#64748b", fontSize: 11, padding: "4px 10px", cursor: "pointer" }}>
            {showExample ? "Gizle" : "Örnek JSON"}
          </button>
        </div>
        <div style={{ background: "#0f0f1a", borderRadius: 10, padding: 14, fontSize: 12, color: "#94a3b8", lineHeight: 1.7, fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {PROMPT_TEXT}
        </div>
        <button onClick={handleCopy} style={{ marginTop: 10, background: copied ? "#0e2d1f" : "#1e293b", border: "none", borderRadius: 8, color: copied ? "#10b981" : "#94a3b8", fontSize: 11, padding: "6px 12px", cursor: "pointer", transition: "all 0.2s" }}>
          {copied ? "✓ Kopyalandı!" : "📋 Promptu Kopyala"}
        </button>
      </div>

      {showExample && (
        <div style={{ background: "#1a1a2e", borderRadius: 14, padding: 16, marginBottom: 20, border: "1px solid #1e293b" }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: "#64748b" }}>Örnek JSON</div>
          <pre style={{ fontSize: 11, color: "#94a3b8", margin: 0, overflowX: "auto", lineHeight: 1.6 }}>{EXAMPLE_JSON}</pre>
        </div>
      )}

      {/* JSON input */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>JSON Yapıştır</div>
        <textarea
          value={jsonInput}
          onChange={e => { setJsonInput(e.target.value); setParsed(null); setParseError(null); setStatus(null); setResults([]); }}
          placeholder='[ { "word": "...", "meaning": "..." } ]'
          rows={10}
          style={{ width: "100%", boxSizing: "border-box", background: "#1a1a2e", border: `1px solid ${parseError ? "#ef4444" : "#1e293b"}`, borderRadius: 12, padding: 14, color: "#e2e8f0", fontSize: 12, fontFamily: "monospace", lineHeight: 1.6, resize: "vertical", outline: "none" }}
        />
        {parseError && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 6 }}>⚠️ {parseError}</div>}
      </div>

      {!parsed && !status && (
        <button onClick={handleParse} disabled={!jsonInput.trim()} style={{ width: "100%", padding: 14, borderRadius: 12, border: "none", background: jsonInput.trim() ? "#6366f1" : "#1e1e30", color: jsonInput.trim() ? "#fff" : "#475569", fontWeight: 700, fontSize: 15, cursor: jsonInput.trim() ? "pointer" : "not-allowed" }}>
          JSON Kontrol Et →
        </button>
      )}

      {parsed && !status && (
        <>
          <div style={{ background: "#0e2d1f", border: "1px solid #10b981", borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#10b981", marginBottom: 10 }}>✓ {parsed.length} kelime hazır</div>
            {parsed.map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, padding: "6px 0", borderBottom: "1px solid #0f2d1a" }}>
                <div>
                  <span style={{ fontWeight: 700 }}>{item.word}</span>
                  <span style={{ color: "#64748b", marginLeft: 8 }}>{item.meaning}</span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#10b981", background: "#10b98122", padding: "2px 6px", borderRadius: 5 }}>{item.level}</span>
                  <span style={{ fontSize: 10, color: "#475569", background: "#1e293b", padding: "2px 6px", borderRadius: 5 }}>{item.difficulty}/5</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleReset} style={{ flex: 1, padding: 14, borderRadius: 12, border: "1px solid #1e293b", background: "#1a1a2e", color: "#64748b", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>İptal</button>
            <button onClick={handleInsert} style={{ flex: 2, padding: 14, borderRadius: 12, border: "none", background: "#6366f1", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              Supabase'e Ekle ({parsed.length} kelime)
            </button>
          </div>
        </>
      )}

      {status === "loading" && (
        <div style={{ textAlign: "center", padding: "32px 0", color: "#64748b" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <div style={{ fontSize: 14 }}>Kelimeler ekleniyor...</div>
        </div>
      )}

      {results.length > 0 && status !== "loading" && (
        <>
          <div style={{ background: failCount === 0 ? "#0e2d1f" : "#2d1a0e", border: `1px solid ${failCount === 0 ? "#10b981" : "#f59e0b"}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: failCount === 0 ? "#10b981" : "#f59e0b", marginBottom: 10 }}>
              {failCount === 0 ? `✓ ${successCount} kelime başarıyla eklendi!` : `${successCount} eklendi, ${failCount} hata`}
            </div>
            {results.map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "5px 0", borderBottom: "1px solid #0f0f1a" }}>
                <span style={{ fontWeight: 600 }}>{r.word}</span>
                {r.ok ? <span style={{ color: "#10b981" }}>✓ Eklendi</span> : <span style={{ color: "#ef4444" }}>✗ {r.error}</span>}
              </div>
            ))}
          </div>
          <button onClick={handleReset} style={{ width: "100%", padding: 14, borderRadius: 12, border: "none", background: "#6366f1", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
            Yeni Kelimeler Ekle
          </button>
        </>
      )}
    </div>
  );
}

// ── EXPORT ────────────────────────────────────────────────────────────────────
export default function Admin() {
  const [loggedIn, setLoggedIn] = useState(false);
  if (!loggedIn) return <LoginScreen onLogin={() => setLoggedIn(true)} />;
  return <AdminPanel onLogout={() => setLoggedIn(false)} />;
}
