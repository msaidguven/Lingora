// LessonPage.jsx - Her adımda tek soru versiyonu
import { useState, useEffect } from "react";
import { supabase } from "../../config.js";

// ============================
// YARDIMCI FONKSİYONLAR
// ============================
const getLevelColor = (level) => {
  const colors = {
    A1: "#10b981",
    A2: "#3b82f6",
    B1: "#f59e0b",
    B2: "#ef4444",
  };
  return colors[level] || "#64748b";
};

// ============================
// ADIM BİLEŞENLERİ
// ============================

// 📝 INFO ADIMI - Bilgi gösterimi
function InfoStep({ step, onNext, onPrevious, isFirst, isLast }) {
  const content = step.content;

  return (
    <div className="step-container">
      <div className="step-header">
        <span className="step-number">Adım {step.id?.split('_')[1] || '?'}</span>
        <h2 className="step-title">{step.title}</h2>
      </div>

      <div className="step-content info-content">
        {content?.explanation && (
          <p className="explanation-text">{content.explanation}</p>
        )}

        {/* Zamir listesi gösterimi */}
        {content?.items && (
          <div className="items-grid">
            {content.items.map((item, idx) => (
              <div key={idx} className="item-card">
                <span className="item-pronoun">{item.pronoun}</span>
                <span className="item-arrow">→</span>
                <span className="item-meaning">{item.meaning}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tablo gösterimi */}
        {content?.table && (
          <div className="table-container">
            <table className="info-table">
              <thead>
                <tr>
                  <th>Özne</th>
                  <th>To Be</th>
                </tr>
              </thead>
              <tbody>
                {content.table.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.subject}</td>
                    <td className="verb-cell">{row.verb}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Kural gösterimi */}
        {content?.rule && (
          <div className="rule-box">
            <span className="rule-icon">📌</span>
            <span>{content.rule}</span>
          </div>
        )}

        {/* Kısa formlar */}
        {content?.short_forms && (
          <div className="short-forms-box">
            <span className="short-icon">⚡</span>
            <span>{content.short_forms}</span>
          </div>
        )}

        {/* Örnekler */}
        {content?.examples && (
          <div className="examples-box">
            <h4>Örnekler</h4>
            {content.examples.map((ex, idx) => (
              <div key={idx} className="example-row">
                <span className="example-correct">✅ {ex.correct}</span>
                <span className="example-wrong">❌ {ex.wrong}</span>
                <span className="example-note">({ex.note})</span>
              </div>
            ))}
          </div>
        )}

        {content?.tip && (
          <div className="tip-box">
            <span className="tip-icon">💡</span>
            <span>{content.tip}</span>
          </div>
        )}

        {step.id?.includes('summary') && content?.key_points && (
          <div className="summary-box">
            <h4>🎯 Ana Noktalar</h4>
            <ul>
              {content.key_points.map((point, idx) => (
                <li key={idx}>{point}</li>
              ))}
            </ul>
            {content.practice_tasks && (
              <>
                <h4>✍️ Pratik Görevleri</h4>
                <ul>
                  {content.practice_tasks.map((task, idx) => (
                    <li key={idx}>{task}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        <div className="step-navigation">
          <button 
            onClick={onPrevious} 
            disabled={isFirst}
            className="nav-btn prev-btn"
          >
            ← Geri
          </button>
          <button 
            onClick={onNext} 
            className="nav-btn next-btn"
          >
            {isLast ? '✅ Dersi Tamamla' : 'İlerle →'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ❓ PRACTICE ADIMI - Tek Soru
function PracticeStep({ step, onNext, onPrevious, isFirst, isLast }) {
  const [answer, setAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const questions = step.questions || [];
  const question = questions[0]; // Her adımda tek soru

  if (!question) {
    return (
      <div className="step-container">
        <div className="step-content">
          <p>Soru bulunamadı.</p>
          <button onClick={onNext} className="nav-btn next-btn">İlerle →</button>
        </div>
      </div>
    );
  }

  const handleOptionSelect = (value) => {
    if (showFeedback) return;
    setAnswer(value);
  };

  const handleCheckAnswer = () => {
    if (!answer && !question.options) {
      alert('Lütfen bir cevap yazın!');
      return;
    }
    
    if (question.options && !answer) {
      alert('Lütfen bir seçenek seçin!');
      return;
    }
    
    const correct = answer === question.correct;
    setIsCorrect(correct);
    setShowFeedback(true);
  };

  const handleInputChange = (value) => {
    if (showFeedback) return;
    setAnswer(value);
  };

  const handleNext = () => {
    if (!showFeedback) {
      alert('Lütfen önce soruyu cevaplayın!');
      return;
    }
    if (!isCorrect) {
      alert('Doğru cevabı bulmadan ilerleyemezsiniz!');
      return;
    }
    onNext();
  };

  const handlePrevious = () => {
    if (showFeedback) {
      // Geri giderken state'i sıfırla
      setShowFeedback(false);
      setAnswer('');
      setIsCorrect(false);
    }
    onPrevious();
  };

  return (
    <div className="step-container">
      <div className="step-header">
        <span className="step-number">Adım {step.id?.split('_')[1] || '?'}</span>
        <h2 className="step-title">{step.title}</h2>
      </div>

      <div className="step-content practice-content">
        {/* Kural gösterimi */}
        {step.rule && (
          <div className="rule-box">
            <span className="rule-icon">📌</span>
            <span>{step.rule}</span>
          </div>
        )}

        {step.instructions && (
          <p className="instructions-text">{step.instructions}</p>
        )}

        <div className="practice-question">
          <p className="question-text">{question.question}</p>

          {/* Çoktan seçmeli */}
          {question.options && (
            <div className="options-group">
              {question.options.map((option, optIndex) => (
                <label 
                  key={optIndex} 
                  className={`option-label ${
                    showFeedback 
                      ? option === question.correct 
                        ? 'correct-option' 
                        : option === answer 
                          ? 'wrong-option' 
                          : ''
                      : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="question"
                    value={option}
                    checked={answer === option}
                    onChange={() => handleOptionSelect(option)}
                    disabled={showFeedback}
                  />
                  <span>{option}</span>
                  {showFeedback && option === question.correct && (
                    <span className="check-icon">✅</span>
                  )}
                  {showFeedback && option === answer && option !== question.correct && (
                    <span className="check-icon">❌</span>
                  )}
                </label>
              ))}
            </div>
          )}

          {/* Boşluk doldurma */}
          {!question.options && (
            <div className="fill-blank-group">
              <input
                type="text"
                className="fill-blank-input"
                value={answer}
                onChange={(e) => handleInputChange(e.target.value)}
                disabled={showFeedback}
                placeholder="Cevabınızı yazın..."
              />
              {!showFeedback && (
                <button 
                  className="check-btn"
                  onClick={handleCheckAnswer}
                >
                  Kontrol Et
                </button>
              )}
            </div>
          )}

          {/* Çoktan seçmeli için Kontrol Et butonu */}
          {question.options && !showFeedback && (
            <button 
              className="check-btn"
              onClick={handleCheckAnswer}
              style={{ marginTop: 12 }}
            >
              Kontrol Et
            </button>
          )}

          {/* Feedback */}
          {showFeedback && (
            <div className={`feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
              {isCorrect 
                ? question.feedback_correct 
                : question.feedback_wrong}
            </div>
          )}
        </div>

        <div className="step-navigation">
          <button 
            onClick={handlePrevious} 
            disabled={isFirst}
            className="nav-btn prev-btn"
          >
            ← Geri
          </button>
          <button 
            onClick={handleNext} 
            disabled={!showFeedback || !isCorrect}
            className="nav-btn next-btn"
          >
            {isLast ? '✅ Dersi Tamamla' : 'İlerle →'}
          </button>
        </div>

        {showFeedback && !isCorrect && (
          <div className="progress-warning">
            ⚠️ Doğru cevabı bulmadan ilerleyemezsiniz. Tekrar deneyin!
          </div>
        )}
      </div>
    </div>
  );
}

// 🎭 DIALOGUE ADIMI - Diyalog
function DialogueStep({ step, onNext, onPrevious, isFirst, isLast }) {
  const [answer, setAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const content = step.content || {};
  const scenes = content.scenes || [];
  const practice = step.practice || {};
  const practiceQuestions = practice.questions || [];
  const question = practiceQuestions[0]; // Tek soru

  const handleInputChange = (value) => {
    if (showFeedback) return;
    setAnswer(value);
  };

  const handleCheckAnswer = () => {
    if (!answer) {
      alert('Lütfen bir cevap yazın!');
      return;
    }
    
    const correct = answer.trim().toLowerCase() === question.correct.toLowerCase();
    setIsCorrect(correct);
    setShowFeedback(true);
  };

  const handleNext = () => {
    if (!showFeedback) {
      alert('Lütfen önce soruyu cevaplayın!');
      return;
    }
    if (!isCorrect) {
      alert('Doğru cevabı bulmadan ilerleyemezsiniz!');
      return;
    }
    onNext();
  };

  const handlePrevious = () => {
    setShowFeedback(false);
    setAnswer('');
    setIsCorrect(false);
    onPrevious();
  };

  return (
    <div className="step-container">
      <div className="step-header">
        <span className="step-number">Adım {step.id?.split('_')[1] || '?'}</span>
        <h2 className="step-title">{step.title}</h2>
      </div>

      <div className="step-content dialogue-content">
        {content.context && (
          <div className="dialogue-context">📌 {content.context}</div>
        )}

        <div className="dialogue-container">
          {scenes.map((scene, idx) => (
            <div key={idx} className={`dialogue-line ${idx % 2 === 0 ? 'speaker-a' : 'speaker-b'}`}>
              <div className="dialogue-speaker">
                <span className="speaker-name">{scene.speaker}:</span>
                <span className="dialogue-text">{scene.text}</span>
              </div>
              <div className="dialogue-translation">🇹🇷 {scene.translation}</div>
            </div>
          ))}
        </div>

        {question && (
          <div className="dialogue-practice">
            <h4>{practice.instructions || 'Diyalogdaki boşluğu doldurun:'}</h4>
            <div className="practice-question">
              <p className="question-text">{question.question}</p>
              <div className="fill-blank-group">
                <input
                  type="text"
                  className="fill-blank-input"
                  value={answer}
                  onChange={(e) => handleInputChange(e.target.value)}
                  disabled={showFeedback}
                  placeholder="Cevabınızı yazın..."
                />
                {!showFeedback && (
                  <button 
                    className="check-btn"
                    onClick={handleCheckAnswer}
                  >
                    Kontrol Et
                  </button>
                )}
              </div>
              {showFeedback && (
                <div className={`feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
                  {isCorrect 
                    ? question.feedback_correct || '✅ Doğru!'
                    : question.feedback_wrong || '❌ Yanlış. Tekrar deneyin.'}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="step-navigation">
          <button 
            onClick={handlePrevious} 
            disabled={isFirst}
            className="nav-btn prev-btn"
          >
            ← Geri
          </button>
          <button 
            onClick={handleNext} 
            disabled={!showFeedback || !isCorrect}
            className="nav-btn next-btn"
          >
            {isLast ? '✅ Dersi Tamamla' : 'İlerle →'}
          </button>
        </div>

        {showFeedback && !isCorrect && (
          <div className="progress-warning">
            ⚠️ Doğru cevabı bulmadan ilerleyemezsiniz. Tekrar deneyin!
          </div>
        )}
      </div>
    </div>
  );
}

// ============================
// ANA DERS SAYFASI
// ============================
export default function LessonPage({ lessonId, onBack }) {
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (lessonId) {
      fetchLesson(lessonId);
    } else {
      fetchFirstLesson();
    }
  }, [lessonId]);

  const fetchLesson = async (id) => {
    setLoading(true);
    setError(null);
    setCurrentStepIndex(0);
    
    try {
      let query = supabase
        .from("en_lessons")
        .select("*");

      if (id && id.length === 36) {
        query = query.eq("id", id);
      } else if (id) {
        query = query.eq("lesson_number", parseInt(id));
      }

      const { data, error } = await query;

      if (error) throw error;
      
      if (!data || data.length === 0) {
        setError("Ders bulunamadı");
        setLoading(false);
        return;
      }

      const lessonData = data[0];
      
      let content = lessonData.content_json;
      if (typeof content === 'string') {
        try {
          content = JSON.parse(content);
          lessonData.content_json = content;
        } catch (e) {
          console.error("JSON parse hatası:", e);
          lessonData.content_json = {};
        }
      }
      
      if (typeof lessonData.content_json === 'object' && lessonData.content_json !== null) {
        if (lessonData.content_json.steps && Array.isArray(lessonData.content_json.steps)) {
          setSteps(lessonData.content_json.steps);
        } else {
          // Eski formatı dönüştür
          const convertedSteps = convertLegacyToSteps(lessonData.content_json);
          setSteps(convertedSteps);
        }
      } else {
        setSteps([]);
      }
      
      setLesson(lessonData);
    } catch (error) {
      console.error("Ders yüklenirken hata:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFirstLesson = async () => {
    setLoading(true);
    setError(null);
    setCurrentStepIndex(0);
    
    try {
      const { data, error } = await supabase
        .from("en_lessons")
        .select("*")
        .order("level")
        .order("lesson_number")
        .limit(1);

      if (error) throw error;
      
      if (!data || data.length === 0) {
        setError("Ders bulunamadı");
        setLoading(false);
        return;
      }

      const lessonData = data[0];
      
      let content = lessonData.content_json;
      if (typeof content === 'string') {
        try {
          content = JSON.parse(content);
          lessonData.content_json = content;
        } catch (e) {
          console.error("JSON parse hatası:", e);
          lessonData.content_json = {};
        }
      }
      
      if (typeof lessonData.content_json === 'object' && lessonData.content_json !== null) {
        if (lessonData.content_json.steps && Array.isArray(lessonData.content_json.steps)) {
          setSteps(lessonData.content_json.steps);
        } else {
          const convertedSteps = convertLegacyToSteps(lessonData.content_json);
          setSteps(convertedSteps);
        }
      } else {
        setSteps([]);
      }
      
      setLesson(lessonData);
    } catch (error) {
      console.error("Ders yüklenirken hata:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const convertLegacyToSteps = (content) => {
    const steps = [];
    let stepCounter = 1;

    // Theory -> Info step
    if (content.theory_text) {
      steps.push({
        id: `step_${stepCounter++}`,
        type: 'info',
        title: 'Teori',
        content: {
          explanation: content.theory_text,
          rule: content.key_rules?.join('\n'),
          tip: content.common_mistakes?.join('\n')
        }
      });
    }

    // Vocabulary -> Info step
    if (content.vocabulary && content.vocabulary.length > 0) {
      steps.push({
        id: `step_${stepCounter++}`,
        type: 'info',
        title: 'Yeni Kelimeler',
        content: {
          items: content.vocabulary.map(v => ({
            pronoun: v.word,
            meaning: v.meaning
          }))
        }
      });
    }

    // Example sentences -> Practice step
    if (content.example_sentences && content.example_sentences.length > 0) {
      const questions = content.example_sentences.slice(0, 5).map(s => ({
        question: `Doğru ifade: "${s.tr}"`,
        options: [s.en],
        correct: s.en,
        feedback_correct: '✅ Doğru!',
        feedback_wrong: '❌ Tekrar dene.'
      }));
      
      steps.push({
        id: `step_${stepCounter++}`,
        type: 'practice',
        title: 'Örnek Cümleler',
        instructions: 'Aşağıdaki cümleleri inceleyin:',
        questions: questions
      });
    }

    // Dialogue -> Dialogue step
    if (content.dialogue && content.dialogue.length > 0) {
      steps.push({
        id: `step_${stepCounter++}`,
        type: 'dialogue',
        title: 'Diyalog',
        content: {
          scenes: content.dialogue
        }
      });
    }

    // Quiz -> Practice step
    if (content.quiz && content.quiz.length > 0) {
      const practiceQuestions = content.quiz.slice(0, 5).map(q => ({
        question: q.question,
        options: q.options,
        correct: q.correct,
        feedback_correct: `✅ Doğru! ${q.explanation || ''}`,
        feedback_wrong: `❌ ${q.explanation || 'Tekrar dene.'}`
      }));
      
      steps.push({
        id: `step_${stepCounter++}`,
        type: 'practice',
        title: 'Quiz',
        instructions: 'Aşağıdaki soruları cevaplayın:',
        questions: practiceQuestions
      });
    }

    // Summary -> Info step
    if (content.summary) {
      steps.push({
        id: `step_${stepCounter}`,
        type: 'info',
        title: 'Ders Özeti',
        content: {
          key_points: typeof content.summary === 'string' 
            ? [content.summary] 
            : content.summary.key_points || [],
          practice_tasks: content.summary.practice_tasks || []
        }
      });
    }

    return steps;
  };

  const renderStep = (step) => {
    if (!step) return null;
    
    const isFirst = currentStepIndex === 0;
    const isLast = currentStepIndex === steps.length - 1;
    
    const props = {
      step,
      onNext: goToNextStep,
      onPrevious: goToPreviousStep,
      isFirst,
      isLast
    };
    
    switch(step.type) {
      case 'info':
        return <InfoStep {...props} />;
      case 'practice':
        return <PracticeStep {...props} />;
      case 'dialogue':
        return <DialogueStep {...props} />;
      default:
        return (
          <div className="step-container">
            <div className="step-content">
              <p style={{ color: '#94a3b8' }}>Bilinmeyen adım tipi: {step.type}</p>
            </div>
          </div>
        );
    }
  };

  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      alert('🎉 Tebrikler! Dersi tamamladınız!');
    }
  };

  const handlePrevLesson = () => {
    if (lesson && lesson.lesson_number > 1) {
      fetchLesson((lesson.lesson_number - 1).toString());
    }
  };

  const handleNextLesson = () => {
    if (lesson) {
      fetchLesson((lesson.lesson_number + 1).toString());
    }
  };

  if (loading) {
    return (
      <div className="lesson-page loading">
        <div className="loading-spinner">⏳</div>
        <p>Ders yükleniyor...</p>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="lesson-page error">
        <div className="error-icon">😕</div>
        <h2>Ders Bulunamadı</h2>
        <p>{error || "İstenilen ders mevcut değil."}</p>
        <button onClick={onBack} className="back-home-btn">
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  const currentStep = steps[currentStepIndex];
  const totalSteps = steps.length;
  const progress = totalSteps > 0 ? ((currentStepIndex + 1) / totalSteps) * 100 : 0;

  return (
    <div className="lesson-page" style={{ 
      minHeight: "100vh", 
      background: "#0f0f1a", 
      color: "#e2e8f0",
      fontFamily: "'Inter', system-ui, sans-serif"
    }}>
      {/* HEADER */}
      <header style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        borderBottom: "1px solid #1e293b",
        padding: "12px 0",
      }}>
        <div style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8
        }}>
          <button 
            onClick={onBack}
            style={{
              background: "transparent",
              border: "1px solid #1e293b",
              borderRadius: 8,
              padding: "6px 14px",
              color: "#94a3b8",
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit"
            }}
          >
            ← Geri
          </button>
          
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ 
              fontSize: 12, 
              color: "#64748b",
              background: "#0f0f1a",
              padding: "4px 10px",
              borderRadius: 6,
              border: "1px solid #1e293b"
            }}>
              Ders #{lesson.lesson_number}
            </span>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "4px 12px",
              borderRadius: 6,
              color: "#fff",
              letterSpacing: 1,
              backgroundColor: getLevelColor(lesson.level)
            }}>
              {lesson.level}
            </span>
            <span style={{
              fontSize: 12,
              color: "#94a3b8",
              background: "#0f0f1a",
              padding: "4px 10px",
              borderRadius: 6,
              border: "1px solid #1e293b"
            }}>
              {currentStepIndex + 1} / {totalSteps}
            </span>
          </div>
        </div>
      </header>

      {/* PROGRESS BAR */}
      {totalSteps > 0 && (
        <div style={{ 
          height: 3, 
          background: "#1e293b",
          position: "sticky",
          top: 0,
          zIndex: 20
        }}>
          <div style={{
            height: "100%",
            width: `${progress}%`,
            background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
            transition: "width 0.5s ease"
          }} />
        </div>
      )}

      {/* MAIN CONTENT */}
      <main style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "20px 24px 100px"
      }}>
        {totalSteps > 0 && currentStep ? (
          renderStep(currentStep)
        ) : (
          <div style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "#64748b"
          }}>
            <p>Bu ders için içerik bulunamadı.</p>
          </div>
        )}
      </main>

      {/* FOOTER - Önceki/Sonraki Ders */}
      <footer style={{
        background: "#1a1a2e",
        borderTop: "1px solid #1e293b",
        padding: "12px 0",
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10
      }}>
        <div style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          justifyContent: "center",
          gap: 16
        }}>
          <button 
            onClick={handlePrevLesson}
            disabled={!lesson || lesson.lesson_number <= 1}
            style={{
              padding: "8px 16px",
              background: "#0f0f1a",
              border: "1px solid #1e293b",
              borderRadius: 6,
              color: "#94a3b8",
              fontSize: 13,
              cursor: lesson && lesson.lesson_number > 1 ? "pointer" : "not-allowed",
              opacity: lesson && lesson.lesson_number > 1 ? 1 : 0.3,
              fontFamily: "inherit"
            }}
          >
            ← Önceki Ders
          </button>
          <button 
            onClick={handleNextLesson}
            style={{
              padding: "8px 16px",
              background: "#0f0f1a",
              border: "1px solid #1e293b",
              borderRadius: 6,
              color: "#94a3b8",
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit"
            }}
          >
            Sonraki Ders →
          </button>
        </div>
      </footer>

      {/* CSS */}
      <style>{`
        /* Step Container */
        .step-container {
          background: #1a1a2e;
          border-radius: 16px;
          border: 1px solid #1e293b;
          overflow: hidden;
          animation: fadeIn 0.3s ease-in;
        }

        .step-header {
          padding: 24px 28px;
          border-bottom: 1px solid #1e293b;
          background: #0f0f1a;
        }

        .step-number {
          font-size: 12px;
          color: #6366f1;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .step-title {
          font-size: 24px;
          font-weight: 700;
          margin: 4px 0 0 0;
          color: #f1f5f9;
        }

        .step-content {
          padding: 28px;
        }

        .explanation-text {
          font-size: 16px;
          line-height: 1.7;
          color: #cbd5e1;
          margin-bottom: 20px;
        }

        /* Items Grid */
        .items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 10px;
          margin: 16px 0;
        }

        .item-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: #0f0f1a;
          border-radius: 8px;
          border: 1px solid #1e293b;
        }

        .item-pronoun {
          font-weight: 700;
          color: #f1f5f9;
          font-size: 16px;
        }

        .item-arrow {
          color: #6366f1;
        }

        .item-meaning {
          color: #94a3b8;
        }

        /* Table */
        .table-container {
          margin: 16px 0;
          overflow-x: auto;
        }

        .info-table {
          width: 100%;
          border-collapse: collapse;
          background: #0f0f1a;
          border-radius: 8px;
          overflow: hidden;
        }

        .info-table th {
          background: #1e293b;
          color: #94a3b8;
          font-weight: 600;
          padding: 10px 16px;
          text-align: left;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-table td {
          padding: 10px 16px;
          border-bottom: 1px solid #1e293b;
          color: #e2e8f0;
        }

        .info-table .verb-cell {
          color: #6366f1;
          font-weight: 600;
        }

        /* Rule Box */
        .rule-box {
          background: #0f0f1a;
          border-left: 4px solid #6366f1;
          padding: 14px 18px;
          margin: 16px 0;
          border-radius: 0 8px 8px 0;
          color: #e2e8f0;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .rule-icon {
          font-size: 18px;
        }

        .short-forms-box {
          background: #0f1a1a;
          border-left: 4px solid #10b981;
          padding: 14px 18px;
          margin: 12px 0;
          border-radius: 0 8px 8px 0;
          color: #6ee7b7;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .short-icon {
          font-size: 18px;
        }

        .tip-box {
          background: #1a1a0f;
          border-left: 4px solid #f59e0b;
          padding: 14px 18px;
          margin: 16px 0;
          border-radius: 0 8px 8px 0;
          color: #fcd34d;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .tip-icon {
          font-size: 18px;
        }

        .examples-box {
          background: #0f0f1a;
          padding: 16px;
          border-radius: 8px;
          margin: 16px 0;
        }

        .examples-box h4 {
          color: #94a3b8;
          margin: 0 0 10px 0;
          font-size: 14px;
        }

        .example-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 6px 0;
          font-size: 14px;
          flex-wrap: wrap;
        }

        .example-correct {
          color: #10b981;
        }

        .example-wrong {
          color: #ef4444;
        }

        .example-note {
          color: #64748b;
          font-size: 12px;
        }

        /* Practice */
        .instructions-text {
          font-size: 15px;
          color: #94a3b8;
          margin-bottom: 20px;
        }

        .practice-question {
          background: #0f0f1a;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #1e293b;
          margin-bottom: 16px;
        }

        .question-text {
          font-weight: 500;
          color: #f1f5f9;
          margin: 0 0 16px 0;
          font-size: 18px;
        }

        .options-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .option-label {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: #0a0a14;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
        }

        .option-label:hover:not(.correct-option):not(.wrong-option) {
          background: #141425;
          border-color: #1e293b;
        }

        .option-label input[type="radio"] {
          accent-color: #6366f1;
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .option-label input[type="radio"]:disabled {
          cursor: not-allowed;
        }

        .correct-option {
          background: #0e2d1f !important;
          border: 1px solid #10b981 !important;
        }

        .wrong-option {
          background: #2d1a0e !important;
          border: 1px solid #ef4444 !important;
        }

        .check-icon {
          margin-left: auto;
          font-size: 18px;
        }

        .fill-blank-group {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .fill-blank-input {
          flex: 1;
          min-width: 200px;
          padding: 12px 16px;
          background: #0a0a14;
          border: 2px solid #1e293b;
          border-radius: 8px;
          color: #e2e8f0;
          font-size: 16px;
          font-family: inherit;
          transition: border-color 0.2s;
        }

        .fill-blank-input:focus {
          outline: none;
          border-color: #6366f1;
        }

        .fill-blank-input:disabled {
          opacity: 0.6;
        }

        .check-btn {
          padding: 12px 28px;
          background: #6366f1;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
          min-width: 120px;
        }

        .check-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
        }

        .check-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .feedback {
          margin-top: 12px;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 15px;
        }

        .feedback.correct {
          background: #0e2d1f;
          color: #10b981;
          border: 1px solid #10b98133;
        }

        .feedback.incorrect {
          background: #2d1a0e;
          color: #ef4444;
          border: 1px solid #ef444433;
        }

        /* Navigation */
        .step-navigation {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid #1e293b;
        }

        .nav-btn {
          padding: 12px 24px;
          border: none;
          border-radius: 10px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }

        .prev-btn {
          background: #0f0f1a;
          color: #94a3b8;
          border: 1px solid #1e293b;
        }

        .prev-btn:hover:not(:disabled) {
          background: #1a1a2e;
          border-color: #334155;
        }

        .prev-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .next-btn {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .next-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
        }

        .next-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          transform: none;
        }

        .progress-warning {
          margin-top: 12px;
          padding: 12px;
          background: #2d1a0e;
          border-radius: 8px;
          color: #f59e0b;
          text-align: center;
          font-size: 14px;
          border: 1px solid #f59e0b33;
        }

        /* Dialogue */
        .dialogue-context {
          background: #0f0f1a;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 16px;
          color: #94a3b8;
          font-size: 14px;
        }

        .dialogue-container {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 20px;
        }

        .dialogue-line {
          padding: 12px 16px;
          border-radius: 10px;
        }

        .speaker-a {
          background: #0f0f1a;
          border-left: 3px solid #6366f1;
        }

        .speaker-b {
          background: #0a0a14;
          border-left: 3px solid #10b981;
        }

        .speaker-name {
          font-weight: 700;
          color: #f1f5f9;
          margin-right: 8px;
        }

        .dialogue-text {
          color: #e2e8f0;
        }

        .dialogue-translation {
          font-size: 13px;
          color: #94a3b8;
          margin-top: 4px;
        }

        .dialogue-practice {
          background: #0f0f1a;
          padding: 16px;
          border-radius: 10px;
          border: 1px solid #1e293b;
          margin-top: 16px;
        }

        .dialogue-practice h4 {
          color: #94a3b8;
          margin: 0 0 12px 0;
          font-size: 14px;
        }

        /* Summary */
        .summary-box {
          background: #0f0f1a;
          padding: 20px;
          border-radius: 10px;
        }

        .summary-box h4 {
          color: #6366f1;
          margin: 0 0 8px 0;
          font-size: 15px;
        }

        .summary-box h4:not(:first-child) {
          margin-top: 16px;
        }

        .summary-box ul {
          margin: 4px 0 0 0;
          padding-left: 20px;
          color: #94a3b8;
          font-size: 14px;
        }

        .summary-box li {
          margin: 4px 0;
        }

        /* Animations */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Loading & Error */
        .loading, .error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          color: #94a3b8;
        }

        .loading-spinner {
          font-size: 48px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .error-icon {
          font-size: 64px;
          margin-bottom: 16px;
        }

        .error h2 {
          color: #f1f5f9;
          margin: 0;
        }

        .error p {
          color: #94a3b8;
          margin: 8px 0 24px 0;
        }

        .back-home-btn {
          padding: 12px 24px;
          background: #6366f1;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          font-size: 14px;
        }

        .back-home-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .step-header {
            padding: 16px 20px;
          }
          .step-title {
            font-size: 20px;
          }
          .step-content {
            padding: 16px 20px;
          }
          .items-grid {
            grid-template-columns: 1fr;
          }
          .step-navigation {
            flex-direction: column;
          }
          .nav-btn {
            width: 100%;
            justify-content: center;
          }
          .fill-blank-group {
            flex-direction: column;
          }
          .check-btn {
            width: 100%;
          }
          .option-label {
            padding: 10px 14px;
          }
          .question-text {
            font-size: 16px;
          }
          .step-header .step-title {
            font-size: 18px;
          }
        }
      `}</style>
    </div>
  );
}