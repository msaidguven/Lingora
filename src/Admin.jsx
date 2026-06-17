// Admin.jsx
import { useState, useEffect } from "react";
import { supabase } from "./config.js";

const ADMIN_PASSWORD = "123456";

const EXAMPLE_JSON = `[
  {
    "word": "happy",
    "meaning": "mutlu",
    "level": "A1",
    "type": "word",
    "part_of_speech": ["adjective"],
    "category": ["daily", "emotion"],
    "difficulty": 1,
    "synonyms": ["joyful", "cheerful"],
    "antonyms": ["sad", "unhappy"],
    "examples": [
      {
        "en": "She felt very happy today.",
        "tr": "Bugün çok mutlu hissetti."
      },
      {
        "en": "I am happy to see you.",
        "tr": "Seni gördüğüme mutluyum."
      },
      {
        "en": "They live a happy life.",
        "tr": "Mutlu bir hayat yaşıyorlar."
      },
      {
        "en": "He has a happy smile.",
        "tr": "Mutlu bir gülümsemesi var."
      },
      {
        "en": "We are happy together.",
        "tr": "Birlikte mutluyuz."
      }
    ]
  }
]`;

const PROMPT_TEXT = `

Aşağıdaki kelimeleri analiz et. SADECE JSON array döndür, başka hiçbir şey yazma.

Her kelime için:
- 5 adet örnek cümle üret
- Bu cümleler kelimenin seviyesine (A1, A2, B1, B2) uygun olsun
- A1 ise tamamen A1 seviyesinde 5 cümle
- A2 ise A2 seviyesinde 5 cümle vb.
- Her cümle için Türkçe çeviri de ekle


Kelimeler: [Aşağıda verildi]

kelimenin diğer anlamlarını virgül ile ayır. 
örnek: "run" kelimesi için: "koşmak, çalıştırmak, işletmek"
Tüm kelimeler A1 seviyesindedir, bunu dikkate al.

[
  {
    "word": "kelime",
    "meaning": "türkçe anlam",
    "level": "A1",
    "type": "word|phrase",
    "part_of_speech": ["noun", "verb", "adjective", "adverb"],
    "category": ["daily", "business", "travel", "food", "emotion", "health", "technology", "education", "social"],
    "difficulty": 1,
    "synonyms": ["eş1", "eş2"],
    "antonyms": ["zıt1", "zıt2"],
    "examples": [
      {
        "en": "English sentence 1",
        "tr": "Türkçe çeviri 1"
      },
      {
        "en": "English sentence 2",
        "tr": "Türkçe çeviri 2"
      },
      {
        "en": "English sentence 3",
        "tr": "Türkçe çeviri 3"
      },
      {
        "en": "English sentence 4",
        "tr": "Türkçe çeviri 4"
      },
      {
        "en": "English sentence 5",
        "tr": "Türkçe çeviri 5"
      }
    ]
  }
]

`;

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

