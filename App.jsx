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

function buildOptions(correct, allCards, count) {
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [queue, setQueue] = useState([]);
  const [qIdx, setQIdx] = useState(0);
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [stats, setStats] = useState({});

  const choiceCount = LEVEL_CHOICES[userLevel];
  const levelColor = LEVEL_COLOR[userLevel];

  useEffect(() => {
    async function fetchWords() {
      setLoading(true);
      setError(null);
      try {
        const levels = LEVELS.slice(0, LEVEL_ORDER[userLevel]);
        const { data, error } = await supabase
          .from("en_words")
          .select("*")
          .in("level", levels)
          .eq("type", mode);
        if (error) throw error;
        const cards = data || [];
        setAllCards(cards);
        setQueue(shuffle(cards));
      } catch (err) {
        setError("Kelimeler yüklenemedi. Supabase bağlantısını kontrol et.");
      } finally {
        setLoading(false);
      }
    }
    fetchWords();
    setQIdx(0);
    setSelected(null);
    setAnswered(false);
  }, [userLevel, mode]);

  useEffect(() => {
    if (!queue.length) return;
    const card = queue[qIdx % queue.length];
    setOptions(buildOptions(card, allCards, choiceCount));
    setSelected(null);
    setAnswered(false);
  }, [qIdx, queue]);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0f0f1a", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, fontFamily: "Inter, sans-serif" }}>
      <div style={{ fontSize: 36 }}>📚</div>
      <div style={{ color: "#64748b", fontSize: 14 }}>Kelimeler yükleniyor...</div>
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
      <div style={{ color: "#64748b", fontSize: 14, textAlign: "center" }}>Bu seviyede henüz kelime yok.<br />Supabase'e kelime ekle!</div>
      <button onClick={onChangeLevel} style={{ background: "#1e293b", border: "none", borderRadius: 10, padding: "10px 20px", color: "#e2e8f0", cursor: "pointer", fontWeight: 600 }}>← Seviye Değiştir</button>
    </div>
  );

  const card = queue[qIdx % queue.length];

  const handleSpeak = (text) => {
    setSpeaking(true);
    speak(text);
    setTimeout(() => setSpeaking(false), 1800);
  };

  const handleSelect = (opt) => {
    if (answered) return;
    setSelected(opt);
    setAnswered(true);
    const isCorrect = opt === card.meaning;
    setStats(prev => {
      const cur = prev[card.id] || { correct: 0, wrong: 0 };
      return { ...prev, [card.id]: { correct: cur.correct + (isCorrect ? 1 : 0), wrong: cur.wrong + (isCorrect ? 0 : 1) } };
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
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, color: "#64748b" }}>Doğruluk</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: accuracy >= 70 ? "#10b981" : accuracy >= 40 ? "#f59e0b" : totalAnswered === 0 ? "#475569" : "#ef4444" }}>
            {totalAnswered > 0 ? `%${accuracy}` : "—"}
          </div>
        </div>
      </div>

      <div style={{ padding: "0 20px 10px", display: "flex", gap: 8 }}>
        {[{ id: "word", label: "📖 Kelimeler" }, { id: "phrase", label: "💬 Deyimler" }].map(m => (
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
              <span style={{ color: LEVEL_COLOR[card.level], fontWeight: 700 }}>{card.level} — {choiceCount} şık</span>
            </div>
            <div style={{ height: 3, background: "#1e1e30", borderRadius: 99, marginBottom: 18, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${((qIdx % queue.length) / queue.length) * 100}%`, background: levelColor, borderRadius: 99, transition: "width 0.4s" }} />
            </div>

            <div style={{ background: "linear-gradient(135deg, #1a1a2e, #16213e)", border: "1px solid #1e293b", borderRadius: 20, padding: "26px 22px", textAlign: "center", marginBottom: 18 }}>
              {card.part_of_speech?.length > 0 && (
                <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 10 }}>
                  {card.part_of_speech.map(p => (
                    <span key={p} style={{ fontSize: 10, color: "#6366f1", background: "#6366f122", padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>{p}</span>
                  ))}
                </div>
              )}
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5, marginBottom: 14 }}>{card.word}</div>
              <button onClick={() => handleSpeak(card.word)} style={{ background: speaking ? "#6366f1" : "#1e293b", border: "none", borderRadius: 10, padding: "7px 16px", color: "#e2e8f0", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, transition: "background 0.2s" }}>
                <SpeakerIcon /> {speaking ? "Çalıyor..." : "Telaffuz"}
              </button>
            </div>

            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10, fontWeight: 600 }}>Türkçe anlamı nedir?</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {options.map((opt, i) => {
                const isCorrect = opt === card.meaning;
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
              <div style={{ marginTop: 14, padding: "14px 16px", borderRadius: 14, background: selected === card.meaning ? "#0e2d1f" : "#2d0e0e", border: `1px solid ${selected === card.meaning ? "#10b981" : "#ef4444"}` }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: selected === card.meaning ? "#10b981" : "#ef4444", marginBottom: 8 }}>
                  {selected === card.meaning ? "✓ Doğru!" : `✗ Doğru cevap: "${card.meaning}"`}
                </div>
                {card.example && (
                  <>
                    <div style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic", lineHeight: 1.5 }}>"{card.example}"</div>
                    {card.example_tr && <div style={{ fontSize: 12, color: "#64748b", marginTop: 4, lineHeight: 1.5 }}>"{card.example_tr}"</div>}
                    <button onClick={() => handleSpeak(card.example)} style={{ marginTop: 8, background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 11, display: "inline-flex", alignItems: "center", gap: 4, padding: 0 }}>
                      <SpeakerIcon /> Cümleyi dinle
                    </button>
                  </>
                )}
                {(card.synonyms?.length > 0 || card.antonyms?.length > 0) && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #1e293b", display: "flex", gap: 16 }}>
                    {card.synonyms?.length > 0 && (
                      <div>
                        <div style={{ fontSize: 10, color: "#475569", marginBottom: 4 }}>Eş anlamlı</div>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {card.synonyms.map(s => <span key={s} style={{ fontSize: 11, color: "#10b981", background: "#0e2d1f", padding: "2px 7px", borderRadius: 5 }}>{s}</span>)}
                        </div>
                      </div>
                    )}
                    {card.antonyms?.length > 0 && (
                      <div>
                        <div style={{ fontSize: 10, color: "#475569", marginBottom: 4 }}>Zıt anlamlı</div>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {card.antonyms.map(a => <span key={a} style={{ fontSize: 11, color: "#ef4444", background: "#2d0e0e", padding: "2px 7px", borderRadius: 5 }}>{a}</span>)}
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
            {Object.keys(stats).length > 0 && (
              <div style={{ background: "#1a1a2e", borderRadius: 14, padding: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Tüm Kelimeler</div>
                {allCards.filter(c => stats[c.id]).map(c => {
                  const s = stats[c.id];
                  const acc = Math.round((s.correct / (s.correct + s.wrong)) * 100);
                  return (
                    <div key={c.id} style={{ padding: "8px 0", borderBottom: "1px solid #0f0f1a" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{c.word}</span>
                        <span style={{ fontSize: 11, color: acc >= 70 ? "#10b981" : "#ef4444" }}>%{acc}</span>
                      </div>
                      <div style={{ height: 4, background: "#0f0f1a", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${acc}%`, background: acc >= 70 ? "#10b981" : "#ef4444", borderRadius: 99 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [userLevel, setUserLevel] = useState(null);
  if (!userLevel) return <WelcomeScreen onSelect={setUserLevel} />;
  return <QuizScreen userLevel={userLevel} onChangeLevel={() => setUserLevel(null)} />;
}
