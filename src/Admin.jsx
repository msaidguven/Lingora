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
      "type": "vocabulary",
      "title": "Yeni Kelimeler",
      "items": [
        {
          "word": "example",
          "meaning": "örnek",
          "part_of_speech": "noun",
          "example_sentence": "This is an example sentence.",
          "example_translation": "Bu bir örnek cümledir."
        }
      ]
    },
    {
      "type": "grammar",
      "title": "Dil Bilgisi",
      "content": "Present Simple Tense kullanımı..."
    },
    {
      "type": "reading",
      "title": "Okuma Parçası",
      "content": "Reading text content here...",
      "questions": [
        {
          "question": "What is the main topic?",
          "options": ["A", "B", "C", "D"],
          "correct_answer": 0
        }
      ]
    }
  ]
}`;

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

  // 🔥 LİVE SEARCH - Her harf değişiminde sorgu yapar
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

  // 🔥 Her harf değişiminde debounce ile arama yap
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

  // Component unmount olurken timeout'u temizle
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

  const handleJsonChange = (value) => {
    try {
      // JSON'u parse et ve formatla
      const parsed = JSON.parse(value);
      setFormData(prev => ({ ...prev, content_json: parsed }));
      setMessage(null);
    } catch (e) {
      // Geçersiz JSON, ama yine de değeri sakla (kullanıcı düzenlerken)
      setFormData(prev => ({ ...prev, content_json: value }));
      setMessage({ type: "error", text: "⚠️ Geçersiz JSON formatı" });
    }
  };

  const handleSave = async () => {
    if (!selectedLesson) return;

    // content_json'u kontrol et
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

  // JSON'u formatlı göster
  const getPrettyJson = (json) => {
    try {
      return JSON.stringify(json, null, 2);
    } catch {
      return JSON.stringify(json);
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 3, color: "#6366f1", fontWeight: 700, textTransform: "uppercase" }}>WordFlow</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>📚 Ders Düzenle</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Ders aramak için yazmaya başlayın</div>
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

      {/* 🔥 ARAMA KUTUSU */}
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
            placeholder="Ders numarası veya başlık ara (örn: 1, greetings)..."
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

      {/* 🔥 ARAMA SONUÇLARI */}
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
                  📝 {Object.keys(lesson.content_json || {}).length} bölüm
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ders Düzenleme Formu */}
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
                onClick={() => {
                  setSelectedLesson(null);
                  setSearchResults(prev => prev.map(l => 
                    l.id === selectedLesson.id ? { ...l, ...formData } : l
                  ));
                }}
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
              <div>
                <div style={{ 
                  fontSize: 12, 
                  color: "#64748b", 
                  marginBottom: 8,
                  background: "#0f0f1a",
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid #1e293b"
                }}>
                  💡 JSON formatında ders içeriğini düzenleyin. Örnek format için aşağıdaki butona tıklayın.
                </div>
                <button
                  onClick={() => {
                    if (window.confirm("Örnek JSON ile değiştirmek istediğinize emin misiniz? Mevcut içerik kaybolacak!")) {
                      try {
                        const example = JSON.parse(LESSON_EXAMPLE_JSON);
                        setFormData(prev => ({ ...prev, content_json: example }));
                        setMessage({ type: "success", text: "✅ Örnek JSON yüklendi!" });
                        setTimeout(() => setMessage(null), 2000);
                      } catch (e) {
                        setMessage({ type: "error", text: "Örnek JSON yüklenemedi" });
                      }
                    }
                  }}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 6,
                    border: "1px solid #6366f1",
                    background: "transparent",
                    color: "#6366f1",
                    cursor: "pointer",
                    fontSize: 11,
                    marginBottom: 10
                  }}
                >
                  📄 Örnek JSON Yükle
                </button>
                <textarea
                  value={typeof formData.content_json === 'string' ? formData.content_json : getPrettyJson(formData.content_json)}
                  onChange={(e) => handleJsonChange(e.target.value)}
                  rows={20}
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
                {typeof formData.content_json === 'string' && (
                  <div style={{ fontSize: 11, color: "#f59e0b", marginTop: 6 }}>
                    ⚠️ Geçersiz JSON formatı. Lütfen düzeltin.
                  </div>
                )}
              </div>
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

          {/* İçerik Özeti */}
          {!editing && typeof formData.content_json === 'object' && formData.content_json.sections && (
            <div style={{ marginTop: 16, borderTop: "1px solid #1e293b", paddingTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>📊 İçerik Özeti</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {formData.content_json.sections.map((section, index) => (
                  <div 
                    key={index}
                    style={{
                      background: "#0f0f1a",
                      padding: "6px 12px",
                      borderRadius: 6,
                      border: "1px solid #1e293b",
                      fontSize: 12,
                      color: "#94a3b8"
                    }}
                  >
                    {section.type}: {section.title}
                    {section.items && ` (${section.items.length} item)`}
                    {section.questions && ` (${section.questions.length} soru)`}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================
// DERS EKLEME BİLEŞENİ
// ============================
function LessonAdder() {
  const [lessonNumber, setLessonNumber] = useState("");
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState("A1");
  const [jsonInput, setJsonInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showExample, setShowExample] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleAddLesson = async () => {
    // Validasyon
    if (!lessonNumber || !title) {
      setMessage({ type: "error", text: "Ders numarası ve başlık zorunludur!" });
      return;
    }

    let contentJson = {};
    try {
      if (jsonInput.trim()) {
        contentJson = JSON.parse(jsonInput.trim());
      } else {
        // Boş JSON
        contentJson = { sections: [] };
      }
    } catch (e) {
      setMessage({ type: "error", text: "⚠️ Geçersiz JSON formatı!" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Aynı level ve lesson_number kontrolü
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

      // Yeni ders ekle
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

      // Formu temizle
      setLessonNumber("");
      setTitle("");
      setJsonInput("");
      
    } catch (error) {
      setMessage({ type: "error", text: "Ders eklenemedi: " + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyExample = () => {
    navigator.clipboard.writeText(LESSON_EXAMPLE_JSON);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 10, letterSpacing: 3, color: "#6366f1", fontWeight: 700, textTransform: "uppercase" }}>WordFlow</div>
        <div style={{ fontSize: 22, fontWeight: 800 }}>➕ Yeni Ders Ekle</div>
        <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Her seviye için ders numarası benzersiz olmalıdır</div>
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
                marginBottom: 6,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <span>📄 Örnek JSON Formatı</span>
                <button
                  onClick={handleCopyExample}
                  style={{
                    background: copied ? "#0e2d1f" : "#1e293b",
                    border: "none",
                    borderRadius: 4,
                    color: copied ? "#10b981" : "#94a3b8",
                    fontSize: 10,
                    padding: "4px 10px",
                    cursor: "pointer"
                  }}
                >
                  {copied ? "✓ Kopyalandı!" : "📋 Kopyala"}
                </button>
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
// ANA ADMIN PANELİ
// ============================
function AdminPanel({ onLogout }) {
  const [currentPage, setCurrentPage] = useState("add");
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

  // Eğer ders düzenleme sayfası gösterilecekse
  if (currentPage === "edit") {
    return (
      <div style={{ minHeight: "100vh", background: "#0f0f1a", color: "#e2e8f0", fontFamily: "'Inter', system-ui, sans-serif", padding: "28px 20px 48px" }}>
        <LessonEditor onBack={() => setCurrentPage("add")} />
      </div>
    );
  }

  // Ders Ekleme Sayfası
  return (
    <div style={{ minHeight: "100vh", background: "#0f0f1a", color: "#e2e8f0", fontFamily: "'Inter', system-ui, sans-serif", maxWidth: 560, margin: "0 auto", padding: "28px 20px 48px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 3, color: "#6366f1", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>WordFlow</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>Admin — Ders Yönetimi</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Ders ekle ve düzenle</div>
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
            ✏️ Ders Düzenle
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
                      padding: "4px 0",
                      borderBottom: index < recentLessons.length - 1 ? "1px solid #0f0f1a" : "none",
                      fontSize: 12
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, color: "#e2e8f0" }}>{lesson.title}</span>
                      <span style={{ fontSize: 10, color: "#475569", marginLeft: 6 }}>#{lesson.lesson_number}</span>
                    </div>
                    <span style={{ 
                      fontSize: 9, 
                      color: "#64748b", 
                      background: "#0f0f1a", 
                      padding: "1px 6px", 
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
        </div>
      </div>

      <LessonAdder />
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