import { useEffect, useState } from "react";
import { useWordQuiz } from "../../hooks/useWordQuiz.js";
import { speak } from "../../utils/speechUtils.js";
import SpeakerIcon from "../common/SpeakerIcon.jsx";
import ProgressBar from "../common/ProgressBar.jsx";
import OptionButton from "../common/OptionButton.jsx";
import ExampleModal from "./ExampleModal.jsx";

const LEVEL_COLOR = { A1: "#10b981", A2: "#3b82f6", B1: "#8b5cf6", B2: "#f59e0b" };

export default function WordQuiz({ userLevel, onChangeLevel }) {
  const {
    loading,
    error,
    currentQuestion,
    options,
    selected,
    answered,
    saving,
    queue,
    queueIndex,
    examplesMap,
    handleSelect,
    handleNext,
    setSelected,
    setAnswered,
    setExamplesMap
  } = useWordQuiz(userLevel);

  const [showExampleModal, setShowExampleModal] = useState(false);
  const [selectedWordForExample, setSelectedWordForExample] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const [speakingExample, setSpeakingExample] = useState(null); // Hangi cümlenin konuşulduğunu takip et
  const [isFinished, setIsFinished] = useState(false);

  const levelColor = LEVEL_COLOR[userLevel];

  // Kelime gelince telaffuz et
  useEffect(() => {
    if (currentQuestion && !answered && !saving) {
      setTimeout(() => {
        speak(currentQuestion.word);
      }, 100);
    }
  }, [currentQuestion, answered, saving]);

  const handleSpeak = (text, isExample = false, exampleIndex = null) => {
    if (isExample) {
      setSpeakingExample(exampleIndex);
    } else {
      setSpeaking(true);
    }
    
    speak(text);
    
    setTimeout(() => {
      if (isExample) {
        setSpeakingExample(null);
      } else {
        setSpeaking(false);
      }
    }, 1800);
  };

  const onSelect = async (opt) => {
    await handleSelect(opt, (isCorrect) => {
      // Sonuç işlemi tamamlandı
    });
  };

  const onNext = () => {
    const nextQuestion = handleNext();
    if (nextQuestion === null) {
      setIsFinished(true);
    }
  };

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

  if (!currentQuestion || queue.length === 0 || isFinished) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f0f1a", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 48 }}>🎉</div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Tekrarlanacak kelime yok!</div>
        <div style={{ fontSize: 13, color: "#64748b" }}>Ana sayfadan yeni kelime ekleyebilirsin.</div>
        <button onClick={onChangeLevel} style={{ background: "#6366f1", border: "none", borderRadius: 10, padding: "12px 24px", color: "#fff", cursor: "pointer", fontWeight: 600, marginTop: 16 }}>
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  const cardExamples = examplesMap[currentQuestion.id] || [];
  const correctAnswer = currentQuestion.meaning;

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "#0f0f1a", 
      color: "#e2e8f0", 
      fontFamily: "'Inter', system-ui, sans-serif", 
      maxWidth: 420, 
      margin: "0 auto", 
      padding: "20px" 
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#475569", marginBottom: 6 }}>
        <span>{queueIndex + 1} / {queue.length}</span>
        <span style={{ color: levelColor, fontWeight: 700 }}>{options.length} şık</span>
      </div>
      
      <ProgressBar current={queueIndex} total={queue.length} color={levelColor} />

      <div style={{ 
        background: "linear-gradient(135deg, #1a1a2e, #16213e)", 
        border: "1px solid #1e293b", 
        borderRadius: 20, 
        padding: "26px 22px", 
        textAlign: "center", 
        marginBottom: 18 
      }}>
        {currentQuestion?.part_of_speech?.length > 0 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 10 }}>
            {currentQuestion.part_of_speech.map(p => (
              <span key={p} style={{ fontSize: 10, color: "#6366f1", background: "#6366f122", padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>{p}</span>
            ))}
          </div>
        )}
        <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5, marginBottom: 14, lineHeight: 1.4 }}>
          {currentQuestion.word}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
          <button 
            onClick={() => handleSpeak(currentQuestion.word)} 
            style={{ 
              background: speaking ? "#6366f1" : "#1e293b", 
              border: "none", 
              borderRadius: 10, 
              padding: "7px 16px", 
              color: "#e2e8f0", 
              cursor: "pointer", 
              display: "inline-flex", 
              alignItems: "center", 
              gap: 6, 
              fontSize: 12, 
              fontWeight: 600 
            }}
          >
            <SpeakerIcon /> {speaking ? "Çalıyor..." : "Telaffuz"}
          </button>
          
          <button 
            onClick={() => {
              setSelectedWordForExample(currentQuestion);
              setShowExampleModal(true);
            }} 
            style={{ 
              background: "#1e293b", 
              border: "none", 
              borderRadius: 10, 
              padding: "7px 16px", 
              color: "#64748b", 
              cursor: "pointer", 
              display: "inline-flex", 
              alignItems: "center", 
              gap: 6, 
              fontSize: 12, 
              fontWeight: 600 
            }}
          >
            ✏️ Cümle Ekle
          </button>
        </div>
      </div>

      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10, fontWeight: 600 }}>
        Türkçe anlamı nedir?
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {options.map((opt, i) => {
          const isCorrect = opt === correctAnswer;
          const isSelected = opt === selected;
          return (
            <OptionButton
              key={i}
              index={i}
              label={opt}
              isAnswered={answered}
              isCorrect={isCorrect}
              isSelected={isSelected}
              onClick={() => onSelect(opt)}
              disabled={answered || saving}
            />
          );
        })}
      </div>

      {answered && (
        <div style={{ 
          marginTop: 14, 
          padding: "14px 16px", 
          borderRadius: 14, 
          background: selected === correctAnswer ? "#0e2d1f" : "#2d0e0e", 
          border: `1px solid ${selected === correctAnswer ? "#10b981" : "#ef4444"}` 
        }}>
          <div style={{ 
            fontWeight: 700, 
            fontSize: 13, 
            color: selected === correctAnswer ? "#10b981" : "#ef4444", 
            marginBottom: 12 
          }}>
            {selected === correctAnswer ? "✓ Doğru!" : `✗ Doğru cevap: "${correctAnswer}"`}
          </div>

          {cardExamples.length > 0 && (
            <div style={{ marginTop: 6 }}>
              <div style={{ 
                fontSize: 13, 
                color: "#94a3b8", 
                marginBottom: 10, 
                fontWeight: 600 
              }}>
                📚 Örnek Cümleler:
              </div>
              {cardExamples.slice(0, 3).map((ex, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    marginBottom: idx < 2 ? 14 : 0,
                    padding: "12px 14px",
                    background: "#1a1a2e",
                    borderRadius: 10,
                    border: "1px solid #1e293b"
                  }}
                >
                  <div style={{ 
                    fontSize: 14, 
                    color: "#e2e8f0", 
                    fontStyle: "italic", 
                    lineHeight: 1.6,
                    marginBottom: 4
                  }}>
                    "{ex.sentence_en}"
                  </div>
                  {ex.sentence_tr && (
                    <div style={{ 
                      fontSize: 13, 
                      color: "#94a3b8", 
                      marginTop: 4,
                      marginBottom: 8
                    }}>
                      "{ex.sentence_tr}"
                    </div>
                  )}
                  <button 
                    onClick={() => handleSpeak(ex.sentence_en, true, idx)} 
                    style={{ 
                      marginTop: 6,
                      background: speakingExample === idx ? "#6366f1" : "#1e293b", 
                      border: "none", 
                      borderRadius: 8, 
                      padding: "6px 14px",
                      color: "#e2e8f0", 
                      cursor: "pointer", 
                      display: "inline-flex", 
                      alignItems: "center", 
                      gap: 6, 
                      fontSize: 12, 
                      fontWeight: 500,
                      transition: "all 0.2s"
                    }}
                  >
                    <SpeakerIcon /> 
                    {speakingExample === idx ? "Çalıyor..." : "Cümleyi dinle"}
                  </button>
                </div>
              ))}
              {cardExamples.length > 3 && (
                <div style={{ 
                  fontSize: 12, 
                  color: "#64748b", 
                  textAlign: "center", 
                  marginTop: 8 
                }}>
                  +{cardExamples.length - 3} cümle daha
                </div>
              )}
            </div>
          )}
          
          <button 
            onClick={onNext} 
            disabled={saving} 
            style={{ 
              marginTop: 14, 
              width: "100%", 
              padding: 12, 
              borderRadius: 12, 
              border: "none", 
              background: saving ? "#475569" : "#6366f1", 
              color: "#fff", 
              fontWeight: 600, 
              fontSize: 14, 
              cursor: saving ? "not-allowed" : "pointer" 
            }}
          >
            {saving ? "Kaydediliyor..." : queueIndex + 1 >= queue.length ? "🏁 Bitir" : "Sonraki →"}
          </button>
        </div>
      )}

      {showExampleModal && selectedWordForExample && (
        <ExampleModal
          word={selectedWordForExample}
          onClose={() => {
            setShowExampleModal(false);
            setSelectedWordForExample(null);
          }}
          onSuccess={() => {
            setShowExampleModal(false);
            setSelectedWordForExample(null);
          }}
          examplesMap={examplesMap}
          setExamplesMap={setExamplesMap}
        />
      )}
    </div>
  );
}