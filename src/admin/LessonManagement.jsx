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

// Yeni JSON formatı - Çoktan seçmeli, boşluk doldurma, eşleştirme, sürükle-bırak
const NEW_JSON_EXAMPLE = `{
  "steps": [
    {
      "id": "step_1",
      "type": "info",
      "title": "Zamirleri Tanıyalım",
      "content": {
        "tip": "📝 İpucu: 'it' sadece cansız varlıklar ve hayvanlar için kullanılır.",
        "items": [
          {"meaning": "ben", "pronoun": "I"},
          {"meaning": "sen / siz", "pronoun": "you"},
          {"meaning": "o (erkek)", "pronoun": "he"},
          {"meaning": "o (kadın)", "pronoun": "she"},
          {"meaning": "o (eşya/hayvan)", "pronoun": "it"},
          {"meaning": "biz", "pronoun": "we"},
          {"meaning": "onlar", "pronoun": "they"}
        ],
        "explanation": "İngilizce'de özneleri belirten zamirler şunlardır:"
      }
    },
    {
      "id": "step_2",
      "type": "multiple_choice",
      "title": "Pratik: I Zamiri",
      "rule": "📌 KURAL: 'I' = ben. 'I' zamiri ile 'am' kullanılır.",
      "instructions": "Aşağıdaki cümlede doğru zamiri seçin:",
      "questions": [
        {
          "question": "___ am a student.",
          "options": ["I", "You", "He", "She"],
          "correct": 0,
          "feedback_correct": "✅ Doğru! 'I am a student.' = Ben öğrenciyim.",
          "feedback_wrong": "❌ İpucu: Cümlede 'am' kullanılmış. 'am' her zaman 'I' ile gelir."
        }
      ]
    },
    {
      "id": "step_3",
      "type": "fill_blank",
      "title": "Pratik: To Be Fiili",
      "rule": "📌 KURAL: I → am, He/She/It → is, You/We/They → are",
      "instructions": "Boşluğa uygun 'to be' fiilini seçin:",
      "questions": [
        {
          "question": "I ___ a student.",
          "options": ["am", "is", "are", "be"],
          "correct": 0,
          "feedback_correct": "✅ Doğru! 'I' ile 'am' kullanılır.",
          "feedback_wrong": "❌ İpucu: 'I' her zaman 'am' ile kullanılır."
        }
      ]
    },
    {
      "id": "step_4",
      "type": "matching",
      "title": "Eşleştirme: Zamirler ve Anlamları",
      "instructions": "Zamirleri doğru anlamlarıyla eşleştirin:",
      "pairs": [
        {"left": "I", "right": "ben"},
        {"left": "you", "right": "sen / siz"},
        {"left": "he", "right": "o (erkek)"},
        {"left": "she", "right": "o (kadın)"},
        {"left": "it", "right": "o (eşya/hayvan)"},
        {"left": "we", "right": "biz"},
        {"left": "they", "right": "onlar"}
      ],
      "feedback_correct": "🎉 Harika! Tüm eşleştirmeler doğru!",
      "feedback_wrong": "😅 Bazı eşleştirmeler yanlış. Tekrar dene!"
    },
    {
      "id": "step_5",
      "type": "drag_drop",
      "title": "Sürükle-Bırak: Cümle Kurma",
      "instructions": "Kelimeleri doğru sıraya dizerek cümle oluşturun:",
      "sentence": "I am a teacher.",
      "words": ["I", "am", "a", "teacher", "."],
      "correct_order": [0, 1, 2, 3, 4],
      "feedback_correct": "✅ Mükemmel! Doğru cümle: 'I am a teacher.'",
      "feedback_wrong": "❌ Sıralama yanlış. Tekrar deneyin!"
    },
    {
      "id": "step_6",
      "type": "dialogue",
      "title": "Diyalog",
      "content": {
        "context": "Ali ve Emma ilk kez tanışıyorlar.",
        "scenes": [
          {"speaker": "Ali", "text": "Hello! I am Ali.", "translation": "Merhaba! Ben Ali."},
          {"speaker": "Emma", "text": "Hi Ali! I am Emma.", "translation": "Merhaba Ali! Ben Emma."}
        ]
      },
      "practice": {
        "type": "multiple_choice",
        "instructions": "Diyalogdaki boşluğu doldurun:",
        "questions": [
          {
            "question": "Ali: Hello! I ___ Ali.",
            "options": ["am", "is", "are", "be"],
            "correct": 0,
            "feedback_correct": "✅ Doğru! 'I am Ali' = Ben Ali.",
            "feedback_wrong": "❌ İpucu: 'I' ile 'am' kullanılır."
          }
        ]
      }
    },
    {
      "id": "step_7",
      "type": "summary",
      "title": "🎉 Ders Özeti",
      "content": {
        "key_points": [
          "Zamirler: I, you, he, she, it, we, they",
          "To be: am (I), is (he/she/it), are (you/we/they)",
          "A/an: sessiz harf → a, sesli harf → an"
        ],
        "practice_tasks": [
          "Kendinizi İngilizce tanıtın (I am ...)",
          "3 arkadaşınızı tanıtın (He/She is ...)"
        ]
      }
    }
  ],
  "metadata": {
    "level": "A1",
    "title": "Kişiler ve Olumlama Cümleleri",
    "duration": 45,
    "lesson_number": 1,
    "learning_objectives": [
      "Subject pronouns'ları (I, you, he, she, it, we, they) öğrenmek",
      "'To be' fiilinin olumlu hallerini (am/is/are) kullanmak",
      "Meslek ve milliyetlerden önce a/an kullanımını kavramak"
    ]
  }
}`;