// ============================
// KELİME DÜZENLEME BİLEŞENİ
// ============================
function WordEditor({ onBack }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedWord, setSelectedWord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState(null);
  const [newExample, setNewExample] = useState({ en: "", tr: "" });

  const [formData, setFormData] = useState({
    word: "",
    meaning: "",
    level: "A1",
    type: "word",
    part_of_speech: [],
    category: [],
    difficulty: 1,
    synonyms: [],
    antonyms: [],
    examples: [],
  });

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setMessage({ type: "error", text: "Lütfen bir kelime girin" });
      return;
    }

    setLoading(true);
    setMessage(null);
    setSelectedWord(null);

    try {
      const { data, error } = await supabase
        .from("en_words")
        .select(`
          *,
          en_example_sentences (
            id,
            sentence_en,
            sentence_tr,
            difficulty,
            order_index,
            is_approved
          )
        `)
        .or(`word.ilike.%${searchTerm}%, meaning.ilike.%${searchTerm}%`)
        .order("word")
        .limit(20);

      if (error) throw error;

      setSearchResults(data || []);
      if (data.length === 0) {
        setMessage({ type: "info", text: "Kelime bulunamadı" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Arama hatası: " + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const selectWord = (word) => {
    setSelectedWord(word);
    setFormData({
      word: word.word,
      meaning: word.meaning || "",
      level: word.level || "A1",
      type: word.type || "word",
      part_of_speech: word.part_of_speech || [],
      category: word.category || [],
      difficulty: word.difficulty || 1,
      synonyms: word.synonyms || [],
      antonyms: word.antonyms || [],
      examples: word.en_example_sentences || [],
    });
    setEditing(false);
    setMessage(null);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field, value) => {
    const arr = value.split(",").map(s => s.trim()).filter(s => s);
    setFormData(prev => ({ ...prev, [field]: arr }));
  };

  const handleSave = async () => {
    if (!selectedWord) return;

    setLoading(true);
    setMessage(null);

    try {
      const { error: wordError } = await supabase
        .from("en_words")
        .update({
          word: formData.word,
          meaning: formData.meaning,
          level: formData.level,
          type: formData.type,
          part_of_speech: formData.part_of_speech,
          category: formData.category,
          difficulty: formData.difficulty,
          synonyms: formData.synonyms,
          antonyms: formData.antonyms,
        })
        .eq("id", selectedWord.id);

      if (wordError) throw wordError;

      setMessage({ type: "success", text: "✅ Kelime başarıyla güncellendi!" });
      setEditing(false);

      const updatedWord = { ...selectedWord, ...formData };
      setSelectedWord(updatedWord);

      setSearchResults(prev => 
        prev.map(w => w.id === updatedWord.id ? updatedWord : w)
      );

    } catch (error) {
      setMessage({ type: "error", text: "Kaydetme hatası: " + error.message });
    } finally {
      setLoading(false);
    }
  };

  const addExample = async () => {
    if (!selectedWord) return;
    if (!newExample.en.trim() || !newExample.tr.trim()) {
      setMessage({ type: "error", text: "Cümle ve çevirisi zorunlu" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("en_example_sentences")
        .insert({
          word_id: selectedWord.id,
          sentence_en: newExample.en,
          sentence_tr: newExample.tr,
          difficulty: formData.difficulty,
          order_index: formData.examples.length,
          source: "manual",
          is_approved: true,
        })
        .select();

      if (error) throw error;

      const updatedExamples = [...formData.examples, data[0]];
      setFormData(prev => ({ ...prev, examples: updatedExamples }));
      setNewExample({ en: "", tr: "" });
      setMessage({ type: "success", text: "✅ Cümle eklendi!" });

    } catch (error) {
      setMessage({ type: "error", text: "Cümle eklenemedi: " + error.message });
    } finally {
      setLoading(false);
    }
  };

  const deleteExample = async (exampleId) => {
    if (!window.confirm("Bu cümleyi silmek istediğinize emin misiniz?")) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("en_example_sentences")
        .delete()
        .eq("id", exampleId);

      if (error) throw error;

      const updatedExamples = formData.examples.filter(e => e.id !== exampleId);
      setFormData(prev => ({ ...prev, examples: updatedExamples }));
      setMessage({ type: "success", text: "✅ Cümle silindi!" });

    } catch (error) {
      setMessage({ type: "error", text: "Cümle silinemedi: " + error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 3, color: "#6366f1", fontWeight: 700, textTransform: "uppercase" }}>WordFlow</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>✏️ Kelime Düzenle</div>
        </div>
        <button 
          onClick={onBack} 
          style={{ 
            background: "#1e293b", 
            border: "none", 
            borderRadius: 8, 
            padding: "8px 16px", 
            color: "#94a3b8", 
            fontSize: 13, 
            cursor: "pointer" 
          }}
        >
          ← Ana Sayfaya Dön
        </button>
      </div>

      <div style={{ 
        background: "#1a1a2e", 
        borderRadius: 14, 
        padding: 20, 
        border: "1px solid #1e293b",
        marginBottom: 24
      }}>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Kelime veya anlam ara..."
            style={{
              flex: 1,
              background: "#0f0f1a",
              border: "1px solid #1e293b",
              borderRadius: 10,
              padding: "10px 14px",
              color: "#e2e8f0",
              fontSize: 14,
              outline: "none",
              fontFamily: "inherit"
            }}
          />
          <button 
            onClick={handleSearch} 
            disabled={loading}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              border: "none",
              background: "#6366f1",
              color: "#fff",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "🔍" : "Ara"}
          </button>
        </div>

        {message && (
          <div style={{ 
            marginTop: 12, 
            padding: 10, 
            borderRadius: 8, 
            background: message.type === "error" ? "#2d1a0e" : message.type === "success" ? "#0e2d1f" : "#1a1a2e",
            border: `1px solid ${message.type === "error" ? "#ef4444" : message.type === "success" ? "#10b981" : "#1e293b"}`,
            color: message.type === "error" ? "#ef4444" : message.type === "success" ? "#10b981" : "#94a3b8",
            fontSize: 13
          }}>
            {message.text}
          </div>
        )}
      </div>

      {searchResults.length > 0 && !selectedWord && (
        <div style={{ 
          background: "#1a1a2e", 
          borderRadius: 14, 
          padding: 16, 
          border: "1px solid #1e293b",
          marginBottom: 24
        }}>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>
            {searchResults.length} kelime bulundu
          </div>
          {searchResults.map((word) => (
            <div 
              key={word.id}
              onClick={() => selectWord(word)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 14px",
                borderBottom: "1px solid #0f0f1a",
                cursor: "pointer",
                transition: "all 0.2s",
                borderRadius: 6,
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#0f0f1a"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <div>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{word.word}</span>
                <span style={{ color: "#64748b", marginLeft: 10, fontSize: 13 }}>{word.meaning}</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ fontSize: 10, background: "#6366f122", color: "#6366f1", padding: "2px 8px", borderRadius: 4 }}>
                  {word.level}
                </span>
                <span style={{ fontSize: 10, background: "#1e293b", color: "#64748b", padding: "2px 8px", borderRadius: 4 }}>
                  ⭐ {word.difficulty}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedWord && (
        <div style={{ 
          background: "#1a1a2e", 
          borderRadius: 14, 
          padding: 24, 
          border: "1px solid #1e293b"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <span style={{ fontSize: 18, fontWeight: 800 }}>{selectedWord.word}</span>
              <span style={{ fontSize: 14, color: "#64748b", marginLeft: 12 }}>#{selectedWord.id.slice(0, 8)}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button 
                onClick={() => setEditing(!editing)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: "1px solid #6366f1",
                  background: editing ? "#6366f1" : "transparent",
                  color: editing ? "#fff" : "#6366f1",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600
                }}
              >
                {editing ? "Düzenlemeyi Kapat" : "✏️ Düzenle"}
              </button>
              {editing && (
                <button 
                  onClick={handleSave}
                  disabled={loading}
                  style={{
                    padding: "6px 20px",
                    borderRadius: 8,
                    border: "none",
                    background: "#10b981",
                    color: "#fff",
                    fontWeight: 700,
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  💾 Kaydet
                </button>
              )}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}>Kelime</label>
              <input
                value={formData.word}
                onChange={(e) => handleFormChange("word", e.target.value)}
                disabled={!editing}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: editing ? "#0f0f1a" : "#1a1a2e",
                  border: "1px solid #1e293b",
                  borderRadius: 8,
                  padding: "8px 12px",
                  color: "#e2e8f0",
                  fontSize: 14,
                  outline: "none",
                  fontFamily: "inherit",
                  opacity: editing ? 1 : 0.7
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}>Anlam</label>
              <input
                value={formData.meaning}
                onChange={(e) => handleFormChange("meaning", e.target.value)}
                disabled={!editing}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: editing ? "#0f0f1a" : "#1a1a2e",
                  border: "1px solid #1e293b",
                  borderRadius: 8,
                  padding: "8px 12px",
                  color: "#e2e8f0",
                  fontSize: 14,
                  outline: "none",
                  fontFamily: "inherit",
                  opacity: editing ? 1 : 0.7
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}>Seviye</label>
              <select
                value={formData.level}
                onChange={(e) => handleFormChange("level", e.target.value)}
                disabled={!editing}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: editing ? "#0f0f1a" : "#1a1a2e",
                  border: "1px solid #1e293b",
                  borderRadius: 8,
                  padding: "8px 12px",
                  color: "#e2e8f0",
                  fontSize: 14,
                  outline: "none",
                  fontFamily: "inherit",
                  opacity: editing ? 1 : 0.7
                }}
              >
                <option value="A1">A1</option>
                <option value="A2">A2</option>
                <option value="B1">B1</option>
                <option value="B2">B2</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}>Zorluk (1-5)</label>
              <input
                type="number"
                min={1}
                max={5}
                value={formData.difficulty}
                onChange={(e) => handleFormChange("difficulty", Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))}
                disabled={!editing}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: editing ? "#0f0f1a" : "#1a1a2e",
                  border: "1px solid #1e293b",
                  borderRadius: 8,
                  padding: "8px 12px",
                  color: "#e2e8f0",
                  fontSize: 14,
                  outline: "none",
                  fontFamily: "inherit",
                  opacity: editing ? 1 : 0.7
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}>
                Tür (virgülle ayır)
              </label>
              <input
                value={formData.part_of_speech.join(", ")}
                onChange={(e) => handleArrayChange("part_of_speech", e.target.value)}
                disabled={!editing}
                placeholder="noun, verb, adjective"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: editing ? "#0f0f1a" : "#1a1a2e",
                  border: "1px solid #1e293b",
                  borderRadius: 8,
                  padding: "8px 12px",
                  color: "#e2e8f0",
                  fontSize: 13,
                  outline: "none",
                  fontFamily: "inherit",
                  opacity: editing ? 1 : 0.7
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}>
                Kategori (virgülle ayır)
              </label>
              <input
                value={formData.category.join(", ")}
                onChange={(e) => handleArrayChange("category", e.target.value)}
                disabled={!editing}
                placeholder="daily, business, travel"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: editing ? "#0f0f1a" : "#1a1a2e",
                  border: "1px solid #1e293b",
                  borderRadius: 8,
                  padding: "8px 12px",
                  color: "#e2e8f0",
                  fontSize: 13,
                  outline: "none",
                  fontFamily: "inherit",
                  opacity: editing ? 1 : 0.7
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}>
                Eş Anlamlılar (virgülle ayır)
              </label>
              <input
                value={formData.synonyms.join(", ")}
                onChange={(e) => handleArrayChange("synonyms", e.target.value)}
                disabled={!editing}
                placeholder="joyful, cheerful"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: editing ? "#0f0f1a" : "#1a1a2e",
                  border: "1px solid #1e293b",
                  borderRadius: 8,
                  padding: "8px 12px",
                  color: "#e2e8f0",
                  fontSize: 13,
                  outline: "none",
                  fontFamily: "inherit",
                  opacity: editing ? 1 : 0.7
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}>
                Zıt Anlamlılar (virgülle ayır)
              </label>
              <input
                value={formData.antonyms.join(", ")}
                onChange={(e) => handleArrayChange("antonyms", e.target.value)}
                disabled={!editing}
                placeholder="sad, unhappy"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: editing ? "#0f0f1a" : "#1a1a2e",
                  border: "1px solid #1e293b",
                  borderRadius: 8,
                  padding: "8px 12px",
                  color: "#e2e8f0",
                  fontSize: 13,
                  outline: "none",
                  fontFamily: "inherit",
                  opacity: editing ? 1 : 0.7
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: 24, borderTop: "1px solid #1e293b", paddingTop: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>📝 Örnek Cümleler ({formData.examples.length})</div>
            
            {editing && (
              <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                <input
                  value={newExample.en}
                  onChange={(e) => setNewExample(prev => ({ ...prev, en: e.target.value }))}
                  placeholder="İngilizce cümle..."
                  style={{
                    flex: 1,
                    background: "#0f0f1a",
                    border: "1px solid #1e293b",
                    borderRadius: 8,
                    padding: "8px 12px",
                    color: "#e2e8f0",
                    fontSize: 13,
                    outline: "none",
                    fontFamily: "inherit"
                  }}
                />
                <input
                  value={newExample.tr}
                  onChange={(e) => setNewExample(prev => ({ ...prev, tr: e.target.value }))}
                  placeholder="Türkçe çeviri..."
                  style={{
                    flex: 1,
                    background: "#0f0f1a",
                    border: "1px solid #1e293b",
                    borderRadius: 8,
                    padding: "8px 12px",
                    color: "#e2e8f0",
                    fontSize: 13,
                    outline: "none",
                    fontFamily: "inherit"
                  }}
                />
                <button
                  onClick={addExample}
                  disabled={loading}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: "none",
                    background: "#6366f1",
                    color: "#fff",
                    fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.6 : 1,
                    whiteSpace: "nowrap"
                  }}
                >
                  ➕ Ekle
                </button>
              </div>
            )}

            <div style={{ maxHeight: 300, overflowY: "auto" }}>
              {formData.examples.map((example, index) => (
                <div 
                  key={example.id || index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                    background: index % 2 === 0 ? "#0f0f1a" : "transparent",
                    borderRadius: 6,
                    marginBottom: 4
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: "#e2e8f0" }}>{example.sentence_en}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{example.sentence_tr}</div>
                  </div>
                  {editing && (
                    <button
                      onClick={() => deleteExample(example.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#ef4444",
                        cursor: "pointer",
                        fontSize: 16,
                        padding: "4px 8px"
                      }}
                      title="Sil"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {formData.examples.length === 0 && (
                <div style={{ fontSize: 13, color: "#64748b", padding: "12px 0", textAlign: "center" }}>
                  Henüz örnek cümle yok
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================
// ANA ADMIN PANELİ
// ============================
function AdminPanel({ onLogout }) {
  const [currentPage, setCurrentPage] = useState("add");
  const [jsonInput, setJsonInput] = useState("");
  const [parsed, setParsed] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [status, setStatus] = useState(null);
  const [results, setResults] = useState([]);
  const [showExample, setShowExample] = useState(false);
  const [copied, setCopied] = useState(false);
  const [recentWords, setRecentWords] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  const fetchRecentWords = async () => {
    setLoadingRecent(true);
    try {
      const { data, error } = await supabase
        .from("en_words")
        .select("word, meaning, level, created_at")
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      setRecentWords(data || []);
    } catch (error) {
      console.error("Son kelimeler çekilirken hata:", error);
    } finally {
      setLoadingRecent(false);
    }
  };

  useEffect(() => {
    fetchRecentWords();
  }, []);

  useEffect(() => {
    if (results.length > 0 && results.some(r => r.ok && r.status === "eklendi")) {
      fetchRecentWords();
    }
  }, [results]);

  const handleParse = () => {
    setParseError(null);
    setParsed(null);
    try {
      const data = JSON.parse(jsonInput.trim());
      if (!Array.isArray(data)) throw new Error("JSON bir array olmalı: [ ... ]");
      if (data.length === 0) throw new Error("Array boş.");
      
      data.forEach((item, index) => {
        if (!item.examples || !Array.isArray(item.examples) || item.examples.length === 0) {
          throw new Error(`"${item.word}" kelimesi için examples array'i eksik veya boş`);
        }
        item.examples.forEach((example, i) => {
          if (!example.en || !example.tr) {
            throw new Error(`"${item.word}" kelimesinin ${i+1}. örneğinde en veya tr eksik`);
          }
        });
      });
      
      setParsed(data);
    } catch (e) {
      setParseError(e.message);
    }
  };

  const handleInsertWithCheck = async () => {
    if (!parsed) return;
    setStatus("loading");
    setResults([]);
    const resultList = [];
    
    for (const item of parsed) {
      try {
        const { data: existing, error: checkError } = await supabase
          .from("en_words")
          .select("id, word, meaning, level")
          .eq("word", item.word)
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
        }

        let wordData;
        let wordStatus = "hata";
        let addedExampleCount = 0;
        let existingExampleCount = 0;
        let errorExampleCount = 0;

        if (existing) {
          wordData = existing;
          wordStatus = "zaten var";
          
          if (item.examples && Array.isArray(item.examples) && wordData) {
            for (const example of item.examples) {
              const { data: existingExample, error: exampleCheckError } = await supabase
                .from("en_example_sentences")
                .select("id")
                .eq("word_id", wordData.id)
                .eq("sentence_en", example.en)
                .maybeSingle();

              if (exampleCheckError && exampleCheckError.code !== 'PGRST116') {
                console.error("Cümle kontrol hatası:", exampleCheckError);
                errorExampleCount++;
                continue;
              }

              if (!existingExample) {
                const { error: insertExampleError } = await supabase
                  .from("en_example_sentences")
                  .insert({
                    word_id: wordData.id,
                    sentence_en: example.en,
                    sentence_tr: example.tr || null,
                    difficulty: item.difficulty || null,
                    order_index: 0,
                    source: "manual",
                    is_approved: true,
                  });

                if (insertExampleError) {
                  console.error("Cümle eklenemedi:", insertExampleError);
                  errorExampleCount++;
                } else {
                  addedExampleCount++;
                }
              } else {
                existingExampleCount++;
              }
            }
          }
        } else {
          const { data: inserted, error: insertError } = await supabase
            .from("en_words")
            .insert({
              word: item.word,
              meaning: item.meaning,
              level: item.level || null,
              type: item.type || "word",
              part_of_speech: item.part_of_speech || [],
              category: item.category || [],
              difficulty: item.difficulty || null,
              synonyms: item.synonyms || [],
              antonyms: item.antonyms || [],
            })
            .select()
            .single();

          if (insertError) throw insertError;
          wordData = inserted;
          wordStatus = "eklendi";

          if (item.examples && Array.isArray(item.examples) && wordData) {
            for (const example of item.examples) {
              const { error: insertExampleError } = await supabase
                .from("en_example_sentences")
                .insert({
                  word_id: wordData.id,
                  sentence_en: example.en,
                  sentence_tr: example.tr || null,
                  difficulty: item.difficulty || null,
                  order_index: 0,
                  source: "manual",
                  is_approved: true,
                });

              if (insertExampleError) {
                console.error("Cümle eklenemedi:", insertExampleError);
                errorExampleCount++;
              } else {
                addedExampleCount++;
              }
            }
          }
        }

        let exampleStatus = "yok";
        if (addedExampleCount > 0 && existingExampleCount === 0 && errorExampleCount === 0) {
          exampleStatus = `${addedExampleCount} cümle eklendi`;
        } else if (addedExampleCount > 0 && existingExampleCount > 0 && errorExampleCount === 0) {
          exampleStatus = `${addedExampleCount} cümle eklendi, ${existingExampleCount} cümle zaten var`;
        } else if (addedExampleCount === 0 && existingExampleCount > 0 && errorExampleCount === 0) {
          exampleStatus = `${existingExampleCount} cümle zaten var`;
        } else if (addedExampleCount > 0 && errorExampleCount > 0) {
          exampleStatus = `${addedExampleCount} cümle eklendi, ${errorExampleCount} hata`;
        } else if (errorExampleCount > 0) {
          exampleStatus = `${errorExampleCount} cümle hatası`;
        }

        resultList.push({ 
          word: item.word, 
          ok: true, 
          status: wordStatus,
          exampleStatus: exampleStatus,
          addedExampleCount: addedExampleCount,
          existingExampleCount: existingExampleCount,
          errorExampleCount: errorExampleCount
        });
        
      } catch (e) {
        resultList.push({ 
          word: item.word, 
          ok: false, 
          error: e.message,
          exampleStatus: "hata"
        });
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
  const addedCount = results.filter(r => r.status === "eklendi").length;
  const existsCount = results.filter(r => r.status === "zaten var").length;
  const totalAddedExamples = results.reduce((sum, r) => sum + (r.addedExampleCount || 0), 0);
  const totalExistingExamples = results.reduce((sum, r) => sum + (r.existingExampleCount || 0), 0);

  // Eğer düzenleme sayfası gösterilecekse
  if (currentPage === "edit") {
    return (
      <div style={{ minHeight: "100vh", background: "#0f0f1a", color: "#e2e8f0", fontFamily: "'Inter', system-ui, sans-serif", padding: "28px 20px 48px" }}>
        <WordEditor onBack={() => setCurrentPage("add")} />
      </div>
    );
  }

  // Kelime Ekleme Sayfası
  return (
    <div style={{ minHeight: "100vh", background: "#0f0f1a", color: "#e2e8f0", fontFamily: "'Inter', system-ui, sans-serif", maxWidth: 560, margin: "0 auto", padding: "28px 20px 48px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 3, color: "#6366f1", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>WordFlow</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>Admin — Kelime Ekle</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>JSON formatında toplu kelime ekle</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <button 
            onClick={() => setCurrentPage("edit")} 
            style={{ 
              background: "#6366f1", 
              border: "none", 
              borderRadius: 8, 
              padding: "6px 14px", 
              color: "#fff", 
              fontSize: 12, 
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            ✏️ Kelime Düzenle
          </button>
          
          <button onClick={onLogout} style={{ background: "#1e293b", border: "none", borderRadius: 8, padding: "6px 12px", color: "#64748b", fontSize: 12, cursor: "pointer" }}>
            Çıkış
          </button>
          
          <div style={{ 
            background: "#1a1a2e", 
            border: "1px solid #1e293b", 
            borderRadius: 10, 
            padding: "10px 14px",
            minWidth: 180,
            maxWidth: 220,
            width: "100%"
          }}>
            <div style={{ 
              fontSize: 10, 
              letterSpacing: 2, 
              color: "#6366f1", 
              fontWeight: 600, 
              textTransform: "uppercase",
              marginBottom: 6
            }}>
              📚 Son Eklenenler
            </div>
            {loadingRecent ? (
              <div style={{ fontSize: 12, color: "#64748b" }}>Yükleniyor...</div>
            ) : recentWords.length > 0 ? (
              <div>
                {recentWords.map((word, index) => (
                  <div 
                    key={index} 
                    style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center",
                      padding: "4px 0",
                      borderBottom: index < recentWords.length - 1 ? "1px solid #0f0f1a" : "none",
                      fontSize: 12
                    }}
                  >
                    <span style={{ fontWeight: 600, color: "#e2e8f0" }}>{word.word}</span>
                    <span style={{ 
                      fontSize: 9, 
                      color: "#64748b", 
                      background: "#0f0f1a", 
                      padding: "1px 6px", 
                      borderRadius: 4 
                    }}>
                      {word.level || "A1"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: "#64748b" }}>Henüz kelime yok</div>
            )}
          </div>
        </div>
      </div>

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

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>JSON Yapıştır</div>
        <textarea
          value={jsonInput}
          onChange={e => { setJsonInput(e.target.value); setParsed(null); setParseError(null); setStatus(null); setResults([]); }}
          placeholder='[ { "word": "...", "meaning": "...", "examples": [ { "en": "...", "tr": "..." } ] } ]'
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
                  {item.examples && (
                    <span style={{ fontSize: 10, color: "#475569", marginLeft: 8 }}>
                      📝 {item.examples.length} cümle
                    </span>
                  )}
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
            <button onClick={handleInsertWithCheck} style={{ flex: 2, padding: 14, borderRadius: 12, border: "none", background: "#6366f1", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
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
          <div style={{ 
            background: failCount === 0 ? "#0e2d1f" : "#2d1a0e", 
            border: `1px solid ${failCount === 0 ? "#10b981" : "#f59e0b"}`, 
            borderRadius: 12, 
            padding: 14, 
            marginBottom: 14 
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: failCount === 0 ? "#10b981" : "#f59e0b", marginBottom: 10 }}>
              {failCount === 0 ? (
                <>
                  {addedCount > 0 && `✅ ${addedCount} kelime eklendi`}
                  {addedCount > 0 && existsCount > 0 && ", "}
                  {existsCount > 0 && `⏭️ ${existsCount} kelime zaten mevcut`}
                  {addedCount === 0 && existsCount > 0 && `ℹ️ ${existsCount} kelime zaten mevcut`}
                  {(totalAddedExamples > 0 || totalExistingExamples > 0) && (
                    <div style={{ fontSize: 12, fontWeight: 400, marginTop: 4, color: "#94a3b8" }}>
                      {totalAddedExamples > 0 && `📝 ${totalAddedExamples} yeni cümle eklendi`}
                      {totalAddedExamples > 0 && totalExistingExamples > 0 && ", "}
                      {totalExistingExamples > 0 && `⏭️ ${totalExistingExamples} cümle zaten mevcut`}
                    </div>
                  )}
                </>
              ) : (
                `${successCount} başarılı, ${failCount} hata`
              )}
            </div>
            {results.map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, padding: "5px 0", borderBottom: "1px solid #0f0f1a" }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{r.word}</span>
                  {r.exampleStatus && r.exampleStatus !== "yok" && (
                    <span style={{ 
                      fontSize: 10, 
                      color: r.exampleStatus.includes("eklendi") ? "#10b981" : r.exampleStatus.includes("zaten var") ? "#64748b" : "#ef4444",
                      marginLeft: 8,
                      background: r.exampleStatus.includes("eklendi") ? "#10b98122" : r.exampleStatus.includes("zaten var") ? "#1e293b" : "#ef444422",
                      padding: "2px 6px",
                      borderRadius: 4
                    }}>
                      {r.exampleStatus.includes("eklendi") && `📝 ${r.exampleStatus}`}
                      {r.exampleStatus.includes("zaten var") && `⏭️ ${r.exampleStatus}`}
                      {r.exampleStatus === "hata" && "❌ Cümle hatası"}
                    </span>
                  )}
                  {!r.ok && (
                    <span style={{ fontSize: 10, color: "#ef4444", marginLeft: 8 }}>
                      ❌ {r.error}
                    </span>
                  )}
                </div>
                <span style={{ 
                  color: r.ok ? (r.status === "eklendi" ? "#10b981" : "#64748b") : "#ef4444",
                  fontSize: 12
                }}>
                  {r.ok ? (r.status === "eklendi" ? "✅ Yeni" : "⏭️ Mevcut") : "❌ Hata"}
                </span>
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

// ============================
// ANA ÇIKIŞ (EXPORT)
// ============================
export default function Admin() {
  const [loggedIn, setLoggedIn] = useState(false);
  if (!loggedIn) return <LoginScreen onLogin={() => setLoggedIn(true)} />;
  return <AdminPanel onLogout={() => setLoggedIn(false)} />;
}