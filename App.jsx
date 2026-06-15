import { useState, useEffect } from "react";
import { supabase } from "./config.js";

const LEVELS = ["A1", "A2", "B1", "B2"];
const LEVEL_ORDER = { A1: 1, A2: 2, B1: 3, B2: 4 };
const LEVEL_COLOR = { A1: "#10b981", A2: "#3b82f6", B1: "#8b5cf6", B2: "#f59e0b" };
const LEVEL_CHOICES = { A1: 3, A2: 3, B1: 4, B2: 4 };
const LEVEL_DESC = {
  A1: "Hiç bilmiyorum, sıfırdan başlıyorum",
  A2: "Temel kelimeler biliyorum",
  B1: "Günlük konuşmayı anlıyorum",
  B2: "Akıcı konuşabiliyorum",
};

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

function buildSentenceOptions(correctSentence, allSentences, currentWordId, count) {
  // Aynı kelimeye ait diğer cümlelerin Türkçelerini bul
  const sameWordSentences = allSentences.filter(s => s.word_id === currentWordId && s.sentence_en !== correctSentence.sentence_en);
  const sameWordMeanings = sameWordSentences.map(s => s.sentence_tr).filter(Boolean);
  
  // Eğer aynı kelimeden yeterli çeldirici yoksa diğer kelimelerin cümlelerinden al
  let wrong = [...sameWordMeanings];
  if (wrong.length < count - 1) {
    const otherSentences = allSentences.filter(s => s.word_id !== currentWordId && s.sentence_tr);
    const otherMeanings = shuffle(otherSentences.map(s => s.sentence_tr));
    wrong = [...wrong, ...otherMeanings].slice(0, count - 1);
  } else {
    wrong = shuffle(wrong).slice(0, count - 1);
  }
  
  return shuffle([correctSentence.sentence_tr, ...wrong]);
}

const SpeakerIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
  </svg>
);

