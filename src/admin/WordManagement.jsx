// admin/WordManagement.jsx
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../config.js";
import { 
  styles, colors, PageHeader, Tabs, Card, Message, 
  Input, TextArea, Badge, JsonDisplay, SearchInput 
} from "./adminStyles.jsx";

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
        "tr": "Bugün çok mutlu hissetti.",
        "learning_notes": ["'felt' kullanımı: hissetmek fiilinin geçmiş zamanı", "'very' + sıfat yapısı"]
      },
      {
        "en": "I am happy to see you.",
        "tr": "Seni gördüğüme mutluyum.",
        "learning_notes": ["'happy to + fiil' kalıbı: bir şey yapmaktan mutlu olmak"]
      }
    ]
  }
]`;

const PROMPT_TEXT = `Aşağıdaki kelimeleri analiz et. SADECE JSON array döndür, başka hiçbir şey yazma.

Her kelime için:
- 5 adet örnek cümle üret (examples array'i içinde)
- Bu cümleler kelimenin seviyesine (A1, A2, B1, B2) uygun olsun
- A1 ise tamamen A1 seviyesinde 5 cümle
- A2 ise A2 seviyesinde 5 cümle vb.
- Her cümle için Türkçe çeviri de ekle (en ve tr olarak)
- Her cümle için learning_notes array'i ekle: cümledeki önemli gramer yapısı, kalıp, deyim veya kullanım inceliğini açıklayan 1-2 kısa not (Türkçe). Not yoksa boş array [] bırak.

kelimenin diğer anlamlarını virgül ile ayır.
bu verdiğim kelimeler A1 seviyesinde.
Eğer verilen kelimelerin anlamı verilmişse ama eksik yada hata varsa düzelt. önce en çok kullanılan anlamını ver.
örnek: "run" kelimesi için: "koşmak, çalıştırmak, işletmek"

[
  {
    "word": "kelime",
    "meaning": "türkçe anlam (birden fazla ise virgülle ayır)",
    "level": "A1",
    "type": "word",
    "part_of_speech": ["noun", "verb", "adjective", "adverb"],
    "category": ["daily", "business", "travel", "food", "emotion", "health", "technology", "education", "social"],
    "difficulty": 1,
    "synonyms": ["eş1", "eş2"],
    "antonyms": ["zıt1", "zıt2"],
    "examples": [
      {"en": "English sentence 1", "tr": "Türkçe çeviri 1", "learning_notes": ["not1", "not2"]},
      {"en": "English sentence 2", "tr": "Türkçe çeviri 2", "learning_notes": []},
      {"en": "English sentence 3", "tr": "Türkçe çeviri 3", "learning_notes": []},
      {"en": "English sentence 4", "tr": "Türkçe çeviri 4", "learning_notes": []},
      {"en": "English sentence 5", "tr": "Türkçe çeviri 5", "learning_notes": []}
    ]
  }
]

Kelimeler: `;

export default function WordManagement({ onBack }) {
  const [activeTab, setActiveTab] = useState("add");

  const tabs = [
    { id: "add", label: "Kelime Ekle", icon: "➕" },
    { id: "edit", label: "Kelime Düzenle", icon: "✏️" },
  ];

  return (
    <div style={styles.container}>
      <PageHeader 
        title="📝 Kelime Yönetimi"
        subtitle="Kelime ekle, düzenle veya sil"
        onBack={onBack}
      />

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "add" ? <WordAdder /> : <WordEditor />}
    </div>
  );
}

// ============================
// KELİME EKLEME BİLEŞENİ
// ============================
function WordAdder() {
  const [jsonInput, setJsonInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showExample, setShowExample] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [results, setResults] = useState([]);
  const [copied, setCopied] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [recentWords, setRecentWords] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  const EXAMPLE_JSON = WORD_EXAMPLE_JSON;

  const fetchRecentWords = async () => {
    setLoadingRecent(true);
    try {
      const { data, error } = await supabase
        .from("en_words")
        .select("word, meaning, level, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

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

  const cleanJsonInput = (input) => {
    let cleaned = input.trim();
    cleaned = cleaned.replace(/^```json\s*/i, '');
    cleaned = cleaned.replace(/^```\s*/i, '');
    cleaned = cleaned.replace(/\s*```$/i, '');
    cleaned = cleaned.trim();
    
    if (!cleaned.startsWith('[') && !cleaned.startsWith('{')) {
      const firstBracket = cleaned.indexOf('[');
      const lastBracket = cleaned.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1 && firstBracket < lastBracket) {
        cleaned = cleaned.substring(firstBracket, lastBracket + 1);
      }
    }
    return cleaned;
  };

  const handleParse = () => {
    setMessage(null);
    setParsedData(null);
    setResults([]);
    
    try {
      const cleanedJson = cleanJsonInput(jsonInput);
      
      if (!cleanedJson) {
        throw new Error("JSON verisi boş.");
      }
      
      const data = JSON.parse(cleanedJson);
      
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
        if (item.examples && !Array.isArray(item.examples)) {
          throw new Error(`"${item.word}" için examples bir array olmalı`);
        }
        if (item.examples) {
          item.examples.forEach((ex) => {
            if (ex.learning_notes && !Array.isArray(ex.learning_notes)) {
              throw new Error(`"${item.word}" için learning_notes bir array olmalı`);
            }
          });
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

        let wordId;
        let wordStatus;

        if (existing) {
          wordId = existing.id;
          wordStatus = "zaten var";
          
          let addedExampleCount = 0;
          let existingExampleCount = 0;
          let errorExampleCount = 0;

          if (item.examples && Array.isArray(item.examples) && item.examples.length > 0) {
            for (const example of item.examples) {
              if (example.en && example.tr) {
                const { data: existingExample, error: exampleCheckError } = await supabase
                  .from("en_example_sentences")
                  .select("id")
                  .eq("word_id", wordId)
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
                      word_id: wordId,
                      sentence_en: example.en,
                      sentence_tr: example.tr,
                      difficulty: item.difficulty || 1,
                      order_index: 0,
                      source: "manual",
                      is_approved: true,
                      learning_notes: example.learning_notes || [],
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
          }

          let messageText = "";
          if (addedExampleCount > 0 && existingExampleCount === 0 && errorExampleCount === 0) {
            messageText = `${addedExampleCount} yeni cümle eklendi`;
          } else if (addedExampleCount > 0 && existingExampleCount > 0 && errorExampleCount === 0) {
            messageText = `${addedExampleCount} cümle eklendi, ${existingExampleCount} cümle zaten var`;
          } else if (addedExampleCount === 0 && existingExampleCount > 0 && errorExampleCount === 0) {
            messageText = `${existingExampleCount} cümle zaten var, yeni cümle eklenmedi`;
          } else if (addedExampleCount > 0 && errorExampleCount > 0) {
            messageText = `${addedExampleCount} cümle eklendi, ${errorExampleCount} hata`;
          } else if (errorExampleCount > 0 && addedExampleCount === 0) {
            messageText = `${errorExampleCount} cümle hatası`;
          } else {
            messageText = "Cümle işlemi tamamlandı";
          }

          resultList.push({ 
            word: item.word, 
            ok: true, 
            status: wordStatus,
            message: messageText,
            addedExampleCount,
            existingExampleCount,
            errorExampleCount
          });

        } else {
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
            .maybeSingle();

          if (insertError) throw insertError;
          
          wordId = inserted.id;
          wordStatus = "eklendi";

          let addedExampleCount = 0;
          if (item.examples && Array.isArray(item.examples) && item.examples.length > 0) {
            for (const example of item.examples) {
              if (example.en && example.tr) {
                const { error: insertExampleError } = await supabase
                  .from("en_example_sentences")
                  .insert({
                    word_id: wordId,
                    sentence_en: example.en,
                    sentence_tr: example.tr,
                    difficulty: item.difficulty || 1,
                    order_index: 0,
                    source: "manual",
                    is_approved: true,
                    learning_notes: example.learning_notes || [],
                  });

                if (insertExampleError) {
                  console.error("Cümle eklenemedi:", insertExampleError);
                } else {
                  addedExampleCount++;
                }
              }
            }
          }

          resultList.push({ 
            word: item.word, 
            ok: true, 
            status: wordStatus,
            message: addedExampleCount > 0 ? `${addedExampleCount} cümle eklendi` : "Cümle eklenmedi",
            addedExampleCount,
            existingExampleCount: 0,
            errorExampleCount: 0
          });
        }

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
    const addedCount = resultList.filter(r => r.status === "eklendi").length;
    const existsCount = resultList.filter(r => r.status === "zaten var").length;
    const totalAddedExamples = resultList.reduce((sum, r) => sum + (r.addedExampleCount || 0), 0);
    const totalExistingExamples = resultList.reduce((sum, r) => sum + (r.existingExampleCount || 0), 0);
    
    let successMessage = "";
    if (addedCount > 0 && existsCount === 0) {
      successMessage = `✅ ${addedCount} kelime eklendi`;
    } else if (addedCount === 0 && existsCount > 0) {
      successMessage = `ℹ️ ${existsCount} kelime zaten mevcut`;
    } else if (addedCount > 0 && existsCount > 0) {
      successMessage = `✅ ${addedCount} kelime eklendi, ⏭️ ${existsCount} kelime zaten mevcut`;
    }
    
    if (totalAddedExamples > 0 || totalExistingExamples > 0) {
      successMessage += `\n📝 ${totalAddedExamples} yeni cümle eklendi`;
      if (totalExistingExamples > 0) {
        successMessage += `, ⏭️ ${totalExistingExamples} cümle zaten mevcut`;
      }
    }
    
    if (failCount === 0) {
      setMessage({ type: "success", text: successMessage });
      setJsonInput("");
      setParsedData(null);
    } else {
      setMessage({ type: "error", text: `⚠️ ${successCount} başarılı, ${failCount} hata` });
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(PROMPT_TEXT);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2000);
  };

  const handleCopyExample = () => {
    navigator.clipboard.writeText(EXAMPLE_JSON);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUseExample = () => {
    setJsonInput(EXAMPLE_JSON);
    setMessage({ type: "success", text: "✅ Örnek JSON yüklendi! 'JSON Kontrol Et' butonuna tıklayın." });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div>
      <Message type={message?.type} text={message?.text} />

      <Card compact>
        <div style={{ fontSize: 10, letterSpacing: 2, color: colors.primary, fontWeight: 600, textTransform: "uppercase", marginBottom: 8 }}>
          📝 Son Eklenen Kelimeler
        </div>
        {loadingRecent ? (
          <div style={{ fontSize: 12, color: colors.textSecondary }}>Yükleniyor...</div>
        ) : recentWords.length > 0 ? (
          <div>
            {recentWords.map((word, index) => (
              <div key={index} style={styles.recentItem}>
                <div>
                  <span style={{ fontWeight: 600, color: colors.text }}>{word.word}</span>
                  <span style={{ color: colors.textSecondary, marginLeft: 8 }}>{word.meaning}</span>
                </div>
                <Badge text={word.level || "A1"} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: colors.textSecondary }}>Henüz kelime eklenmemiş</div>
        )}
      </Card>

      <Card small>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: colors.text }}>🤖 Yapay Zeka Promptu</div>
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
              {showPrompt ? "Gizle" : "Göster"}
            </button>
            <button
              onClick={handleCopyPrompt}
              style={{
                background: promptCopied ? colors.successBg : colors.surfaceLight,
                border: "none",
                borderRadius: 6,
                color: promptCopied ? colors.success : colors.textSecondary,
                fontSize: 11,
                padding: "4px 12px",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              {promptCopied ? "✓ Kopyalandı!" : "📋 Kopyala"}
            </button>
          </div>
        </div>
        {showPrompt && <div style={styles.promptBox}>{PROMPT_TEXT}</div>}
        {!showPrompt && (
          <div style={{ fontSize: 12, color: colors.textSecondary, padding: "8px 0" }}>
            💡 Prompt'u görmek için "Göster" butonuna tıklayın. AI'ya kelimeleri analiz ettirmek için kullanabilirsiniz.
          </div>
        )}
      </Card>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <label style={styles.label}>JSON Verisi</label>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={handleUseExample}
              style={{
                background: colors.surfaceLight,
                border: "none",
                borderRadius: 6,
                color: colors.textSecondary,
                fontSize: 10,
                padding: "4px 10px",
                cursor: "pointer"
              }}
            >
              Örnek Yükle
            </button>
            <button
              onClick={() => setShowExample(!showExample)}
              style={{
                background: "none",
                border: `1px solid ${colors.border}`,
                borderRadius: 6,
                color: colors.textSecondary,
                fontSize: 10,
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
          placeholder='[ { "word": "...", "meaning": "...", "examples": [ { "en": "...", "tr": "...", "learning_notes": [] } ] } ]'
          rows={10}
        />
        
        {showExample && (
          <div style={{ marginTop: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: colors.textSecondary }}>📄 Örnek JSON Formatı</span>
              <button
                onClick={handleCopyExample}
                style={{
                  background: copied ? colors.successBg : colors.surfaceLight,
                  border: "none",
                  borderRadius: 4,
                  color: copied ? colors.success : colors.textSecondary,
                  fontSize: 10,
                  padding: "4px 10px",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                {copied ? "✓ Kopyalandı!" : "📋 Kopyala"}
              </button>
            </div>
            <JsonDisplay data={EXAMPLE_JSON} />
          </div>
        )}

        {results.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: colors.text }}>Sonuçlar:</div>
            {results.map((r, i) => (
              <div key={i} style={styles.resultItem}>
                <span style={{ fontWeight: 600 }}>{r.word}</span>
                <span style={{ 
                  color: r.ok ? (r.status === "eklendi" ? colors.success : colors.textSecondary) : colors.error
                }}>
                  {r.ok ? (r.status === "eklendi" ? "✅ Eklendi" : "⏭️ Mevcut") : "❌ Hata"}
                  {r.message && ` - ${r.message}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={handleParse}
          disabled={!jsonInput.trim() || loading}
          style={styles.primaryButton(!jsonInput.trim() || loading)}
        >
          🔍 JSON Kontrol Et
        </button>
        
        {parsedData && (
          <button
            onClick={handleInsert}
            disabled={loading}
            style={styles.successButton(loading)}
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
function WordEditor() {
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
            is_approved,
            learning_notes
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
      examples: (word.en_example_sentences || []).map(e => ({
        ...e,
        learning_notes: e.learning_notes || [],
      })),
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

  const handleExampleNotesChange = (exampleId, value) => {
    const arr = value.split(",").map(s => s.trim()).filter(s => s);
    setFormData(prev => ({
      ...prev,
      examples: prev.examples.map(e =>
        e.id === exampleId ? { ...e, learning_notes: arr } : e
      ),
    }));
  };

  const saveExampleNotes = async (exampleId) => {
    const example = formData.examples.find(e => e.id === exampleId);
    if (!example) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("en_example_sentences")
        .update({ learning_notes: example.learning_notes || [] })
        .eq("id", exampleId);

      if (error) throw error;
      setMessage({ type: "success", text: "✅ Öğrenme notları güncellendi!" });
    } catch (error) {
      setMessage({ type: "error", text: "Notlar kaydedilemedi: " + error.message });
    } finally {
      setLoading(false);
    }
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
    <div>
      <Card>
        <SearchInput
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Kelime veya anlam ara..."
          loading={loading}
          onClear={() => {
            setSearchTerm("");
            setSearchResults([]);
            setMessage(null);
          }}
        />

        {searchResults.length > 0 && !selectedWord && (
          <div style={{ marginTop: 10, fontSize: 12, color: colors.textSecondary }}>
            {searchResults.length} kelime bulundu
          </div>
        )}

        <Message type={message?.type} text={message?.text} />
      </Card>

      {searchResults.length > 0 && !selectedWord && (
        <Card>
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {searchResults.map((word, index) => (
              <div 
                key={word.id}
                onClick={() => selectWord(word)}
                style={styles.listItem}
                onMouseEnter={(e) => e.currentTarget.style.background = colors.surfaceDark}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <div>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>{word.word}</span>
                  <span style={{ color: colors.textSecondary, marginLeft: 12, fontSize: 14 }}>{word.meaning}</span>
                  {word.en_example_sentences && (
                    <span style={{ 
                      fontSize: 10, 
                      color: colors.textMuted, 
                      marginLeft: 8,
                      background: colors.surfaceDark,
                      padding: "2px 8px",
                      borderRadius: 4
                    }}>
                      📝 {word.en_example_sentences.length} cümle
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Badge text={word.level || "A1"} />
                  <span style={{ 
                    fontSize: 10, 
                    background: colors.surfaceLight, 
                    color: colors.textSecondary, 
                    padding: "2px 10px", 
                    borderRadius: 4
                  }}>
                    ⭐ {word.difficulty || 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {selectedWord && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <span style={{ fontSize: 18, fontWeight: 800 }}>{selectedWord.word}</span>
              <span style={{ fontSize: 14, color: colors.textSecondary, marginLeft: 12 }}>#{selectedWord.id.slice(0, 8)}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button 
                onClick={() => setSelectedWord(null)}
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
                    onClick={deleteWord}
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
              label="Kelime"
              value={formData.word}
              onChange={(e) => handleFormChange("word", e.target.value)}
              disabled={!editing}
            />
            <Input
              label="Anlam"
              value={formData.meaning}
              onChange={(e) => handleFormChange("meaning", e.target.value)}
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
            <Input
              label="Zorluk (1-5)"
              type="number"
              min={1}
              max={5}
              value={formData.difficulty}
              onChange={(e) => handleFormChange("difficulty", Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))}
              disabled={!editing}
            />
            <Input
              label="Tür (virgülle ayır)"
              value={formData.part_of_speech.join(", ")}
              onChange={(e) => handleArrayChange("part_of_speech", e.target.value)}
              disabled={!editing}
              placeholder="noun, verb, adjective"
            />
            <Input
              label="Kategori (virgülle ayır)"
              value={formData.category.join(", ")}
              onChange={(e) => handleArrayChange("category", e.target.value)}
              disabled={!editing}
              placeholder="daily, business, travel"
            />
            <Input
              label="Eş Anlamlılar (virgülle ayır)"
              value={formData.synonyms.join(", ")}
              onChange={(e) => handleArrayChange("synonyms", e.target.value)}
              disabled={!editing}
              placeholder="joyful, cheerful"
            />
            <Input
              label="Zıt Anlamlılar (virgülle ayır)"
              value={formData.antonyms.join(", ")}
              onChange={(e) => handleArrayChange("antonyms", e.target.value)}
              disabled={!editing}
              placeholder="sad, unhappy"
            />
          </div>

          <div style={{ marginTop: 24, borderTop: `1px solid ${colors.border}`, paddingTop: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>📝 Örnek Cümleler ({formData.examples.length})</div>
            
            <div style={{ maxHeight: 400, overflowY: "auto" }}>
              {formData.examples.map((example, index) => (
                <div 
                  key={example.id || index}
                  style={{
                    padding: "10px 12px",
                    background: index % 2 === 0 ? colors.surfaceDark : "transparent",
                    borderRadius: 6,
                    marginBottom: 4
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: colors.text }}>{example.sentence_en}</div>
                      <div style={{ fontSize: 12, color: colors.textSecondary }}>{example.sentence_tr}</div>
                    </div>
                    {editing && (
                      <button
                        onClick={() => deleteExample(example.id)}
                        style={{
                          background: "none",
                          border: "none",
                          color: colors.error,
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

                  <div style={{ marginTop: 6 }}>
                    {!editing ? (
                      example.learning_notes && example.learning_notes.length > 0 ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                          {example.learning_notes.map((note, ni) => (
                            <span
                              key={ni}
                              style={{
                                fontSize: 11,
                                background: colors.surfaceLight,
                                color: colors.textSecondary,
                                padding: "2px 8px",
                                borderRadius: 4,
                                border: `1px solid ${colors.border}`
                              }}
                            >
                              💡 {note}
                            </span>
                          ))}
                        </div>
                      ) : null
                    ) : (
                      <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 6 }}>
                        <input
                          type="text"
                          value={(example.learning_notes || []).join(", ")}
                          onChange={(e) => handleExampleNotesChange(example.id, e.target.value)}
                          placeholder="Öğrenme notları (virgülle ayır)"
                          style={{
                            flex: 1,
                            fontSize: 12,
                            padding: "6px 10px",
                            borderRadius: 6,
                            border: `1px solid ${colors.border}`,
                            background: colors.surface,
                            color: colors.text
                          }}
                        />
                        <button
                          onClick={() => saveExampleNotes(example.id)}
                          disabled={loading}
                          style={{
                            fontSize: 11,
                            padding: "6px 10px",
                            borderRadius: 6,
                            border: "none",
                            background: colors.primary,
                            color: "#fff",
                            cursor: loading ? "not-allowed" : "pointer",
                            opacity: loading ? 0.6 : 1
                          }}
                        >
                          💾
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {formData.examples.length === 0 && (
                <div style={{ fontSize: 13, color: colors.textSecondary, padding: "12px 0", textAlign: "center" }}>
                  Henüz örnek cümle yok
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}