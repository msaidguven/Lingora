import { useState, useEffect } from "react";
import { supabase } from "./config.js";

import WordEditor from "./components/Admin/WordEditor.jsx";

const ADMIN_PASSWORD = "123456";


function AdminPanel({ onLogout }) {
  const [currentPage, setCurrentPage] = useState("add"); // "add" veya "edit"



if (currentPage === "edit") {
    return (
      <div style={{ minHeight: "100vh", background: "#0f0f1a", color: "#e2e8f0", fontFamily: "'Inter', system-ui, sans-serif", padding: "28px 20px 48px" }}>
        <WordEditor onBack={() => setCurrentPage("add")} />
      </div>
    );
  }

    return (
    <div style={{ minHeight: "100vh", background: "#0f0f1a", color: "#e2e8f0", fontFamily: "'Inter', system-ui, sans-serif", maxWidth: 560, margin: "0 auto", padding: "28px 20px 48px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 3, color: "#6366f1", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>WordFlow</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>Admin — Kelime Ekle</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>JSON formatında toplu kelime ekle</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          {/* Yeni: Düzenleme Sayfasına Git Butonu */}
          <button 
            onClick={() => setCurrentPage("edit")} 
            style={{ 
              background: "#6366f1", 
              border: "none", 
              borderRadius: 8, 
              padding: "6px 12px", 
              color: "#fff", 
              fontSize: 12, 
              cursor: "pointer" 
            }}
          >
            ✏️ Kelime Düzenle
          </button>
          
          <button onClick={onLogout} style={{ background: "#1e293b", border: "none", borderRadius: 8, padding: "6px 12px", color: "#64748b", fontSize: 12, cursor: "pointer" }}>
            Çıkış
          </button>
          
          {/* Son Eklenen Kelimeler kısmı mevcut */}
          {/* ... */}
        </div>
      </div>
      
      {/* Mevcut içerik (JSON ekleme) */}
      {/* ... */}
    </div>
  );
}



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

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

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

function AdminPanel({ onLogout }) {
  const [jsonInput, setJsonInput] = useState("");
  const [parsed, setParsed] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [status, setStatus] = useState(null);
  const [results, setResults] = useState([]);
  const [showExample, setShowExample] = useState(false);
  const [copied, setCopied] = useState(false);
  const [recentWords, setRecentWords] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  // Son 3 kelimeyi çek
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

  // Komponent yüklendiğinde ve kelime eklendiğinde son kelimeleri çek
  useEffect(() => {
    fetchRecentWords();
  }, []);

  // Yeni kelime eklendiğinde listeyi güncelle
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

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f1a", color: "#e2e8f0", fontFamily: "'Inter', system-ui, sans-serif", maxWidth: 560, margin: "0 auto", padding: "28px 20px 48px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 3, color: "#6366f1", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>WordFlow</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>Admin — Kelime Ekle</div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>JSON formatında toplu kelime ekle</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <button onClick={onLogout} style={{ background: "#1e293b", border: "none", borderRadius: 8, padding: "6px 12px", color: "#64748b", fontSize: 12, cursor: "pointer" }}>
            Çıkış
          </button>
          
          {/* Son Eklenen Kelimeler */}
          <div style={{ 
            background: "#1a1a2e", 
            border: "1px solid #1e293b", 
            borderRadius: 10, 
            padding: "10px 14px",
            minWidth: 180,
            maxWidth: 220
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

export default function Admin() {
  const [loggedIn, setLoggedIn] = useState(false);
  if (!loggedIn) return <LoginScreen onLogin={() => setLoggedIn(true)} />;
  return <AdminPanel onLogout={() => setLoggedIn(false)} />;
}