// Güncellenmiş Prompt
const PROMPT_TEMPLATE = `Aşağıdaki JSON formatında sana verdiğim konularda bir ders içeriği oluştur.

JSON Formatı:
{
  "steps": [
    {
      "id": "step_1",
      "type": "info",
      "title": "Başlık",
      "content": {
        "explanation": "Açıklama metni",
        "items": [{"key": "değer"}],
        "rule": "Kural",
        "tip": "İpucu",
        "table": [{"column1": "değer1", "column2": "değer2"}],
        "short_forms": "Kısaltmalar",
        "examples": [{"note": "not", "correct": "doğru", "wrong": "yanlış"}]
      }
    },
    {
      "id": "step_2",
      "type": "multiple_choice",
      "title": "Test Başlığı",
      "rule": "📌 KURAL: Kural metni",
      "instructions": "Talimatlar",
      "questions": [
        {
          "question": "Soru metni",
          "options": ["A", "B", "C", "D"],
          "correct": 0,
          "feedback_correct": "✅ Doğru geri bildirimi",
          "feedback_wrong": "❌ Yanlış geri bildirimi"
        }
      ]
    },
    {
      "id": "step_3",
      "type": "fill_blank",
      "title": "Boşluk Doldurma",
      "rule": "📌 KURAL: Kural metni",
      "instructions": "Talimatlar",
      "questions": [
        {
          "question": "Soru metni (___ ile göster)",
          "options": ["A", "B", "C", "D"],
          "correct": 0,
          "feedback_correct": "✅ Doğru geri bildirimi",
          "feedback_wrong": "❌ Yanlış geri bildirimi"
        }
      ]
    },
    {
      "id": "step_4",
      "type": "matching",
      "title": "Eşleştirme",
      "instructions": "Eşleştirme talimatı",
      "pairs": [
        {"left": "sol taraf", "right": "sağ taraf"}
      ],
      "feedback_correct": "🎉 Tüm eşleştirmeler doğru!",
      "feedback_wrong": "😅 Bazı eşleştirmeler yanlış."
    },
    {
      "id": "step_5",
      "type": "drag_drop",
      "title": "Sürükle-Bırak",
      "instructions": "Kelimeleri doğru sıraya dizin",
      "sentence": "Tam cümle",
      "words": ["kelime1", "kelime2", "kelime3"],
      "correct_order": [0, 1, 2],
      "feedback_correct": "✅ Doğru sıralama!",
      "feedback_wrong": "❌ Sıralama yanlış."
    },
    {
      "id": "step_6",
      "type": "dialogue",
      "title": "Diyalog Başlığı",
      "content": {
        "context": "Diyalog bağlamı",
        "scenes": [
          {"speaker": "Konuşmacı", "text": "Konuşma metni", "translation": "Türkçe çeviri"}
        ]
      },
      "practice": {
        "type": "multiple_choice",
        "instructions": "Pratik talimatı",
        "questions": [
          {
            "question": "Soru",
            "options": ["A", "B", "C", "D"],
            "correct": 0,
            "feedback_correct": "✅ Doğru",
            "feedback_wrong": "❌ Yanlış"
          }
        ]
      }
    },
    {
      "id": "step_7",
      "type": "summary",
      "title": "Özet Başlığı",
      "content": {
        "key_points": ["Önemli nokta 1", "Önemli nokta 2"],
        "practice_tasks": ["Pratik görevi 1", "Pratik görevi 2"]
      }
    }
  ],
  "metadata": {
    "level": "A1/A2/B1/B2",
    "title": "Ders başlığı",
    "duration": 45,
    "lesson_number": 1,
    "learning_objectives": ["Öğrenim hedefi 1", "Öğrenim hedefi 2"]
  }
}

Konu: [BURAYA KONUYU YAZIN]

Kurallar:
1. Her step için benzersiz id kullan (step_1, step_2, ...)
2. type alanları: info, multiple_choice, fill_blank, matching, drag_drop, dialogue, summary
3. multiple_choice: 4-5 seçenekli test soruları, correct index 0'dan başlar
4. fill_blank: Boşluk doldurma, options array'inden doğru cevabı seçme
5. matching: Sol-sağ eşleştirme, pairs array'i ile
6. drag_drop: Kelimeleri doğru sıraya dizme, correct_order array'i ile
7. dialogue: Diyalog + pratik sorusu (multiple_choice tipinde)
8. summary: Ders özeti
9. Türkçe açıklamalar ve örnek cümleler ekle
10. Öğrenici seviyesine uygun kelimeler kullan
11. Her bölümde emojiler kullan (📚, ✏️, 🎯, 💡, ✅, ❌)
12. JSON geçerli olmalı
13. metadata kısmını doldur

Bu formata uygun bir ders içeriği hazırla.`;

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
          placeholder="Örn: Greetings and Introductions"
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
                  📄 Yeni JSON Formatı Örneği
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
                  📝 {typeof lesson.content_json === 'object' && lesson.content_json.sections ? lesson.content_json.sections.length : Object.keys(lesson.content_json).length} bölüm
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