function WelcomeScreen({ onSelect }) {
  const [selected, setSelected] = useState(null);
  return (
    <div style={{ minHeight: "100vh", background: "#0f0f1a", color: "#e2e8f0", fontFamily: "'Inter', system-ui, sans-serif", maxWidth: 420, margin: "0 auto", display: "flex", flexDirection: "column", justifyContent: "center", padding: "32px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
        <div style={{ fontSize: 11, letterSpacing: 4, color: "#6366f1", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>WordFlow</div>
        <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.2, marginBottom: 8 }}>İngilizce Öğren</div>
        <div style={{ fontSize: 14, color: "#64748b" }}>Seviyeni seç, hemen başla.</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
        {LEVELS.map(lvl => {
          const isSelected = selected === lvl;
          const color = LEVEL_COLOR[lvl];
          return (
            <button key={lvl} onClick={() => setSelected(lvl)} style={{ padding: "16px 18px", borderRadius: 14, cursor: "pointer", textAlign: "left", border: `2px solid ${isSelected ? color : "#1e293b"}`, background: isSelected ? color + "18" : "#1a1a2e", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: isSelected ? color : "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: isSelected ? "#fff" : color, flexShrink: 0 }}>{lvl}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: isSelected ? "#e2e8f0" : "#94a3b8" }}>{lvl} Seviyesi</div>
                <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>{LEVEL_DESC[lvl]}</div>
              </div>
              {isSelected && <div style={{ marginLeft: "auto", color, fontSize: 18 }}>✓</div>}
            </button>
          );
        })}
      </div>
      <button onClick={() => selected && onSelect(selected)} disabled={!selected} style={{ padding: "16px", borderRadius: 14, border: "none", cursor: selected ? "pointer" : "not-allowed", background: selected ? "#6366f1" : "#1e1e30", color: selected ? "#fff" : "#475569", fontWeight: 700, fontSize: 16, transition: "all 0.2s" }}>
        {selected ? `${selected} Seviyesiyle Başla →` : "Seviye Seç"}
      </button>
    </div>
  );
}

function QuizScreen({ userLevel, onChangeLevel }) {
  const [mode, setMode] = useState("word");
  const [tab, setTab] = useState("quiz");
  const [allCards, setAllCards] = useState([]);
  const [allSentences, setAllSentences] = useState([]);
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
  const [showExampleModal, setShowExampleModal] = useState(false);
  const [selectedWordForExample, setSelectedWordForExample] = useState(null);
  const [exampleJsonInput, setExampleJsonInput] = useState("");
  const [exampleParseError, setExampleParseError] = useState(null);
  const [exampleStatus, setExampleStatus] = useState(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const choiceCount = LEVEL_CHOICES[userLevel];
  const levelColor = LEVEL_COLOR[userLevel];

  // Yeni soru gelince telaffuz et (kelime modunda kelimeyi, cümle modunda cümleyi)
  useEffect(() => {
    if (queue.length && !answered) {
      const current = queue[qIdx % queue.length];
      setTimeout(() => {
        if (mode === "word") {
          speak(current.word);
        } else {
          speak(current.sentence_en);
        }
      }, 100);
    }
  }, [qIdx, queue, answered, mode]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        if (mode === "word") {
          const { data: words, error: wordError } = await supabase
            .from("en_words")
            .select("*")
            .eq("type", "word");
          if (wordError) throw wordError;
          const cards = words || [];
          setAllCards(cards);
          
          if (cards.length > 0) {
            const wordIds = cards.map(c => c.id);
            const { data: examples, error: exampleError } = await supabase
              .from("en_example_sentences")
              .select("*")
              .in("word_id", wordIds)
              .order("order_index");
            
            if (!exampleError && examples) {
              const map = {};
              examples.forEach(ex => {
                if (!map[ex.word_id]) map[ex.word_id] = [];
                map[ex.word_id].push(ex);
              });
              setExamplesMap(map);
            }
          }
          setQueue(shuffle(cards));
        } else {
          // Cümle modu: en_example_sentences tablosundan cümleleri çek
          const { data: sentences, error: sentenceError } = await supabase
            .from("en_example_sentences")
            .select("*, en_words(word, meaning, level, part_of_speech)")
            .eq("is_approved", true);
          if (sentenceError) throw sentenceError;
          
          const validSentences = (sentences || []).filter(s => s.sentence_en && s.sentence_tr && s.en_words);
          setAllSentences(validSentences);
          
          // Kelime bilgilerini de çek (istatistik için)
          const { data: words } = await supabase
            .from("en_words")
            .select("*")
            .eq("type", "word");
          setAllCards(words || []);
          
          setQueue(shuffle(validSentences));
        }
      } catch (err) {
        setError("Veriler yüklenemedi. Supabase bağlantısını kontrol et.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    setQIdx(0);
    setSelected(null);
    setAnswered(false);
    setStats({});
  }, [userLevel, mode]);

  useEffect(() => {
    if (!queue.length) return;
    const current = queue[qIdx % queue.length];
    
    if (mode === "word") {
      setOptions(buildWordOptions(current, allCards, choiceCount));
    } else {
      setOptions(buildSentenceOptions(current, allSentences, current.word_id, choiceCount));
    }
    setSelected(null);
    setAnswered(false);
  }, [qIdx, queue, mode]);

  const generatePrompt = (word) => `Aşağıdaki kelime için A1-A2 seviyesinde 10 tane İngilizce örnek cümle hazırla. Her cümle için Türkçe anlamını da ekle. SADECE JSON array döndür, başka hiçbir şey yazma.

[
  {
    "sentence_en": "İngilizce cümle",
    "sentence_tr": "Türkçe çevirisi"
  }
]

Kelime: ${word}`;

  const handleCopyPrompt = (word) => {
    navigator.clipboard.writeText(generatePrompt(word));
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleParseAndSaveExamples = async () => {
    if (!exampleJsonInput.trim() || !selectedWordForExample) return;
    setExampleParseError(null);
    setExampleStatus("loading");
    
    try {
      const data = JSON.parse(exampleJsonInput.trim());
      if (!Array.isArray(data)) throw new Error("JSON bir array olmalı");
      
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        if (!item.sentence_en || !item.sentence_tr) continue;
        const { error } = await supabase
          .from("en_example_sentences")
          .insert({
            word_id: selectedWordForExample.id,
            sentence_en: item.sentence_en,
            sentence_tr: item.sentence_tr,
            order_index: i,
            source: "ai",
            is_approved: true
          });
        if (error) throw error;
      }
      
      const { data: newExamples } = await supabase
        .from("en_example_sentences")
        .select("*")
        .eq("word_id", selectedWordForExample.id)
        .order("order_index");
      
      setExamplesMap(prev => ({
        ...prev,
        [selectedWordForExample.id]: newExamples || []
      }));
      
      // Cümle modundaysak queue'yu yenile
      if (mode === "sentence") {
        const { data: sentences } = await supabase
          .from("en_example_sentences")
          .select("*, en_words(word, meaning, level, part_of_speech)")
          .eq("is_approved", true);
        const validSentences = (sentences || []).filter(s => s.sentence_en && s.sentence_tr && s.en_words);
        setAllSentences(validSentences);
        setQueue(shuffle(validSentences));
      }
      
      setExampleStatus("success");
      setTimeout(() => {
        setShowExampleModal(false);
        setExampleJsonInput("");
        setExampleStatus(null);
        setSelectedWordForExample(null);
      }, 1500);
      
    } catch (e) {
      setExampleParseError(e.message);
      setExampleStatus("error");
    }
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0f0f1a", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, fontFamily: "Inter, sans-serif" }}>
      <div style={{ fontSize: 36 }}>📚</div>
      <div style={{ color: "#64748b", fontSize: 14 }}>Veriler yükleniyor...</div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", background: "#0f0f1a", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, fontFamily: "Inter, sans-serif", padding: 24 }}>
      <div style={{ fontSize: 36 }}>⚠️</div>
      <div style={{ color: "#ef4444", fontSize: 14, textAlign: "center" }}>{error}</div>
      <button onClick={() => window.location.reload()} style={{ background: "#6366f1", border: "none", borderRadius: 10, padding: "10px 20px", color: "#fff", cursor: "pointer", fontWeight: 600 }}>Tekrar Dene</button>
    </div>
  );

  if (!queue.length) return (
    <div style={{ minHeight: "100vh", background: "#0f0f1a", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, fontFamily: "Inter, sans-serif", padding: 24 }}>
      <div style={{ fontSize: 36 }}>🗂️</div>
      <div style={{ color: "#64748b", fontSize: 14, textAlign: "center" }}>
        {mode === "word" 
          ? "Bu seviyede henüz kelime yok.\nSupabase'e kelime ekle!"
          : "Henüz örnek cümle yok.\nÖnce kelimelere cümle ekle!"}
      </div>
      <button onClick={onChangeLevel} style={{ background: "#1e293b", border: "none", borderRadius: 10, padding: "10px 20px", color: "#e2e8f0", cursor: "pointer", fontWeight: 600 }}>← Seviye Değiştir</button>
    </div>
  );

  const current = queue[qIdx % queue.length];
  const cardExamples = mode === "word" ? (examplesMap[current.id] || []) : [];
  
  const getCurrentWord = () => {
    if (mode === "word") return current;
    return current.en_words;
  };
  
  const currentWord = getCurrentWord();

  const handleSpeak = (text) => {
    setSpeaking(true);
    speak(text);
    setTimeout(() => setSpeaking(false), 1800);
  };

  const handleSelect = (opt) => {
    if (answered) return;
    setSelected(opt);
    setAnswered(true);
    const correctAnswer = mode === "word" ? current.meaning : current.sentence_tr;
    const isCorrect = opt === correctAnswer;
    
    const itemId = mode === "word" ? current.id : current.id;
    setStats(prev => {
      const cur = prev[itemId] || { correct: 0, wrong: 0 };
      return { ...prev, [itemId]: { correct: cur.correct + (isCorrect ? 1 : 0), wrong: cur.wrong + (isCorrect ? 0 : 1) } };
    });
  };

  const handleNext = () => setQIdx(i => i + 1);

  const totalCorrect = Object.values(stats).reduce((s, v) => s + v.correct, 0);
  const totalWrong = Object.values(stats).reduce((s, v) => s + v.wrong, 0);
  const totalAnswered = totalCorrect + totalWrong;
  const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
  const hardCards = allCards.filter(c => { const s = stats[c.id]; return s && s.wrong > s.correct; });

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f1a", color: "#e2e8f0", fontFamily: "'Inter', system-ui, sans-serif", maxWidth: 420, margin: "0 auto", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 3, color: "#6366f1", fontWeight: 700, textTransform: "uppercase" }}>WordFlow</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>İngilizce Öğren</div>
            <button onClick={onChangeLevel} style={{ background: levelColor + "22", border: `1px solid ${levelColor}44`, borderRadius: 6, padding: "2px 8px", color: levelColor, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{userLevel}</button>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {mode === "word" && currentWord && (
            <button 
              onClick={() => {
                setSelectedWordForExample(currentWord);
                setShowExampleModal(true);
                setExampleJsonInput("");
                setExampleParseError(null);
                setExampleStatus(null);
              }}
              style={{ background: "#1e293b", border: "none", borderRadius: 8, color: "#64748b", cursor: "pointer", fontSize: 11, padding: "6px 10px", display: "flex", alignItems: "center", gap: 4 }}
            >
              ✏️ Cümle Ekle
            </button>
          )}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "#64748b" }}>Doğruluk</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: accuracy >= 70 ? "#10b981" : accuracy >= 40 ? "#f59e0b" : totalAnswered === 0 ? "#475569" : "#ef4444" }}>
              {totalAnswered > 0 ? `%${accuracy}` : "—"}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 20px 10px", display: "flex", gap: 8 }}>
        {[{ id: "word", label: "📖 Kelimeler" }, { id: "sentence", label: "📝 Cümleler" }].map(m => (
          <button key={m.id} onClick={() => setMode(m.id)} style={{ flex: 1, padding: "8px 0", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, background: mode === m.id ? "#6366f1" : "#1e1e30", color: mode === m.id ? "#fff" : "#64748b" }}>{m.label}</button>
        ))}
      </div>

      <div style={{ padding: "0 20px 14px", display: "flex", gap: 8 }}>
        {[{ id: "quiz", label: "Quiz" }, { id: "stats", label: "İstatistik" }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12, background: "transparent", color: tab === t.id ? "#e2e8f0" : "#475569", borderBottom: tab === t.id ? "2px solid #6366f1" : "2px solid transparent" }}>{t.label}</button>
        ))}
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
              {mode === "word" && currentWord?.part_of_speech?.length > 0 && (
                <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 10 }}>
                  {currentWord.part_of_speech.map(p => (
                    <span key={p} style={{ fontSize: 10, color: "#6366f1", background: "#6366f122", padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>{p}</span>
                  ))}
                </div>
              )}
              <div style={{ fontSize: mode === "word" ? 28 : 18, fontWeight: mode === "word" ? 800 : 600, letterSpacing: -0.5, marginBottom: 14, lineHeight: 1.4 }}>
                {mode === "word" ? current.word : `"${current.sentence_en}"`}
              </div>
              <button onClick={() => handleSpeak(mode === "word" ? current.word : current.sentence_en)} style={{ background: speaking ? "#6366f1" : "#1e293b", border: "none", borderRadius: 10, padding: "7px 16px", color: "#e2e8f0", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, transition: "background 0.2s" }}>
                <SpeakerIcon /> {speaking ? "Çalıyor..." : "Telaffuz"}
              </button>
            </div>

            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10, fontWeight: 600 }}>
              {mode === "word" ? "Türkçe anlamı nedir?" : "Bu cümlenin Türkçesi nedir?"}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {options.map((opt, i) => {
                const correctAnswer = mode === "word" ? current.meaning : current.sentence_tr;
                const isCorrect = opt === correctAnswer;
                const isSelected = opt === selected;
                let bg = "#1a1a2e", border = "#1e293b", color = "#e2e8f0";
                if (answered) {
                  if (isCorrect) { bg = "#0e2d1f"; border = "#10b981"; color = "#10b981"; }
                  else if (isSelected) { bg = "#2d0e0e"; border = "#ef4444"; color = "#ef4444"; }
                  else { color = "#2d3748"; }
                }
                return (
                  <button key={i} onClick={() => handleSelect(opt)} style={{ padding: "13px 14px", borderRadius: 13, border: `1.5px solid ${border}`, background: bg, color, cursor: answered ? "default" : "pointer", fontWeight: 600, fontSize: 14, textAlign: "left", transition: "all 0.18s", display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, background: answered && isCorrect ? "#10b981" : answered && isSelected ? "#ef4444" : "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: answered && (isCorrect || isSelected) ? "#fff" : "#475569" }}>
                      {answered && isCorrect ? "✓" : answered && isSelected && !isCorrect ? "✗" : String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>

            {answered && (
              <div style={{ marginTop: 14, padding: "14px 16px", borderRadius: 14, background: selected === (mode === "word" ? current.meaning : current.sentence_tr) ? "#0e2d1f" : "#2d0e0e", border: `1px solid ${selected === (mode === "word" ? current.meaning : current.sentence_tr) ? "#10b981" : "#ef4444"}` }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: selected === (mode === "word" ? current.meaning : current.sentence_tr) ? "#10b981" : "#ef4444", marginBottom: 8 }}>
                  {selected === (mode === "word" ? current.meaning : current.sentence_tr) ? "✓ Doğru!" : `✗ Doğru cevap: "${mode === "word" ? current.meaning : current.sentence_tr}"`}
                </div>
                
                {mode === "word" && cardExamples.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>Örnek cümleler:</div>
                    {cardExamples.map((ex, idx) => (
                      <div key={idx} style={{ marginBottom: idx < cardExamples.length - 1 ? 10 : 0 }}>
                        <div style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic", lineHeight: 1.4 }}>"{ex.sentence_en}"</div>
                        {ex.sentence_tr && <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>"{ex.sentence_tr}"</div>}
                        <button onClick={() => handleSpeak(ex.sentence_en)} style={{ marginTop: 4, background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 10, display: "inline-flex", alignItems: "center", gap: 3, padding: 0 }}>
                          <SpeakerIcon /> Cümleyi dinle
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {mode === "sentence" && currentWord && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 11, color: "#64748b" }}>
                      Kelime: <span style={{ color: "#6366f1", fontWeight: 600 }}>{currentWord.word}</span> — {currentWord.meaning}
                    </div>
                  </div>
                )}
                
                {mode === "word" && (currentWord?.synonyms?.length > 0 || currentWord?.antonyms?.length > 0) && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #1e293b", display: "flex", gap: 16 }}>
                    {currentWord?.synonyms?.length > 0 && (
                      <div>
                        <div style={{ fontSize: 10, color: "#475569", marginBottom: 4 }}>Eş anlamlı</div>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {currentWord.synonyms.map(s => <span key={s} style={{ fontSize: 11, color: "#10b981", background: "#0e2d1f", padding: "2px 7px", borderRadius: 5 }}>{s}</span>)}
                        </div>
                      </div>
                    )}
                    {currentWord?.antonyms?.length > 0 && (
                      <div>
                        <div style={{ fontSize: 10, color: "#475569", marginBottom: 4 }}>Zıt anlamlı</div>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {currentWord.antonyms.map(a => <span key={a} style={{ fontSize: 11, color: "#ef4444", background: "#2d0e0e", padding: "2px 7px", borderRadius: 5 }}>{a}</span>)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {answered && (
              <button onClick={handleNext} style={{ marginTop: 12, width: "100%", padding: 15, borderRadius: 14, border: "none", background: "#6366f1", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                Sonraki →
              </button>
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
                <div style={{ height: "100%", width: `${accuracy}%`, background: accuracy >= 70 ? "#10b981" : accuracy >= 40 ? "#f59e0b" : "#ef4444", borderRadius: 99, transition: "width 0.5s" }} />
              </div>
            </div>
            <div style={{ background: "#1a1a2e", borderRadius: 14, padding: 16, marginBottom: 12 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>⚠️ Zorlandığın Kelimeler ({hardCards.length})</div>
              {hardCards.length === 0
                ? <div style={{ fontSize: 13, color: "#475569" }}>Henüz yok — harika gidiyorsun!</div>
                : hardCards.map(c => {
                  const s = stats[c.id];
                  return (
                    <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid #0f0f1a" }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{c.word}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>{c.meaning}</div>
                      </div>
                      <div style={{ fontSize: 11 }}>
                        <span style={{ color: "#10b981" }}>{s.correct}✓</span>
                        <span style={{ color: "#475569" }}> / </span>
                        <span style={{ color: "#ef4444" }}>{s.wrong}✗</span>
                      </div>
                    </div>
                  );
                })
              }
            </div>
          </>
        )}
      </div>

      {showExampleModal && selectedWordForExample && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.85)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            background: "#1a1a2e",
            borderRadius: 20,
            maxWidth: 500,
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: 24,
            border: "1px solid #1e293b"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>📝 Örnek Cümle Ekle</div>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>Kelime: <span style={{ color: "#6366f1", fontWeight: 700 }}>{selectedWordForExample.word}</span></div>
              </div>
              <button onClick={() => {
                setShowExampleModal(false);
                setExampleJsonInput("");
                setExampleParseError(null);
                setExampleStatus(null);
              }} style={{ background: "#1e293b", border: "none", borderRadius: 8, color: "#64748b", fontSize: 20, cursor: "pointer", width: 32, height: 32 }}>✕</button>
            </div>
            
            <div style={{ background: "#0f0f1a", borderRadius: 12, padding: 14, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>🤖 Yapay Zeka Promptu</div>
              <div style={{ background: "#1a1a2e", borderRadius: 8, padding: 12, fontSize: 11, color: "#e2e8f0", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-word", marginBottom: 10 }}>
                {generatePrompt(selectedWordForExample.word)}
              </div>
              <button onClick={() => handleCopyPrompt(selectedWordForExample.word)} style={{ background: copiedPrompt ? "#0e2d1f" : "#1e293b", border: "none", borderRadius: 8, color: copiedPrompt ? "#10b981" : "#94a3b8", fontSize: 12, padding: "6px 12px", cursor: "pointer" }}>
                {copiedPrompt ? "✓ Kopyalandı!" : "📋 Promptu Kopyala"}
              </button>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>JSON Çıktısını Yapıştır</div>
              <textarea
                value={exampleJsonInput}
                onChange={e => { setExampleJsonInput(e.target.value); setExampleParseError(null); setExampleStatus(null); }}
                placeholder='[{"sentence_en": "...", "sentence_tr": "..."}]'
                rows={8}
                style={{ width: "100%", boxSizing: "border-box", background: "#0f0f1a", border: `1px solid ${exampleParseError ? "#ef4444" : "#1e293b"}`, borderRadius: 12, padding: 12, color: "#e2e8f0", fontSize: 11, fontFamily: "monospace", resize: "vertical", outline: "none" }}
              />
              {exampleParseError && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 6 }}>⚠️ {exampleParseError}</div>}
            </div>
            
            <button
              onClick={handleParseAndSaveExamples}
              disabled={!exampleJsonInput.trim() || exampleStatus === "loading"}
              style={{ width: "100%", padding: 14, borderRadius: 12, border: "none", background: exampleJsonInput.trim() ? "#6366f1" : "#1e1e30", color: exampleJsonInput.trim() ? "#fff" : "#475569", fontWeight: 700, fontSize: 14, cursor: exampleJsonInput.trim() ? "pointer" : "not-allowed" }}
            >
              {exampleStatus === "loading" ? "Kaydediliyor..." : exampleStatus === "success" ? "✓ Kaydedildi!" : "💾 Örnek Cümleleri Kaydet"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [userLevel, setUserLevel] = useState(null);
  if (!userLevel) return <WelcomeScreen onSelect={setUserLevel} />;
  return <QuizScreen userLevel={userLevel} onChangeLevel={() => setUserLevel(null)} />;
}