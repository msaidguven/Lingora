// Admin.jsx
import { useState, useEffect, useCallback } from "react";
import { supabase } from "./config.js";

const ADMIN_PASSWORD = "123456";

// ============================
// DERS İÇİN ÖRNEK JSON
// ============================
const LESSON_EXAMPLE_JSON = `{
  "sections": [
    {
      "type": "theory",
      "title": "📖 Teori",
      "content": "1. ZAMİRLER (Subject Pronouns)\\nI = ben\\nyou = sen / siz\\nhe = o (erkek)\\nshe = o (kadın)\\nit = o (eşya, hayvan, kavram)\\nwe = biz\\nthey = onlar\\n\\nKURAL: I -> am, He/She/It -> is, You/We/They -> are"
    },
    {
      "type": "vocabulary",
      "title": "📚 Kelimeler",
      "vocabulary": [
        {"word": "teacher", "meaning": "öğretmen"},
        {"word": "doctor", "meaning": "doktor"},
        {"word": "engineer", "meaning": "mühendis"}
      ]
    },
    {
      "type": "example_sentences",
      "title": "💬 Örnek Cümleler",
      "example_sentences": [
        {"en": "I am a teacher.", "tr": "Ben öğretmenim."},
        {"en": "She is happy.", "tr": "O mutlu."}
      ]
    }
  ]
}`;

