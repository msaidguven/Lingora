// admin/LessonManagement.jsx
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../config.js";
import { 
  styles, colors, PageHeader, Tabs, Card, Message, 
  Input, TextArea, JsonDisplay, SearchInput, Badge 
} from "./adminStyles.jsx";

// Yeni JSON formatı - SADECE DESTEKLENEN TİPLER: info, multiple_choice, fill_blank, matching, drag_drop, summary
const NEW_JSON_EXAMPLE = `{
  "steps": [
    {
      "id": "step_1",
      "type": "info",
      "title": "To Be Fiili - Olumsuz (Negative)",
      "content": {
        "explanation": "İngilizcede 'to be' fiilini (am/is/are) olumsuz yapmak için fiilden hemen sonra 'not' kelimesini ekleriz.",
        "rule": "📌 KURAL: Özne + am/is/are + NOT + tamlayıcı",
        "examples": [
          {
            "correct": "I am not a doctor. (I'm not a doctor.)",
            "wrong": "I not am a doctor.",
            "note": "Kişi tanıtırken"
          },
          {
            "correct": "She isn't from Turkey.",
            "wrong": "She not is from Turkey.",
            "note": "Üçüncü tekil şahıs"
          }
        ]
      }
    },
    {
      "id": "step_2",
      "type": "multiple_choice",
      "title": "Pratik: Olumsuz Cümleler",
      "rule": "📌 KURAL: Özne + am/is/are + NOT + tamlayıcı",
      "instructions": "Aşağıdaki cümlelerde doğru olumsuz formu seçin:",
      "questions": [
        {
          "question": "I ___ a teacher.",
          "options": ["am not", "is not", "are not", "not am"],
          "correct": 0,
          "feedback_correct": "✅ Doğru! 'I am not a teacher.'",
          "feedback_wrong": "❌ İpucu: 'I' ile 'am not' kullanılır."
        },
        {
          "question": "She ___ from England.",
          "options": ["am not", "isn't", "aren't", "not is"],
          "correct": 1,
          "feedback_correct": "✅ Doğru! 'She isn't from England.'",
          "feedback_wrong": "❌ İpucu: 'She' ile 'isn't' kullanılır."
        }
      ]
    },
    {
      "id": "step_3",
      "type": "fill_blank",
      "title": "Boşluk Doldurma",
      "rule": "📌 KURAL: I → am not, He/She/It → isn't, You/We/They → aren't",
      "instructions": "Doğru olumsuz formu seçin:",
      "questions": [
        {
          "question": "I ___ (am not / isn't / aren't) a student.",
          "options": ["am not", "isn't", "aren't"],
          "correct": 0,
          "feedback_correct": "✅ Doğru! 'I am not a student.'",
          "feedback_wrong": "❌ İpucu: 'I' ile 'am not' kullanılır."
        },
        {
          "question": "He ___ (am not / isn't / aren't) a doctor.",
          "options": ["am not", "isn't", "aren't"],
          "correct": 1,
          "feedback_correct": "✅ Doğru! 'He isn't a doctor.'",
          "feedback_wrong": "❌ İpucu: 'He' ile 'isn't' kullanılır."
        }
      ]
    },
    {
      "id": "step_4",
      "type": "matching",
      "title": "Eşleştirme: Olumlu ve Olumsuz Formlar",
      "instructions": "Olumlu formları doğru olumsuz formlarıyla eşleştirin:",
      "pairs": [
        {"left": "I am", "right": "I am not"},
        {"left": "He is", "right": "He isn't"},
        {"left": "She is", "right": "She isn't"},
        {"left": "We are", "right": "We aren't"}
      ],
      "feedback_correct": "🎉 Harika! Tüm eşleştirmeler doğru!",
      "feedback_wrong": "😅 Bazı eşleştirmeler yanlış. Tekrar dene!"
    },
    {
      "id": "step_5",
      "type": "drag_drop",
      "title": "Sürükle-Bırak: Cümle Kurma",
      "instructions": "Kelimeleri doğru sıraya dizerek cümle oluşturun:",
      "sentence": "I am not a student.",
      "words": ["I", "am", "not", "a", "student", "."],
      "correct_order": [0, 1, 2, 3, 4, 5],
      "feedback_correct": "✅ Mükemmel! Doğru cümle: 'I am not a student.'",
      "feedback_wrong": "❌ Sıralama yanlış. İpucu: Özne + am/is/are + not + tamlayıcı"
    },
    {
      "id": "step_6",
      "type": "summary",
      "title": "🎉 Ders Özeti",
      "content": {
        "key_points": [
          "Olumsuz cümleler: Özne + am/is/are + NOT + tamlayıcı",
          "Kısaltmalar: I'm not, He isn't, She isn't, You aren't, We aren't, They aren't",
          "'am not'ın kısaltması yoktur (amn't kullanılmaz)"
        ],
        "practice_tasks": [
          "3 olumsuz cümle yazın (I am not ...)",
          "Bir arkadaşınız hakkında 3 olumsuz cümle yazın (He/She isn't ...)"
        ]
      }
    }
  ],
  "metadata": {
    "level": "A1",
    "title": "To Be Fiili - Olumsuz Cümleler",
    "duration": 45,
    "lesson_number": 1,
    "learning_objectives": [
      "'To be' fiilini (am/is/are) olumsuz yapmayı öğrenmek",
      "'not' kelimesinin doğru yerini kavramak",
      "Kısaltılmış formları (isn't, aren't) kullanmak"
    ]
  }
}`;

