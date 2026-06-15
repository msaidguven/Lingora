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

function buildSentenceOptions(correctSentence, allSentences, currentWordId, count) {
  const sameWordSentences = allSentences.filter(s => s.word_id === currentWordId && s.id !== correctSentence.id);
  const sameWordMeanings = sameWordSentences.map(s => s.sentence_tr).filter(Boolean);
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

export default function QuizScreen({ userLevel, onChangeLevel }) {
  const [quizType, setQuizType] = useState("word");
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
  const [saving, setSaving] = useState(false);
  const [showExampleModal, setShowExampleModal] = useState(false);
  const [selectedWordForExample, setSelectedWordForExample] = useState(null);
  const [exampleJsonInput, setExampleJsonInput] = useState("");
  const [exampleParseError, setExampleParseError] = useState(null);
  const [exampleStatus, setExampleStatus] = useState(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const choiceCount = LEVEL_CHOICES[userLevel];
  const levelColor = LEVEL_COLOR[userLevel];

  useEffect(() => {
    if (queue.length && !answered) {
      const current = queue[qIdx % queue.length];
      setTimeout(() => {
        if (quizType === "word") {
          speak(current.word);
        } else {
          speak(current.sentence_en);
        }
      }, 100);
    }
  }, [qIdx, queue, answered, quizType]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        if (quizType === "word") {
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
        } else {
          const { data: userSentences, error: usError } = await supabase
            .from("en_user_sentences")
            .select("sentence_id, next_review_at")
            .eq("user_id", FIXED_USER_ID)
            .lt("next_review_at", new Date().toISOString());
          
          if (usError) throw usError;
          
          if (!userSentences || userSentences.length === 0) {
            setQueue([]);
            setLoading(false);
            return;
          }
          
          const sentenceIds = userSentences.map(s => s.sentence_id);
          
          const { data: sentences, error: sError } = await supabase
            .from("en_example_sentences")
            .select("*, en_words(word, meaning, level, part_of_speech)")
            .in("id", sentenceIds)
            .eq("is_approved", true);
          
          if (sError) throw sError;
          
          const validSentences = (sentences || []).filter(s => s.sentence_en && s.sentence_tr && s.en_words);
          setAllSentences(validSentences);
          setQueue(shuffle(validSentences));
          
          const { data: words } = await supabase
            .from("en_words")
            .select("*")
            .eq("type", "word");
          setAllCards(words || []);
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
  }, [quizType]);

  useEffect(() => {
    if (!queue.length) return;
    const current = queue[qIdx % queue.length];
    if (quizType === "word") {
      setOptions(buildWordOptions(current, allCards, choiceCount));
    } else {
      setOptions(buildSentenceOptions(current, allSentences, current.word_id, choiceCount));
    }
    setSelected(null);
    setAnswered(false);
  }, [qIdx, queue, quizType, allCards, allSentences, choiceCount]);

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

      const newSentenceIds = [];
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        if (!item.sentence_en || !item.sentence_tr) continue;
        
        const { data: inserted, error } = await supabase
          .from("en_example_sentences")
          .insert({
            word_id: selectedWordForExample.id,
            sentence_en: item.sentence_en,
            sentence_tr: item.sentence_tr,
            order_index: i,
            source: "ai",
            is_approved: true
          })
          .select();
        
        if (error) throw error;
        if (inserted) newSentenceIds.push(inserted[0].id);
      }

      if (newSentenceIds.length > 0) {
        const now = new Date();
        const today = new Date();
        
        const inserts = newSentenceIds.map(sentence_id => ({
          user_id: FIXED_USER_ID,
          sentence_id: sentence_id,
          added_at: now.toISOString(),
          next_review_at: today.toISOString(),
          review_count: 0,
          last_score: null,
          last_reviewed_at: null,
          ease_factor: 2.5
        }));
        
        await supabase.from("en_user_sentences").insert(inserts);
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

  const saveWordResult = async (wordId, isCorrect) => {
    setSaving(true);
    const now = new Date();
    let nextReviewDate = new Date();
    nextReviewDate.setDate(now.getDate() + (isCorrect ? 1 : 0));
    
    const { data: existing } = await supabase
      .from("en_user_words")
      .select("id, review_count")
      .eq("user_id", FIXED_USER_ID)
      .eq("word_id", wordId)
      .single();
    
    if (existing) {
      await supabase
        .from("en_user_words")
        .update({
          next_review_at: nextReviewDate.toISOString(),
          review_count: existing.review_count + 1,
          last_score: isCorrect ? 100 : 0,
          last_reviewed_at: now.toISOString()
        })
        .eq("id", existing.id);
    }
    setSaving(false);
  };

  const saveSentenceResult = async (sentenceId, isCorrect) => {
    setSaving(true);
    const now = new Date();
    let nextReviewDate = new Date();
    nextReviewDate.setDate(now.getDate() + (isCorrect ? 1 : 0));
    
    const { data: existing } = await supabase
      .from("en_user_sentences")
      .select("id, review_count")
      .eq("user_id", FIXED_USER_ID)
      .eq("sentence_id", sentenceId)
      .single();
    
    if (existing) {
      await supabase
        .from("en_user_sentences")
        .update({
          next_review_at: nextReviewDate.toISOString(),
          review_count: existing.review_count + 1,
          last_score: isCorrect ? 100 : 0,
          last_reviewed_at: now.toISOString()
        })
        .eq("id", existing.id);
    }
    setSaving(false);
  };

  const handleSelect = async (opt) => {
  if (answered || saving) return;
  const current = queue[qIdx % queue.length];
  const correctAnswer = quizType === "word" ? current.meaning : current.sentence_tr;
  const isCorrect = opt === correctAnswer;
  
  setSelected(opt);
  setAnswered(true);
  
  // SADECE KELİME MODUNDA quiz attempt kaydet
  if (quizType === "word") {
    // Quiz sorusu ID'sini bul veya oluştur
    let { data: quizQuestion } = await supabase
      .from("en_quiz_questions")
      .select("id")
      .eq("word_id", current.id)
      .maybeSingle();
    
    if (!quizQuestion) {
      const { data: newQuestion } = await supabase
        .from("en_quiz_questions")
        .insert({
          word_id: current.id,
          question_text: `${current.word} kelimesinin Türkçesi nedir?`,
          options: buildWordOptions(current, allCards, choiceCount),
          correct_answer: current.meaning,
          difficulty: 1
        })
        .select()
        .single();
      quizQuestion = newQuestion;
    }
    
    if (quizQuestion) {
      await supabase.from("en_user_quiz_attempts").insert({
        user_id: FIXED_USER_ID,
        question_id: quizQuestion.id,
        user_answer: opt,
        is_correct: isCorrect
      });
    }
  }
  
  // SRS kaydet
  if (quizType === "word") {
    await saveWordResult(current.id, isCorrect);
  } else {
    await saveSentenceResult(current.id, isCorrect);
  }
};

  const handleNext = () => setQIdx(i => i + 1);

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
          {quizType === "word" ? "Tekrarlanacak kelime yok!" : "Tekrarlanacak cümle yok!"}
        </div>
        <div style={{ fontSize: 13, color: "#64748b" }}>
          Ana sayfadan yeni kelime/cümle ekleyebilirsin.
        </div>
        <button onClick={onChangeLevel} style={{ background: "#6366f1", border: "none", borderRadius: 10, padding: "12px 24px", color: "#fff", cursor: "pointer", fontWeight: 600, marginTop: 16 }}>
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  const current = queue[qIdx % queue.length];
  const currentWord = quizType === "word" ? current : current.en_words;
  const cardExamples = quizType === "word" ? (examplesMap[current.id] || []) : [];

  const handleSpeak = (text) => {
    setSpeaking(true);
    speak(text);
    setTimeout(() => setSpeaking(false), 1800);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f1a", color: "#e2e8f0", fontFamily: "'Inter', system-ui, sans-serif", maxWidth: 420, margin: "0 auto", padding: "20px" }}>
      
      {/* Kelime / Cümle seçimi */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button onClick={() => setQuizType("word")} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14, background: quizType === "word" ? "#6366f1" : "#1e1e30", color: quizType === "word" ? "#fff" : "#64748b" }}>
          📖 Kelimeler
        </button>
        <button onClick={() => setQuizType("sentence")} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14, background: quizType === "sentence" ? "#6366f1" : "#1e1e30", color: quizType === "sentence" ? "#fff" : "#64748b" }}>
          📝 Cümleler
        </button>
      </div>

      {/* Progress */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#475569", marginBottom: 6 }}>
        <span>{(qIdx % queue.length) + 1} / {queue.length}</span>
        <span style={{ color: levelColor, fontWeight: 700 }}>{choiceCount} şık</span>
      </div>
      <div style={{ height: 3, background: "#1e1e30", borderRadius: 99, marginBottom: 18, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${((qIdx % queue.length) / queue.length) * 100}%`, background: levelColor, borderRadius: 99, transition: "width 0.4s" }} />
      </div>

      {/* Soru kartı */}
      <div style={{ background: "linear-gradient(135deg, #1a1a2e, #16213e)", border: "1px solid #1e293b", borderRadius: 20, padding: "26px 22px", textAlign: "center", marginBottom: 18 }}>
        {quizType === "word" && currentWord?.part_of_speech?.length > 0 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 10 }}>
            {currentWord.part_of_speech.map(p => (
              <span key={p} style={{ fontSize: 10, color: "#6366f1", background: "#6366f122", padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>{p}</span>
            ))}
          </div>
        )}
        <div style={{ fontSize: quizType === "word" ? 28 : 18, fontWeight: quizType === "word" ? 800 : 600, letterSpacing: -0.5, marginBottom: 14, lineHeight: 1.4 }}>
          {quizType === "word" ? current.word : `"${current.sentence_en}"`}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => handleSpeak(quizType === "word" ? current.word : current.sentence_en)} style={{ background: speaking ? "#6366f1" : "#1e293b", border: "none", borderRadius: 10, padding: "7px 16px", color: "#e2e8f0", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600 }}>
            <SpeakerIcon /> {speaking ? "Çalıyor..." : "Telaffuz"}
          </button>
          
          {quizType === "word" && currentWord && (
            <button onClick={() => {
              setSelectedWordForExample(currentWord);
              setShowExampleModal(true);
              setExampleJsonInput("");
              setExampleParseError(null);
              setExampleStatus(null);
            }} style={{ background: "#1e293b", border: "none", borderRadius: 10, padding: "7px 16px", color: "#64748b", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600 }}>
              ✏️ Cümle Ekle
            </button>
          )}
        </div>
      </div>

      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10, fontWeight: 600 }}>
        {quizType === "word" ? "Türkçe anlamı nedir?" : "Bu cümlenin Türkçesi nedir?"}
      </div>

      {/* Şıklar */}
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {options.map((opt, i) => {
          const correctAnswer = quizType === "word" ? current.meaning : current.sentence_tr;
          const isCorrect = opt === correctAnswer;
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

      {/* Sonuç */}
      {answered && (
        <div style={{ marginTop: 14, padding: "14px 16px", borderRadius: 14, background: selected === (quizType === "word" ? current.meaning : current.sentence_tr) ? "#0e2d1f" : "#2d0e0e", border: `1px solid ${selected === (quizType === "word" ? current.meaning : current.sentence_tr) ? "#10b981" : "#ef4444"}` }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: selected === (quizType === "word" ? current.meaning : current.sentence_tr) ? "#10b981" : "#ef4444", marginBottom: 8 }}>
            {selected === (quizType === "word" ? current.meaning : current.sentence_tr) ? "✓ Doğru!" : `✗ Doğru cevap: "${quizType === "word" ? current.meaning : current.sentence_tr}"`}
          </div>

          {quizType === "word" && cardExamples.length > 0 && (
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

          {quizType === "sentence" && currentWord && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 11, color: "#64748b" }}>
                Kelime: <span style={{ color: "#6366f1", fontWeight: 600 }}>{currentWord.word}</span> — {currentWord.meaning}
              </div>
            </div>
          )}

          {quizType === "word" && (currentWord?.synonyms?.length > 0 || currentWord?.antonyms?.length > 0) && (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #1e293b", display: "flex", gap: 16 }}>
              {currentWord?.synonyms?.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, color: "#475569", marginBottom: 4 }}>Eş anlamlı</div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {currentWord.synonyms.slice(0, 3).map(s => <span key={s} style={{ fontSize: 11, color: "#10b981", background: "#0e2d1f", padding: "2px 7px", borderRadius: 5 }}>{s}</span>)}
                  </div>
                </div>
              )}
              {currentWord?.antonyms?.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, color: "#475569", marginBottom: 4 }}>Zıt anlamlı</div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {currentWord.antonyms.slice(0, 3).map(a => <span key={a} style={{ fontSize: 11, color: "#ef4444", background: "#2d0e0e", padding: "2px 7px", borderRadius: 5 }}>{a}</span>)}
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

      {/* Modal */}
      {showExampleModal && selectedWordForExample && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div style={{ background: "#1a1a2e", borderRadius: 20, maxWidth: 500, width: "100%", maxHeight: "90vh", overflowY: "auto", padding: 24, border: "1px solid #1e293b" }}>
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