// ============================
// KELİME EKLEME İÇİN ÖRNEK JSON
// ============================
const WORD_EXAMPLE_JSON = `[
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
      }
    ]
  }
]`;

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
// KELİME EKLEME BİLEŞENİ
// ============================
function WordAdder({ onBack }) {
  const [jsonInput, setJsonInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showExample, setShowExample] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [results, setResults] = useState([]);

  const handleParse = () => {
    setMessage(null);
    setParsedData(null);
    setResults([]);
    
    try {
      const data = JSON.parse(jsonInput.trim());
      if (!Array.isArray(data)) {
        throw new Error("JSON bir array olmalı: [ ... ]");
      }
      if (data.length === 0) {
        throw new Error("Array boş.");
      }
      
      data.forEach((item, index) => {
        if (!item.word || !item.meaning) {
          throw new Error(`"${item.word || index}" kelimesi için word veya meaning eksik`);
        }
      });
      
      setParsedData(data);
      setMessage({ type: "success", text: `✅ ${data.length} kelime hazır!` });
    } catch (e) {
      setMessage({ type: "error", text: "⚠️ " + e.message });
    }
  };

  const handleInsert = async () => {
    if (!parsedData) return;
    
    setLoading(true);
    setMessage(null);
    const resultList = [];
    
    for (const item of parsedData) {
      try {
        const { data: existing, error: checkError } = await supabase
          .from("en_words")
          .select("id, word")
          .eq("word", item.word)
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
        }

        if (existing) {
          resultList.push({ 
            word: item.word, 
            ok: true, 
            status: "zaten var",
            message: "Kelime zaten mevcut"
          });
          continue;
        }

        const { data: inserted, error: insertError } = await supabase
          .from("en_words")
          .insert({
            word: item.word,
            meaning: item.meaning,
            level: item.level || "A1",
            type: item.type || "word",
            part_of_speech: item.part_of_speech || [],
            category: item.category || [],
            difficulty: item.difficulty || 1,
            synonyms: item.synonyms || [],
            antonyms: item.antonyms || [],
          })
          .select()
          .single();

        if (insertError) throw insertError;

        let addedExampleCount = 0;
        if (item.examples && Array.isArray(item.examples) && item.examples.length > 0) {
          for (const example of item.examples) {
            if (example.en && example.tr) {
              const { error: exampleError } = await supabase
                .from("en_example_sentences")
                .insert({
                  word_id: inserted.id,
                  sentence_en: example.en,
                  sentence_tr: example.tr,
                  difficulty: item.difficulty || 1,
                  order_index: 0,
                  source: "manual",
                  is_approved: true,
                });
              if (!exampleError) addedExampleCount++;
            }
          }
        }

        resultList.push({ 
          word: item.word, 
          ok: true, 
          status: "eklendi",
          message: `${addedExampleCount} cümle eklendi`
        });

      } catch (error) {
        resultList.push({ 
          word: item.word, 
          ok: false, 
          status: "hata",
          message: error.message
        });
      }
    }
    
    setResults(resultList);
    setLoading(false);
    
    const successCount = resultList.filter(r => r.ok).length;
    const failCount = resultList.filter(r => !r.ok).length;
    
    if (failCount === 0) {
      setMessage({ type: "success", text: `✅ ${successCount} kelime başarıyla eklendi!` });
      setJsonInput("");
      setParsedData(null);
    } else {
      setMessage({ type: "error", text: `⚠️ ${successCount} başarılı, ${failCount} hata` });
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 3, color: "#6366f1", fontWeight: 700, textTransform: "uppercase" }}>WordFlow</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>📝 Kelime Ekle</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>JSON formatında toplu kelime ekle</div>
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

      {message && (
        <div style={{ 
          marginBottom: 16, 
          padding: 12, 
          borderRadius: 10, 
          background: message.type === "error" ? "#2d1a0e" : "#0e2d1f",
          border: `1px solid ${message.type === "error" ? "#ef4444" : "#10b981"}`,
          color: message.type === "error" ? "#ef4444" : "#10b981",
          fontSize: 14
        }}>
          {message.text}
        </div>
      )}

      <div style={{ 
        background: "#1a1a2e", 
        borderRadius: 14, 
        padding: 24, 
        border: "1px solid #1e293b",
        marginBottom: 20
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <label style={{ fontSize: 11, color: "#64748b", display: "block" }}>JSON Verisi</label>
          <button
            onClick={() => setShowExample(!showExample)}
            style={{
              background: "none",
              border: "1px solid #1e293b",
              borderRadius: 6,
              color: "#64748b",
              fontSize: 11,
              padding: "4px 10px",
              cursor: "pointer"
            }}
          >
            {showExample ? "Gizle" : "Örnek JSON"}
          </button>
        </div>
        <textarea
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder='[ { "word": "...", "meaning": "...", "examples": [ { "en": "...", "tr": "..." } ] } ]'
          rows={10}
          style={{
            width: "100%",
            boxSizing: "border-box",
            background: "#0f0f1a",
            border: "1px solid #1e293b",
            borderRadius: 8,
            padding: "12px",
            color: "#e2e8f0",
            fontSize: 12,
            fontFamily: "monospace",
            lineHeight: 1.6,
            resize: "vertical",
            outline: "none"
          }}
        />
        
        {showExample && (
          <div style={{ marginTop: 10 }}>
            <div style={{ 
              fontSize: 11, 
              color: "#64748b", 
              marginBottom: 6
            }}>
              📄 Örnek JSON Formatı
            </div>
            <pre style={{
              background: "#0f0f1a",
              padding: 12,
              borderRadius: 6,
              fontSize: 11,
              color: "#94a3b8",
              margin: 0,
              overflowX: "auto",
              lineHeight: 1.5,
              border: "1px solid #1e293b"
            }}>
              {WORD_EXAMPLE_JSON}
            </pre>
          </div>
        )}

        {results.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: "#f1f5f9" }}>Sonuçlar:</div>
            {results.map((r, i) => (
              <div key={i} style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                padding: "4px 0",
                borderBottom: i < results.length - 1 ? "1px solid #0f0f1a" : "none",
                fontSize: 13
              }}>
                <span style={{ fontWeight: 600 }}>{r.word}</span>
                <span style={{ 
                  color: r.ok ? (r.status === "eklendi" ? "#10b981" : "#64748b") : "#ef4444"
                }}>
                  {r.ok ? (r.status === "eklendi" ? "✅ Eklendi" : "⏭️ Mevcut") : "❌ Hata"}
                  {r.message && ` - ${r.message}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={handleParse}
          disabled={!jsonInput.trim() || loading}
          style={{
            flex: 1,
            padding: "14px",
            borderRadius: 12,
            border: "none",
            background: jsonInput.trim() && !loading ? "#6366f1" : "#1e1e30",
            color: jsonInput.trim() && !loading ? "#fff" : "#475569",
            fontWeight: 700,
            fontSize: 14,
            cursor: jsonInput.trim() && !loading ? "pointer" : "not-allowed",
            transition: "all 0.2s"
          }}
        >
          🔍 JSON Kontrol Et
        </button>
        
        {parsedData && (
          <button
            onClick={handleInsert}
            disabled={loading}
            style={{
              flex: 2,
              padding: "14px",
              borderRadius: 12,
              border: "none",
              background: loading ? "#1e1e30" : "#10b981",
              color: loading ? "#475569" : "#fff",
              fontWeight: 700,
              fontSize: 14,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s"
            }}
          >
            {loading ? "⏳ Ekleniyor..." : `📥 ${parsedData.length} Kelime Ekle`}
          </button>
        )}
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
  const [searchTimeout, setSearchTimeout] = useState(null);

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

  const performSearch = useCallback(async (term) => {
    if (!term.trim()) {
      setSearchResults([]);
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
        .or(`word.ilike.%${term}%, meaning.ilike.%${term}%`)
        .order("word")
        .limit(20);

      if (error) throw error;

      setSearchResults(data || []);
      if (data.length === 0) {
        setMessage({ type: "info", text: `"${term}" için kelime bulunamadı` });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Arama hatası: " + error.message });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      performSearch(value);
    }, 300);

    setSearchTimeout(timeout);
  };

  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

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

  const deleteWord = async () => {
    if (!selectedWord) return;
    if (!window.confirm(`"${selectedWord.word}" kelimesini silmek istediğinize emin misiniz?`)) return;

    setLoading(true);
    setMessage(null);

    try {
      const { error: sentenceError } = await supabase
        .from("en_example_sentences")
        .delete()
        .eq("word_id", selectedWord.id);

      if (sentenceError) throw sentenceError;

      const { error: wordError } = await supabase
        .from("en_words")
        .delete()
        .eq("id", selectedWord.id);

      if (wordError) throw wordError;

      setMessage({ type: "success", text: "🗑️ Kelime başarıyla silindi!" });
      
      setSearchResults(prev => prev.filter(w => w.id !== selectedWord.id));
      setSelectedWord(null);
      setFormData({
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

    } catch (error) {
      setMessage({ type: "error", text: "Silme hatası: " + error.message });
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
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 3, color: "#6366f1", fontWeight: 700, textTransform: "uppercase" }}>WordFlow</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>✏️ Kelime Düzenle</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Kelime ara, düzenle veya sil</div>
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
        <div style={{ position: "relative" }}>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Kelime veya anlam ara..."
            autoFocus
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: "#0f0f1a",
              border: "1px solid #1e293b",
              borderRadius: 10,
              padding: "12px 16px",
              paddingLeft: 42,
              color: "#e2e8f0",
              fontSize: 15,
              outline: "none",
              fontFamily: "inherit"
            }}
          />
          <span style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            color: "#64748b",
            fontSize: 18
          }}>
            {loading ? "⏳" : "🔍"}
          </span>
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSearchResults([]);
                setMessage(null);
              }}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "#64748b",
                cursor: "pointer",
                fontSize: 16
              }}
            >
              ✕
            </button>
          )}
        </div>

        {searchResults.length > 0 && !selectedWord && (
          <div style={{ 
            marginTop: 10, 
            fontSize: 12, 
            color: "#64748b",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <span>{searchResults.length} kelime bulundu</span>
          </div>
        )}

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
          padding: 8, 
          border: "1px solid #1e293b",
          marginBottom: 24,
          maxHeight: 400,
          overflowY: "auto"
        }}>
          {searchResults.map((word, index) => (
            <div 
              key={word.id}
              onClick={() => selectWord(word)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                borderBottom: index < searchResults.length - 1 ? "1px solid #0f0f1a" : "none",
                cursor: "pointer",
                transition: "all 0.15s",
                borderRadius: 6,
                margin: "2px 0"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#0f0f1a"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <div>
                <span style={{ fontWeight: 700, fontSize: 16 }}>{word.word}</span>
                <span style={{ color: "#64748b", marginLeft: 12, fontSize: 14 }}>{word.meaning}</span>
                {word.en_example_sentences && (
                  <span style={{ 
                    fontSize: 10, 
                    color: "#475569", 
                    marginLeft: 8,
                    background: "#0f0f1a",
                    padding: "2px 8px",
                    borderRadius: 4
                  }}>
                    📝 {word.en_example_sentences.length} cümle
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ 
                  fontSize: 10, 
                  background: "#6366f122", 
                  color: "#6366f1", 
                  padding: "2px 10px", 
                  borderRadius: 4,
                  fontWeight: 600
                }}>
                  {word.level || "A1"}
                </span>
                <span style={{ 
                  fontSize: 10, 
                  background: "#1e293b", 
                  color: "#64748b", 
                  padding: "2px 10px", 
                  borderRadius: 4
                }}>
                  ⭐ {word.difficulty || 1}
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
                onClick={() => setSelectedWord(null)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: "1px solid #64748b",
                  background: "transparent",
                  color: "#64748b",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600
                }}
              >
                ← Listeye Dön
              </button>
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
                <>
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
                  <button 
                    onClick={deleteWord}
                    disabled={loading}
                    style={{
                      padding: "6px 16px",
                      borderRadius: 8,
                      border: "none",
                      background: "#ef4444",
                      color: "#fff",
                      fontWeight: 700,
                      cursor: loading ? "not-allowed" : "pointer",
                      opacity: loading ? 0.6 : 1
                    }}
                  >
                    🗑️ Sil
                  </button>
                </>
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
// DERS EKLEME BİLEŞENİ
// ============================
function LessonAdder({ onBack }) {
  const [lessonNumber, setLessonNumber] = useState("");
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState("A1");
  const [jsonInput, setJsonInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showExample, setShowExample] = useState(false);

  const handleAddLesson = async () => {
    if (!lessonNumber || !title) {
      setMessage({ type: "error", text: "Ders numarası ve başlık zorunludur!" });
      return;
    }

    let contentJson = {};
    try {
      if (jsonInput.trim()) {
        contentJson = JSON.parse(jsonInput.trim());
      } else {
        contentJson = { sections: [] };
      }
    } catch (e) {
      setMessage({ type: "error", text: "⚠️ Geçersiz JSON formatı!" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { data: existing, error: checkError } = await supabase
        .from("en_lessons")
        .select("id, lesson_number")
        .eq("level", level)
        .eq("lesson_number", parseInt(lessonNumber))
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existing) {
        setMessage({ 
          type: "error", 
          text: `⚠️ Bu seviyede (${level}) ${lessonNumber}. ders zaten mevcut!` 
        });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("en_lessons")
        .insert({
          lesson_number: parseInt(lessonNumber),
          title: title.trim(),
          level: level,
          content_json: contentJson
        })
        .select()
        .single();

      if (error) throw error;

      setMessage({ 
        type: "success", 
        text: `✅ ${level} seviyesi ${lessonNumber}. ders başarıyla eklendi!` 
      });

      setLessonNumber("");
      setTitle("");
      setJsonInput("");
      
    } catch (error) {
      setMessage({ type: "error", text: "Ders eklenemedi: " + error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 3, color: "#6366f1", fontWeight: 700, textTransform: "uppercase" }}>WordFlow</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>➕ Yeni Ders Ekle</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Her seviye için ders numarası benzersiz olmalıdır</div>
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

      {message && (
        <div style={{ 
          marginBottom: 16, 
          padding: 12, 
          borderRadius: 10, 
          background: message.type === "error" ? "#2d1a0e" : "#0e2d1f",
          border: `1px solid ${message.type === "error" ? "#ef4444" : "#10b981"}`,
          color: message.type === "error" ? "#ef4444" : "#10b981",
          fontSize: 14
        }}>
          {message.text}
        </div>
      )}

      <div style={{ 
        background: "#1a1a2e", 
        borderRadius: 14, 
        padding: 24, 
        border: "1px solid #1e293b",
        marginBottom: 20
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}>Ders Numarası *</label>
            <input
              type="number"
              value={lessonNumber}
              onChange={(e) => setLessonNumber(e.target.value)}
              placeholder="1, 2, 3..."
              style={{
                width: "100%",
                boxSizing: "border-box",
                background: "#0f0f1a",
                border: "1px solid #1e293b",
                borderRadius: 8,
                padding: "10px 12px",
                color: "#e2e8f0",
                fontSize: 14,
                outline: "none",
                fontFamily: "inherit"
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}>Seviye *</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                background: "#0f0f1a",
                border: "1px solid #1e293b",
                borderRadius: 8,
                padding: "10px 12px",
                color: "#e2e8f0",
                fontSize: 14,
                outline: "none",
                fontFamily: "inherit"
              }}
            >
              <option value="A1">A1</option>
              <option value="A2">A2</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}>Ders Başlığı *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Örn: Greetings and Introductions"
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: "#0f0f1a",
              border: "1px solid #1e293b",
              borderRadius: 8,
              padding: "10px 12px",
              color: "#e2e8f0",
              fontSize: 14,
              outline: "none",
              fontFamily: "inherit"
            }}
          />
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <label style={{ fontSize: 11, color: "#64748b", display: "block" }}>İçerik (JSON)</label>
            <button
              onClick={() => setShowExample(!showExample)}
              style={{
                background: "none",
                border: "1px solid #1e293b",
                borderRadius: 6,
                color: "#64748b",
                fontSize: 11,
                padding: "4px 10px",
                cursor: "pointer"
              }}
            >
              {showExample ? "Gizle" : "Örnek JSON"}
            </button>
          </div>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='{"sections": [...]} veya boş bırakın'
            rows={8}
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: "#0f0f1a",
              border: "1px solid #1e293b",
              borderRadius: 8,
              padding: "12px",
              color: "#e2e8f0",
              fontSize: 12,
              fontFamily: "monospace",
              lineHeight: 1.6,
              resize: "vertical",
              outline: "none"
            }}
          />
          {showExample && (
            <div style={{ marginTop: 10 }}>
              <div style={{ 
                fontSize: 11, 
                color: "#64748b", 
                marginBottom: 6
              }}>
                📄 Örnek JSON Formatı
              </div>
              <pre style={{
                background: "#0f0f1a",
                padding: 12,
                borderRadius: 6,
                fontSize: 11,
                color: "#94a3b8",
                margin: 0,
                overflowX: "auto",
                lineHeight: 1.5,
                border: "1px solid #1e293b"
              }}>
                {LESSON_EXAMPLE_JSON}
              </pre>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={handleAddLesson}
        disabled={loading || !lessonNumber || !title}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: 12,
          border: "none",
          background: (loading || !lessonNumber || !title) ? "#1e1e30" : "#6366f1",
          color: (loading || !lessonNumber || !title) ? "#475569" : "#fff",
          fontWeight: 700,
          fontSize: 15,
          cursor: (loading || !lessonNumber || !title) ? "not-allowed" : "pointer",
          transition: "all 0.2s"
        }}
      >
        {loading ? "⏳ Ekleniyor..." : "📚 Dersi Ekle"}
      </button>
    </div>
  );
}

// ============================
// DERS DÜZENLEME BİLEŞENİ
// ============================
function LessonEditor({ onBack }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState(null);
  const [searchTimeout, setSearchTimeout] = useState(null);

  const [formData, setFormData] = useState({
    lesson_number: "",
    title: "",
    level: "A1",
    content_json: {}
  });

  const performSearch = useCallback(async (term) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setMessage(null);
    setSelectedLesson(null);

    try {
      const { data, error } = await supabase
        .from("en_lessons")
        .select("*")
        .or(`title.ilike.%${term}%, lesson_number::text.ilike.%${term}%`)
        .order("level")
        .order("lesson_number")
        .limit(20);

      if (error) throw error;

      setSearchResults(data || []);
      if (data.length === 0) {
        setMessage({ type: "info", text: `"${term}" için ders bulunamadı` });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Arama hatası: " + error.message });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      performSearch(value);
    }, 300);

    setSearchTimeout(timeout);
  };

  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const selectLesson = (lesson) => {
    setSelectedLesson(lesson);
    setFormData({
      lesson_number: lesson.lesson_number,
      title: lesson.title,
      level: lesson.level || "A1",
      content_json: lesson.content_json || {}
    });
    setEditing(false);
    setMessage(null);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getPrettyJson = (json) => {
    try {
      return JSON.stringify(json, null, 2);
    } catch {
      return JSON.stringify(json);
    }
  };

  const handleJsonChange = (value) => {
    try {
      const parsed = JSON.parse(value);
      setFormData(prev => ({ ...prev, content_json: parsed }));
      setMessage(null);
    } catch (e) {
      setFormData(prev => ({ ...prev, content_json: value }));
      setMessage({ type: "error", text: "⚠️ Geçersiz JSON formatı" });
    }
  };

  const handleSave = async () => {
    if (!selectedLesson) return;

    let contentToSave = formData.content_json;
    if (typeof contentToSave === 'string') {
      try {
        contentToSave = JSON.parse(contentToSave);
      } catch (e) {
        setMessage({ type: "error", text: "⚠️ Lütfen geçerli bir JSON girin" });
        return;
      }
    }

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from("en_lessons")
        .update({
          lesson_number: parseInt(formData.lesson_number),
          title: formData.title,
          level: formData.level,
          content_json: contentToSave,
        })
        .eq("id", selectedLesson.id);

      if (error) throw error;

      setMessage({ type: "success", text: "✅ Ders başarıyla güncellendi!" });
      setEditing(false);

      const updatedLesson = { 
        ...selectedLesson, 
        ...formData,
        content_json: contentToSave
      };
      setSelectedLesson(updatedLesson);

      setSearchResults(prev => 
        prev.map(l => l.id === updatedLesson.id ? updatedLesson : l)
      );

    } catch (error) {
      setMessage({ type: "error", text: "Kaydetme hatası: " + error.message });
    } finally {
      setLoading(false);
    }
  };

  const deleteLesson = async () => {
    if (!selectedLesson) return;
    if (!window.confirm(`"${selectedLesson.title}" dersini silmek istediğinize emin misiniz?`)) return;

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from("en_lessons")
        .delete()
        .eq("id", selectedLesson.id);

      if (error) throw error;

      setMessage({ type: "success", text: "🗑️ Ders başarıyla silindi!" });
      
      setSearchResults(prev => prev.filter(l => l.id !== selectedLesson.id));
      setSelectedLesson(null);
      setFormData({
        lesson_number: "",
        title: "",
        level: "A1",
        content_json: {}
      });

    } catch (error) {
      setMessage({ type: "error", text: "Silme hatası: " + error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 3, color: "#6366f1", fontWeight: 700, textTransform: "uppercase" }}>WordFlow</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>📚 Ders Düzenle</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Ders ara, düzenle veya sil</div>
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
        <div style={{ position: "relative" }}>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Ders numarası veya başlık ara..."
            autoFocus
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: "#0f0f1a",
              border: "1px solid #1e293b",
              borderRadius: 10,
              padding: "12px 16px",
              paddingLeft: 42,
              color: "#e2e8f0",
              fontSize: 15,
              outline: "none",
              fontFamily: "inherit"
            }}
          />
          <span style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            color: "#64748b",
            fontSize: 18
          }}>
            {loading ? "⏳" : "🔍"}
          </span>
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSearchResults([]);
                setMessage(null);
              }}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "#64748b",
                cursor: "pointer",
                fontSize: 16
              }}
            >
              ✕
            </button>
          )}
        </div>

        {searchResults.length > 0 && !selectedLesson && (
          <div style={{ 
            marginTop: 10, 
            fontSize: 12, 
            color: "#64748b",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <span>{searchResults.length} ders bulundu</span>
          </div>
        )}

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

      {searchResults.length > 0 && !selectedLesson && (
        <div style={{ 
          background: "#1a1a2e", 
          borderRadius: 14, 
          padding: 8, 
          border: "1px solid #1e293b",
          marginBottom: 24,
          maxHeight: 400,
          overflowY: "auto"
        }}>
          {searchResults.map((lesson, index) => (
            <div 
              key={lesson.id}
              onClick={() => selectLesson(lesson)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                borderBottom: index < searchResults.length - 1 ? "1px solid #0f0f1a" : "none",
                cursor: "pointer",
                transition: "all 0.15s",
                borderRadius: 6,
                margin: "2px 0"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#0f0f1a"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ 
                    fontSize: 12, 
                    background: "#6366f122", 
                    color: "#6366f1", 
                    padding: "2px 10px", 
                    borderRadius: 4,
                    fontWeight: 600
                  }}>
                    #{lesson.lesson_number}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>{lesson.title}</span>
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                  Seviye: {lesson.level || "A1"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ 
                  fontSize: 10, 
                  background: "#1e293b", 
                  color: "#64748b", 
                  padding: "2px 10px", 
                  borderRadius: 4
                }}>
                  📝 {typeof lesson.content_json === 'object' && lesson.content_json.sections ? lesson.content_json.sections.length : 0} bölüm
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedLesson && (
        <div style={{ 
          background: "#1a1a2e", 
          borderRadius: 14, 
          padding: 24, 
          border: "1px solid #1e293b"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <span style={{ fontSize: 18, fontWeight: 800 }}>#{selectedLesson.lesson_number} - {selectedLesson.title}</span>
              <span style={{ fontSize: 14, color: "#64748b", marginLeft: 12 }}>ID: {selectedLesson.id.slice(0, 8)}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button 
                onClick={() => setSelectedLesson(null)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: "1px solid #64748b",
                  background: "transparent",
                  color: "#64748b",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600
                }}
              >
                ← Listeye Dön
              </button>
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
                <>
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
                  <button 
                    onClick={deleteLesson}
                    disabled={loading}
                    style={{
                      padding: "6px 16px",
                      borderRadius: 8,
                      border: "none",
                      background: "#ef4444",
                      color: "#fff",
                      fontWeight: 700,
                      cursor: loading ? "not-allowed" : "pointer",
                      opacity: loading ? 0.6 : 1
                    }}
                  >
                    🗑️ Sil
                  </button>
                </>
              )}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}>Ders Numarası</label>
              <input
                type="number"
                value={formData.lesson_number}
                onChange={(e) => handleFormChange("lesson_number", e.target.value)}
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
              <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}>Başlık</label>
              <input
                value={formData.title}
                onChange={(e) => handleFormChange("title", e.target.value)}
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
              <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}>
                Oluşturulma Tarihi
              </label>
              <div style={{
                padding: "8px 12px",
                background: "#0f0f1a",
                borderRadius: 8,
                color: "#64748b",
                fontSize: 13,
                border: "1px solid #1e293b"
              }}>
                {new Date(selectedLesson.created_at).toLocaleString('tr-TR')}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 24, borderTop: "1px solid #1e293b", paddingTop: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>📦 İçerik (JSON)</div>
              {!editing && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(getPrettyJson(formData.content_json));
                    setMessage({ type: "success", text: "✅ JSON kopyalandı!" });
                    setTimeout(() => setMessage(null), 2000);
                  }}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 6,
                    border: "1px solid #1e293b",
                    background: "transparent",
                    color: "#64748b",
                    cursor: "pointer",
                    fontSize: 11
                  }}
                >
                  📋 Kopyala
                </button>
              )}
            </div>
            
            {editing ? (
              <textarea
                value={typeof formData.content_json === 'string' ? formData.content_json : getPrettyJson(formData.content_json)}
                onChange={(e) => handleJsonChange(e.target.value)}
                rows={15}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: "#0f0f1a",
                  border: "1px solid #1e293b",
                  borderRadius: 8,
                  padding: "12px",
                  color: "#e2e8f0",
                  fontSize: 12,
                  fontFamily: "monospace",
                  lineHeight: 1.6,
                  resize: "vertical",
                  outline: "none"
                }}
              />
            ) : (
              <div style={{
                background: "#0f0f1a",
                borderRadius: 8,
                padding: "16px",
                maxHeight: 400,
                overflowY: "auto",
                border: "1px solid #1e293b"
              }}>
                <pre style={{
                  margin: 0,
                  color: "#94a3b8",
                  fontSize: 12,
                  fontFamily: "monospace",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word"
                }}>
                  {getPrettyJson(formData.content_json)}
                </pre>
              </div>
            )}
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

  // Sayfa render fonksiyonu
  const renderPage = () => {
    switch(currentPage) {
      case "word_add":
        return <WordAdder onBack={() => setCurrentPage("main")} />;
      case "word_edit":
        return <WordEditor onBack={() => setCurrentPage("main")} />;
      case "lesson_add":
        return <LessonAdder onBack={() => setCurrentPage("main")} />;
      case "lesson_edit":
        return <LessonEditor onBack={() => setCurrentPage("main")} />;
      default:
        return null;
    }
  };

  // Ana Menü
  if (currentPage !== "main") {
    return (
      <div style={{ minHeight: "100vh", background: "#0f0f1a", color: "#e2e8f0", fontFamily: "'Inter', system-ui, sans-serif", padding: "28px 20px 48px" }}>
        {renderPage()}
      </div>
    );
  }

  // Ana Sayfa
  return (
    <div style={{ minHeight: "100vh", background: "#0f0f1a", color: "#e2e8f0", fontFamily: "'Inter', system-ui, sans-serif", maxWidth: 560, margin: "0 auto", padding: "28px 20px 48px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 3, color: "#6366f1", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>WordFlow</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>Admin Paneli</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Kelime ve Ders Yönetimi</div>
        </div>
        <button onClick={onLogout} style={{ background: "#1e293b", border: "none", borderRadius: 8, padding: "6px 12px", color: "#64748b", fontSize: 12, cursor: "pointer" }}>
          Çıkış
        </button>
      </div>

      {/* Son Eklenen Dersler */}
      <div style={{ 
        background: "#1a1a2e", 
        border: "1px solid #1e293b", 
        borderRadius: 10, 
        padding: "14px",
        marginBottom: 20
      }}>
        <div style={{ 
          fontSize: 10, 
          letterSpacing: 2, 
          color: "#6366f1", 
          fontWeight: 600, 
          textTransform: "uppercase",
          marginBottom: 8
        }}>
          📚 Son Eklenen Dersler
        </div>
        {loadingRecent ? (
          <div style={{ fontSize: 12, color: "#64748b" }}>Yükleniyor...</div>
        ) : recentLessons.length > 0 ? (
          <div>
            {recentLessons.map((lesson, index) => (
              <div 
                key={index} 
                style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  padding: "6px 0",
                  borderBottom: index < recentLessons.length - 1 ? "1px solid #0f0f1a" : "none",
                  fontSize: 13
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, color: "#e2e8f0" }}>{lesson.title}</span>
                  <span style={{ fontSize: 11, color: "#475569", marginLeft: 6 }}>#{lesson.lesson_number}</span>
                </div>
                <span style={{ 
                  fontSize: 10, 
                  color: "#64748b", 
                  background: "#0f0f1a", 
                  padding: "1px 8px", 
                  borderRadius: 4 
                }}>
                  {lesson.level || "A1"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: "#64748b" }}>Henüz ders yok</div>
        )}
      </div>

      {/* Ana Menü Butonları */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <button
          onClick={() => setCurrentPage("word_add")}
          style={{
            background: "#1a1a2e",
            border: "1px solid #1e293b",
            borderRadius: 12,
            padding: "20px",
            color: "#e2e8f0",
            cursor: "pointer",
            textAlign: "center",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1e293b"; e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <div style={{ fontSize: 28, marginBottom: 8 }}>📝</div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Kelime Ekle</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Toplu kelime ekle</div>
        </button>

        <button
          onClick={() => setCurrentPage("word_edit")}
          style={{
            background: "#1a1a2e",
            border: "1px solid #1e293b",
            borderRadius: 12,
            padding: "20px",
            color: "#e2e8f0",
            cursor: "pointer",
            textAlign: "center",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1e293b"; e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <div style={{ fontSize: 28, marginBottom: 8 }}>✏️</div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Kelime Düzenle</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Ara, düzenle, sil</div>
        </button>

        <button
          onClick={() => setCurrentPage("lesson_add")}
          style={{
            background: "#1a1a2e",
            border: "1px solid #1e293b",
            borderRadius: 12,
            padding: "20px",
            color: "#e2e8f0",
            cursor: "pointer",
            textAlign: "center",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1e293b"; e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <div style={{ fontSize: 28, marginBottom: 8 }}>📚</div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Ders Ekle</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Yeni ders oluştur</div>
        </button>

        <button
          onClick={() => setCurrentPage("lesson_edit")}
          style={{
            background: "#1a1a2e",
            border: "1px solid #1e293b",
            borderRadius: 12,
            padding: "20px",
            color: "#e2e8f0",
            cursor: "pointer",
            textAlign: "center",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1e293b"; e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <div style={{ fontSize: 28, marginBottom: 8 }}>📖</div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Ders Düzenle</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>Ders içeriğini düzenle</div>
        </button>
      </div>
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