// Güncellenmiş Prompt - SADECE DESTEKLENEN TİPLER
const PROMPT_TEMPLATE = `Aşağıdaki JSON formatında sana verdiğim konularda bir ders içeriği oluştur.

JSON Formatı (DESTEKLENEN TİPLER: info, multiple_choice, fill_blank, matching, drag_drop, summary):

{
  "steps": [
    {
      "id": "step_1",
      "type": "info",
      "title": "Başlık",
      "content": {
        "explanation": "Açıklama metni",
        "rule": "📌 KURAL: Kural metni",
        "tip": "💡 İpucu metni",
        "items": [
          {"pronoun": "kelime", "meaning": "anlam"}
        ],
        "examples": [
          {
            "correct": "Doğru örnek cümle",
            "wrong": "Yanlış örnek cümle",
            "note": "Açıklama notu"
          }
        ]
      }
    },
    {
      "id": "step_2",
      "type": "multiple_choice",
      "title": "Test Başlığı",
      "rule": "📌 KURAL: Kural metni",
      "instructions": "Aşağıdaki cümlede doğru seçeneği işaretleyin:",
      "questions": [
        {
          "question": "Soru metni",
          "options": ["A seçeneği", "B seçeneği", "C seçeneği", "D seçeneği"],
          "correct": 0,
          "feedback_correct": "✅ Doğru! Açıklama",
          "feedback_wrong": "❌ Yanlış! İpucu"
        }
      ]
    },
    {
      "id": "step_3",
      "type": "fill_blank",
      "title": "Boşluk Doldurma",
      "rule": "📌 KURAL: Kural metni",
      "instructions": "Boşluğa uygun kelimeyi seçin:",
      "questions": [
        {
          "question": "I ___ a student.",
          "options": ["am", "is", "are"],
          "correct": 0,
          "feedback_correct": "✅ Doğru! Açıklama",
          "feedback_wrong": "❌ Yanlış! İpucu"
        }
      ]
    },
    {
      "id": "step_4",
      "type": "matching",
      "title": "Eşleştirme",
      "instructions": "Sol taraftaki kelimeleri sağ taraftaki anlamlarıyla eşleştirin:",
      "pairs": [
        {"left": "I", "right": "ben"},
        {"left": "you", "right": "sen"},
        {"left": "he", "right": "o"}
      ],
      "feedback_correct": "🎉 Harika! Tüm eşleştirmeler doğru!",
      "feedback_wrong": "😅 Bazı eşleştirmeler yanlış. Tekrar dene!"
    },
    {
      "id": "step_5",
      "type": "drag_drop",
      "title": "Sürükle-Bırak",
      "instructions": "Kelimeleri doğru sıraya dizerek cümle oluşturun:",
      "sentence": "I am a teacher.",
      "words": ["I", "am", "a", "teacher", "."],
      "correct_order": [0, 1, 2, 3, 4],
      "feedback_correct": "✅ Mükemmel! Doğru sıralama!",
      "feedback_wrong": "❌ Sıralama yanlış. Tekrar deneyin!"
    },
    {
      "id": "step_6",
      "type": "summary",
      "title": "🎉 Ders Özeti",
      "content": {
        "key_points": [
          "Önemli nokta 1",
          "Önemli nokta 2",
          "Önemli nokta 3"
        ],
        "practice_tasks": [
          "Pratik görevi 1",
          "Pratik görevi 2"
        ]
      }
    }
  ],
  "metadata": {
    "level": "A1",
    "title": "Ders Başlığı",
    "duration": 45,
    "lesson_number": 1,
    "learning_objectives": [
      "Öğrenim hedefi 1",
      "Öğrenim hedefi 2"
    ]
  }
}

KONU: [BURAYA KONUYU YAZIN]

KURALLAR:
1. Her step için benzersiz id kullan (step_1, step_2, ...)
2. type alanları SADECE: info, multiple_choice, fill_blank, matching, drag_drop, summary
3. multiple_choice: 4-5 seçenek, correct index 0'dan başlar
4. fill_blank: 3-4 seçenek, correct index 0'dan başlar
5. matching: pairs array'inde left/right eşleştirmeleri
6. drag_drop: words array'i ve correct_order array'i (index'ler 0'dan başlar)
7. summary: key_points ve practice_tasks array'leri
8. Tüm metinler Türkçe açıklamalar içermeli
9. Öğrenici seviyesine uygun kelimeler kullan (A1/A2/B1/B2)
10. Her bölümde emojiler kullan (📚, ✏️, 🎯, 💡, ✅, ❌, 🎉)
11. JSON geçerli olmalı (son virgül yok, tüm tırnaklar kapalı)
12. metadata kısmını mutlaka doldur

Bu formata TAM OLARAK uygun bir ders içeriği hazırla.`;

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
  const [showPrompt, setShowPrompt] = useState(false);

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
        contentJson = { steps: [] };
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

  const copyPrompt = () => {
    navigator.clipboard.writeText(PROMPT_TEMPLATE);
    setMessage({ type: "success", text: "✅ Prompt kopyalandı!" });
    setTimeout(() => setMessage(null), 2000);
  };

  const copyNewJsonExample = () => {
    navigator.clipboard.writeText(NEW_JSON_EXAMPLE);
    setMessage({ type: "success", text: "✅ Örnek JSON kopyalandı!" });
    setTimeout(() => setMessage(null), 2000);
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
          placeholder="Örn: To Be Fiili - Olumsuz"
        />

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <label style={styles.label}>İçerik (JSON)</label>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setShowPrompt(!showPrompt)}
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
                {showPrompt ? "Gizle" : "📋 Prompt"}
              </button>
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
          </div>
          <TextArea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='{"steps": [...]} veya boş bırakın'
            rows={8}
          />
          
          {showPrompt && (
            <div style={{ marginTop: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ fontSize: 11, color: colors.textSecondary }}>
                  📋 Prompt Template - AI'ya göndermek için kopyalayın
                </div>
                <button
                  onClick={copyPrompt}
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
              </div>
              <div style={{
                background: colors.surfaceDark,
                borderRadius: 8,
                padding: "12px",
                maxHeight: 300,
                overflowY: "auto",
                border: `1px solid ${colors.border}`,
                fontSize: 12,
                fontFamily: "monospace",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                color: colors.textSecondary,
                lineHeight: 1.6
              }}>
                {PROMPT_TEMPLATE}
              </div>
            </div>
          )}

          {showExample && (
            <div style={{ marginTop: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ fontSize: 11, color: colors.textSecondary }}>
                  📄 JSON Formatı Örneği
                </div>
                <button
                  onClick={copyNewJsonExample}
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
              </div>
              <JsonDisplay data={NEW_JSON_EXAMPLE} />
              
              <div style={{ marginTop: 12, padding: 12, background: colors.surfaceDark, borderRadius: 8, border: `1px solid ${colors.border}` }}>
                <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 6 }}>
                  💡 Kullanım Adımları:
                </div>
                <ol style={{ fontSize: 12, color: colors.textSecondary, margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
                  <li>📋 Prompt'u kopyalayın (yukarıdaki "Prompt" butonuna tıklayın)</li>
                  <li>🤖 ChatGPT/Claude'a gönderin ve konuyu belirtin</li>
                  <li>📥 AI size JSON formatında ders içeriği üretecek</li>
                  <li>📋 Üretilen JSON'u bu alana yapıştırın</li>
                  <li>📚 Dersi kaydedin</li>
                </ol>
              </div>
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
            {searchResults.map((lesson) => (
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
                  📝 {lesson.content_json?.steps?.length || 0} adım
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