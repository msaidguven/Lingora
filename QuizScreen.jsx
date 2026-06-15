import { useState, useEffect } from "react";
import { supabase } from "./config.js";

const FIXED_USER_ID = "302a3b6b-c1e9-49c4-98fe-52115bd7d204";
const LEVEL_CHOICES = { A1: 3, A2: 3, B1: 4, B2: 4 };
const LEVEL_COLOR = { A1: "#10b981", A2: "#3b82f6", B1: "#8b5cf6", B2: "#f59e0b" };

function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = "en-US";
  utt.rate = 0.85;
  const voices = window.speechSynthesis.getVoices();
  const eng = voices.find(v => v.lang.startsWith("en") && v.localService);
  if (eng) utt.voice = eng;
  window.speechSynthesis.speak(utt);
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildWordOptions(correct, allCards, count) {
  const others = allCards.filter(c => c.id !== correct.id).map(c => c.meaning);
  const wrong = shuffle(others).slice(0, count - 1);
  return shuffle([correct.meaning, ...wrong]);
}

const SpeakerIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
  </svg>
);

export default function QuizScreen({ userLevel, onChangeLevel, mode = "review", newWord = null }) {
  const [tab, setTab] = useState("quiz");
  const [allCards, setAllCards] = useState([]);
  const [examplesMap, setExamplesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [queue, setQueue] = useState([]);
  const [qIdx, setQIdx] = useState(0);
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [stats, setStats] = useState({});
  const [saving, setSaving] = useState(false);

  const choiceCount = LEVEL_CHOICES[userLevel];
  const levelColor = LEVEL_COLOR[userLevel];

  // Yeni kelime gelince telaffuz et
  useEffect(() => {
    if (queue.length && !answered) {
      const current = queue[qIdx % queue.length];
      setTimeout(() => speak(current.word), 100);
    }
  }, [qIdx, queue, answered]);

  // Verileri yükle
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        if (mode === "new" && newWord) {
          // Yeni kelime modu: tek kelime göster
          setAllCards([newWord]);
          setQueue([newWord]);
          
          // Örnek cümleleri çek
          const { data: examples } = await supabase
            .from("en_example_sentences")
            .select("*")
            .eq("word_id", newWord.id)
            .order("order_index");
          
          if (examples) {
            setExamplesMap({ [newWord.id]: examples });
          }
        } else {
          // Tekrar modu: next_review_at geçmiş kelimeleri çek
          const { data: userWords, error: uwError } = await supabase
            .from("en_user_words")
            .select("word_id, next_review_at")
            .eq("user_id", FIXED_USER_ID)
            .lt("next_review_at", new Date().toISOString());
          
          if (uwError) throw uwError;
          
          if (!userWords || userWords.length === 0) {
            setQueue([]);
            setLoading(false);
            return;
          }
          
          const wordIds = userWords.map(w => w.word_id);
          
          const { data: words, error: wError } = await supabase
            .from("en_words")
            .select("*")
            .in("id", wordIds);
          
          if (wError) throw wError;
          
          setAllCards(words || []);
          setQueue(shuffle(words || []));
          
          // Örnek cümleleri çek
          if (words && words.length > 0) {
            const { data: examples } = await supabase
              .from("en_example_sentences")
              .select("*")
              .in("word_id", wordIds)
              .order("order_index");
            
            if (examples) {
              const map = {};
              examples.forEach(ex => {
                if (!map[ex.word_id]) map[ex.word_id] = [];
                map[ex.word_id].push(ex);
              });
              setExamplesMap(map);
            }
          }
        }
      } catch (err) {
        setError("Veriler yüklenemedi.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    setQIdx(0);
    setSelected(null);
    setAnswered(false);
    setStats({});
  }, [mode, newWord]);

  // Şıkları oluştur
  useEffect(() => {
    if (!queue.length) return;
    const current = queue[qIdx % queue.length];
    setOptions(buildWordOptions(current, allCards, choiceCount));
    setSelected(null);
    setAnswered(false);
  }, [qIdx, queue, allCards, choiceCount]);

  // Sonucu kaydet (SRS)
  const saveWordResult = async (wordId, isCorrect) => {
    setSaving(true);
    const now = new Date();
    let nextReviewDate = new Date();
    
    if (isCorrect) {
      // Doğru: 1 gün sonra
      nextReviewDate.setDate(now.getDate() + 1);
    } else {
      // Yanlış: 0 gün sonra (hemen tekrar)
      nextReviewDate = now;
    }
    
    // Var mı kontrol et
    const { data: existing } = await supabase
      .from("en_user_words")
      .select("id, review_count")
      .eq("user_id", FIXED_USER_ID)
      .eq("word_id", wordId)
      .single();
    
    if (existing) {
      // Güncelle
      await supabase
        .from("en_user_words")
        .update({
          next_review_at: nextReviewDate.toISOString(),
          review_count: existing.review_count + 1,
          last_score: isCorrect ? 100 : 0,
          last_reviewed_at: now.toISOString()
        })
        .eq("id", existing.id);
    } else if (mode === "new") {
      // Yeni kelime: havuza ekle
      await supabase
        .from("en_user_words")
        .insert({
          user_id: FIXED_USER_ID,
          word_id: wordId,
          added_at: now.toISOString(),
          next_review_at: nextReviewDate.toISOString(),
          review_count: 1,
          last_score: isCorrect ? 100 : 0,
          last_reviewed_at: now.toISOString(),
          ease_factor: 2.5
        });
      
      // Günlük limiti 1 azalt
      const { data: daily } = await supabase
        .from("en_user_daily_limit")
        .select("remaining_today")
        .eq("user_id", FIXED_USER_ID)
        .single();
      
      if (daily && daily.remaining_today > 0) {
        await supabase
          .from("en_user_daily_limit")
          .update({ remaining_today: daily.remaining_today - 1 })
          .eq("user_id", FIXED_USER_ID);
      }
    }
    setSaving(false);
  };

  const handleSelect = async (opt) => {
    if (answered || saving) return;
    const current = queue[qIdx % queue.length];
    const isCorrect = opt === current.meaning;
    
    setSelected(opt);
    setAnswered(true);
    
    // İstatistikleri güncelle
    setStats(prev => {
      const cur = prev[current.id] || { correct: 0, wrong: 0 };
      return { ...prev, [current.id]: { correct: cur.correct + (isCorrect ? 1 : 0), wrong: cur.wrong + (isCorrect ? 0 : 1) } };
    });
    
    // SRS kaydet
    await saveWordResult(current.id, isCorrect);
  };

  const handleNext = () => setQIdx(i => i + 1);

  const totalCorrect = Object.values(stats).reduce((s, v) => s + v.correct, 0);
  const totalWrong = Object.values(stats).reduce((s, v) => s + v.wrong, 0);
  const totalAnswered = totalCorrect + totalWrong;
  const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f0f1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#64748b" }}>Yükleniyor...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f0f1a", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, padding: 24 }}>
        <div style={{ fontSize: 36 }}>⚠️</div>
        <div style={{ color: "#ef4444", fontSize: 14, textAlign: "center" }}>{error}</div>
        <button onClick={onChangeLevel} style={{ background: "#6366f1", border: "none", borderRadius: 10, padding: "10px 20px", color: "#fff", cursor: "pointer" }}>Geri Dön</button>
      </div>
    );
  }

  if (!queue.length) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f0f1a", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 48 }}>🎉</div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>
          {mode === "new" ? "Tebrikler! Yeni kelime havuzuna eklendi." : "Bugün tekrarlanacak kelime yok!"}
        </div>
        <div style={{ fontSize: 13, color: "#64748b" }}>
          {mode === "new" ? "Yeni kelimeler açmaya devam edebilirsin." : "Yarın tekrar gel, yeni kelimeler seni bekliyor."}
        </div>
        <button onClick={onChangeLevel} style={{ background: "#6366f1", border: "none", borderRadius: 10, padding: "12px 24px", color: "#fff", cursor: "pointer", fontWeight: 600, marginTop: 16 }}>
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  const current = queue[qIdx % queue.length];
  const cardExamples = examplesMap[current.id] || [];

  const handleSpeak = (text) => {
    setSpeaking(true);
    speak(text);
    setTimeout(() => setSpeaking(false), 1800);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f1a", color: "#e2e8f0", fontFamily: "'Inter', system-ui, sans-serif", maxWidth: 420, margin: "0 auto", display: "flex", flexDirection: "column" }}>
      
      
      // QuizScreen'in header kısmını şöyle değiştir:

<div style={{ padding: "20px 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
  <div>
    <div style={{ fontSize: 10, letterSpacing: 3, color: "#6366f1", fontWeight: 700, textTransform: "uppercase" }}>WordFlow</div>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
      <div style={{ fontSize: 18, fontWeight: 800 }}>{mode === "new" ? "🎁 Yeni Kelime" : "🔄 Tekrar"}</div>
      <button onClick={onChangeLevel} style={{ background: levelColor + "22", border: `1px solid ${levelColor}44`, borderRadius: 6, padding: "2px 8px", color: levelColor, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{userLevel}</button>
    </div>
  </div>
  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
    <button 
      onClick={onChangeLevel}
      style={{ background: "#1e293b", border: "none", borderRadius: 8, color: "#64748b", cursor: "pointer", fontSize: 11, padding: "6px 10px", display: "flex", alignItems: "center", gap: 4 }}
    >
      🏠 Ana Sayfa
    </button>
    <div style={{ textAlign: "right" }}>
      <div style={{ fontSize: 10, color: "#64748b" }}>Doğruluk</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: accuracy >= 70 ? "#10b981" : accuracy >= 40 ? "#f59e0b" : "#475569" }}>
        {totalAnswered > 0 ? `%${accuracy}` : "—"}
      </div>
    </div>
  </div>
</div>
      
      
      <div style={{ padding: "20px 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 3, color: "#6366f1", fontWeight: 700, textTransform: "uppercase" }}>WordFlow</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{mode === "new" ? "🎁 Yeni Kelime" : "🔄 Tekrar"}</div>
            <button onClick={onChangeLevel} style={{ background: levelColor + "22", border: `1px solid ${levelColor}44`, borderRadius: 6, padding: "2px 8px", color: levelColor, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{userLevel}</button>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, color: "#64748b" }}>Doğruluk</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: accuracy >= 70 ? "#10b981" : accuracy >= 40 ? "#f59e0b" : "#475569" }}>
            {totalAnswered > 0 ? `%${accuracy}` : "—"}
          </div>
        </div>
      </div>

      <div style={{ padding: "0 20px 14px", display: "flex", gap: 8 }}>
        <button onClick={() => setTab("quiz")} style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12, background: "transparent", color: tab === "quiz" ? "#e2e8f0" : "#475569", borderBottom: tab === "quiz" ? "2px solid #6366f1" : "2px solid transparent" }}>Quiz</button>
        <button onClick={() => setTab("stats")} style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12, background: "transparent", color: tab === "stats" ? "#e2e8f0" : "#475569", borderBottom: tab === "stats" ? "2px solid #6366f1" : "2px solid transparent" }}>İstatistik</button>
      </div>

      <div style={{ flex: 1, padding: "0 20px 24px", overflowY: "auto" }}>
        {tab === "quiz" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#475569", marginBottom: 6 }}>
              <span>{(qIdx % queue.length) + 1} / {queue.length}</span>
              <span style={{ color: levelColor, fontWeight: 700 }}>{choiceCount} şık</span>
            </div>
            <div style={{ height: 3, background: "#1e1e30", borderRadius: 99, marginBottom: 18, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${((qIdx % queue.length) / queue.length) * 100}%`, background: levelColor, borderRadius: 99, transition: "width 0.4s" }} />
            </div>

            <div style={{ background: "linear-gradient(135deg, #1a1a2e, #16213e)", border: "1px solid #1e293b", borderRadius: 20, padding: "26px 22px", textAlign: "center", marginBottom: 18 }}>
              {current.part_of_speech?.length > 0 && (
                <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 10 }}>
                  {current.part_of_speech.map(p => (
                    <span key={p} style={{ fontSize: 10, color: "#6366f1", background: "#6366f122", padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>{p}</span>
                  ))}
                </div>
              )}
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5, marginBottom: 14 }}>{current.word}</div>
              <button onClick={() => handleSpeak(current.word)} style={{ background: speaking ? "#6366f1" : "#1e293b", border: "none", borderRadius: 10, padding: "7px 16px", color: "#e2e8f0", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600 }}>
                <SpeakerIcon /> {speaking ? "Çalıyor..." : "Telaffuz"}
              </button>
            </div>

            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10, fontWeight: 600 }}>Türkçe anlamı nedir?</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {options.map((opt, i) => {
                const isCorrect = opt === current.meaning;
                const isSelected = opt === selected;
                let bg = "#1a1a2e", border = "#1e293b", color = "#e2e8f0";
                if (answered) {
                  if (isCorrect) { bg = "#0e2d1f"; border = "#10b981"; color = "#10b981"; }
                  else if (isSelected) { bg = "#2d0e0e"; border = "#ef4444"; color = "#ef4444"; }
                  else { color = "#2d3748"; }
                }
                return (
                  <button key={i} onClick={() => handleSelect(opt)} disabled={answered || saving} style={{ padding: "13px 14px", borderRadius: 13, border: `1.5px solid ${border}`, background: bg, color, cursor: (answered || saving) ? "default" : "pointer", fontWeight: 600, fontSize: 14, textAlign: "left", transition: "all 0.18s", display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, background: answered && isCorrect ? "#10b981" : answered && isSelected ? "#ef4444" : "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: answered && (isCorrect || isSelected) ? "#fff" : "#475569" }}>
                      {answered && isCorrect ? "✓" : answered && isSelected && !isCorrect ? "✗" : String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>

            {answered && (
              <div style={{ marginTop: 14, padding: "14px 16px", borderRadius: 14, background: selected === current.meaning ? "#0e2d1f" : "#2d0e0e", border: `1px solid ${selected === current.meaning ? "#10b981" : "#ef4444"}` }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: selected === current.meaning ? "#10b981" : "#ef4444", marginBottom: 8 }}>
                  {selected === current.meaning ? "✓ Doğru!" : `✗ Doğru cevap: "${current.meaning}"`}
                </div>
                
                {cardExamples.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>Örnek cümleler:</div>
                    {cardExamples.slice(0, 2).map((ex, idx) => (
                      <div key={idx} style={{ marginBottom: idx < 1 ? 10 : 0 }}>
                        <div style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic", lineHeight: 1.4 }}>"{ex.sentence_en}"</div>
                        {ex.sentence_tr && <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>"{ex.sentence_tr}"</div>}
                        <button onClick={() => handleSpeak(ex.sentence_en)} style={{ marginTop: 4, background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 10, display: "inline-flex", alignItems: "center", gap: 3, padding: 0 }}>
                          <SpeakerIcon /> Cümleyi dinle
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {(current.synonyms?.length > 0 || current.antonyms?.length > 0) && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #1e293b", display: "flex", gap: 16 }}>
                    {current.synonyms?.length > 0 && (
                      <div>
                        <div style={{ fontSize: 10, color: "#475569", marginBottom: 4 }}>Eş anlamlı</div>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {current.synonyms.slice(0, 3).map(s => <span key={s} style={{ fontSize: 11, color: "#10b981", background: "#0e2d1f", padding: "2px 7px", borderRadius: 5 }}>{s}</span>)}
                        </div>
                      </div>
                    )}
                    {current.antonyms?.length > 0 && (
                      <div>
                        <div style={{ fontSize: 10, color: "#475569", marginBottom: 4 }}>Zıt anlamlı</div>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {current.antonyms.slice(0, 3).map(a => <span key={a} style={{ fontSize: 11, color: "#ef4444", background: "#2d0e0e", padding: "2px 7px", borderRadius: 5 }}>{a}</span>)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {answered && !saving && (
              <button onClick={handleNext} style={{ marginTop: 12, width: "100%", padding: 15, borderRadius: 14, border: "none", background: "#6366f1", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                {qIdx + 1 >= queue.length ? "🏁 Bitir" : "Sonraki →"}
              </button>
            )}
            
            {saving && (
              <div style={{ marginTop: 12, textAlign: "center", fontSize: 12, color: "#64748b" }}>
                Kaydediliyor...
              </div>
            )}
          </>
        )}

        {tab === "stats" && (
          <>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>İstatistikler</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
              {[{ label: "Toplam", val: totalAnswered, icon: "📝" }, { label: "Doğru", val: totalCorrect, icon: "✅" }, { label: "Yanlış", val: totalWrong, icon: "❌" }].map(({ label, val, icon }) => (
                <div key={label} style={{ background: "#1a1a2e", borderRadius: 14, padding: "14px 8px", textAlign: "center" }}>
                  <div style={{ fontSize: 22 }}>{icon}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>{val}</div>
                  <div style={{ fontSize: 10, color: "#64748b" }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{ background: "#1a1a2e", borderRadius: 14, padding: 16, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, fontWeight: 600 }}>
                <span>Genel Doğruluk</span>
                <span style={{ color: accuracy >= 70 ? "#10b981" : accuracy >= 40 ? "#f59e0b" : "#ef4444" }}>%{accuracy}</span>
              </div>
              <div style={{ height: 8, background: "#0f0f1a", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${accuracy}%`, background: accuracy >= 70 ? "#10b981" : accuracy >= 40 ? "#f59e0b" : "#ef4444", borderRadius: 99 }} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}