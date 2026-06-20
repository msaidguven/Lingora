// admin/LessonManagement.jsx
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../config.js";
import { 
  styles, colors, PageHeader, Tabs, Card, Message, 
  Input, TextArea, JsonDisplay, SearchInput, Badge 
} from "./adminStyles.jsx";

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

export default function LessonManagement({ onBack }) {
  const [activeTab, setActiveTab] = useState("add");

  const tabs = [
    { id: "add", label: "Ders Ekle", icon: "➕" },
    { id: "edit", label: "Ders Düzenle", icon: "📖" },
  ];

  return (
    <div style={styles.container}>
      <PageHeader 
        title="📚 Ders Yönetimi"
        subtitle="Ders ekle, düzenle veya sil"
        onBack={onBack}
      />

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "add" ? <LessonAdder /> : <LessonEditor />}
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
    <div>
      <Message type={message?.type} text={message?.text} />

      <Card>
        <div style={styles.grid2}>
          <Input
            label="Ders Numarası *"
            type="number"
            value={lessonNumber}
            onChange={(e) => setLessonNumber(e.target.value)}
            placeholder="1, 2, 3..."
          />
          <div>
            <label style={styles.label}>Seviye *</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              style={styles.input(true)}
            >
              <option value="A1">A1</option>
              <option value="A2">A2</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
            </select>
          </div>
        </div>

        <Input
          label="Ders Başlığı *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Örn: Greetings and Introductions"
        />

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <label style={styles.label}>İçerik (JSON)</label>
            <button
              onClick={() => setShowExample(!showExample)}
              style={{
                background: "none",
                border: `1px solid ${colors.border}`,
                borderRadius: 6,
                color: colors.textSecondary,
                fontSize: 11,
                padding: "4px 10px",
                cursor: "pointer"
              }}
            >
              {showExample ? "Gizle" : "Örnek JSON"}
            </button>
          </div>
          <TextArea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='{"sections": [...]} veya boş bırakın'
            rows={8}
          />
          {showExample && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 6 }}>
                📄 Örnek JSON Formatı
              </div>
              <JsonDisplay data={LESSON_EXAMPLE_JSON} />
            </div>
          )}
        </div>
      </Card>

      <button
        onClick={handleAddLesson}
        disabled={loading || !lessonNumber || !title}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: 12,
          border: "none",
          background: (loading || !lessonNumber || !title) ? "#1e1e30" : colors.primary,
          color: (loading || !lessonNumber || !title) ? colors.textMuted : "#fff",
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
function LessonEditor() {
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
    <div>
      <Card>
        <SearchInput
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Ders numarası veya başlık ara..."
          loading={loading}
          onClear={() => {
            setSearchTerm("");
            setSearchResults([]);
            setMessage(null);
          }}
        />

        {searchResults.length > 0 && !selectedLesson && (
          <div style={{ marginTop: 10, fontSize: 12, color: colors.textSecondary }}>
            {searchResults.length} ders bulundu
          </div>
        )}

        <Message type={message?.type} text={message?.text} />
      </Card>

      {searchResults.length > 0 && !selectedLesson && (
        <Card>
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {searchResults.map((lesson, index) => (
              <div 
                key={lesson.id}
                onClick={() => selectLesson(lesson)}
                style={styles.listItem}
                onMouseEnter={(e) => e.currentTarget.style.background = colors.surfaceDark}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Badge text={`#${lesson.lesson_number}`} />
                    <span style={{ fontWeight: 700, fontSize: 16 }}>{lesson.title}</span>
                  </div>
                  <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                    Seviye: {lesson.level || "A1"}
                  </div>
                </div>
                <span style={{ 
                  fontSize: 10, 
                  background: colors.surfaceLight, 
                  color: colors.textSecondary, 
                  padding: "2px 10px", 
                  borderRadius: 4
                }}>
                  📝 {typeof lesson.content_json === 'object' && lesson.content_json.sections ? lesson.content_json.sections.length : 0} bölüm
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {selectedLesson && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <span style={{ fontSize: 18, fontWeight: 800 }}>#{selectedLesson.lesson_number} - {selectedLesson.title}</span>
              <span style={{ fontSize: 14, color: colors.textSecondary, marginLeft: 12 }}>ID: {selectedLesson.id.slice(0, 8)}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button 
                onClick={() => setSelectedLesson(null)}
                style={styles.backButton}
              >
                ← Listeye Dön
              </button>
              <button 
                onClick={() => setEditing(!editing)}
                style={styles.editButton(editing)}
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
                      background: colors.success,
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
                    style={styles.dangerButton(loading)}
                  >
                    🗑️ Sil
                  </button>
                </>
              )}
            </div>
          </div>

          <div style={styles.grid2}>
            <Input
              label="Ders Numarası"
              type="number"
              value={formData.lesson_number}
              onChange={(e) => handleFormChange("lesson_number", e.target.value)}
              disabled={!editing}
            />
            <Input
              label="Başlık"
              value={formData.title}
              onChange={(e) => handleFormChange("title", e.target.value)}
              disabled={!editing}
            />
            <div>
              <label style={styles.label}>Seviye</label>
              <select
                value={formData.level}
                onChange={(e) => handleFormChange("level", e.target.value)}
                disabled={!editing}
                style={styles.input(editing)}
              >
                <option value="A1">A1</option>
                <option value="A2">A2</option>
                <option value="B1">B1</option>
                <option value="B2">B2</option>
              </select>
            </div>
            <div>
              <label style={styles.label}>Oluşturulma Tarihi</label>
              <div style={{
                padding: "8px 12px",
                background: colors.surfaceDark,
                borderRadius: 8,
                color: colors.textSecondary,
                fontSize: 13,
                border: `1px solid ${colors.border}`
              }}>
                {new Date(selectedLesson.created_at).toLocaleString('tr-TR')}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 24, borderTop: `1px solid ${colors.border}`, paddingTop: 20 }}>
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
                    border: `1px solid ${colors.border}`,
                    background: "transparent",
                    color: colors.textSecondary,
                    cursor: "pointer",
                    fontSize: 11
                  }}
                >
                  📋 Kopyala
                </button>
              )}
            </div>
            
            {editing ? (
              <TextArea
                value={typeof formData.content_json === 'string' ? formData.content_json : getPrettyJson(formData.content_json)}
                onChange={(e) => handleJsonChange(e.target.value)}
                rows={15}
              />
            ) : (
              <div style={{
                background: colors.surfaceDark,
                borderRadius: 8,
                padding: "16px",
                maxHeight: 400,
                overflowY: "auto",
                border: `1px solid ${colors.border}`
              }}>
                <pre style={{
                  margin: 0,
                  color: colors.textSecondary,
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
        </Card>
      )}
    </div>
  );
}