// LessonPage.jsx - Her adımda tek soru versiyonu
import { useState, useEffect } from "react";
import { supabase } from "../../config.js";
import "./LessonPage.css";

// ============================
// YARDIMCI FONKSİYONLAR
// ============================

// 📝 SUMMARY ADIMI - Ders Özeti
function SummaryStep({ step, onNext, onPrevious, isFirst, isLast }) {
  const content = step.content || {};

  return (
    <div className="step-container">
      <div className="step-header">
        <span className="step-number">Adım {step.id?.split('_')[1] || '?'}</span>
        <h2 className="step-title">{step.title}</h2>
      </div>

      <div className="step-content summary-content">
        <div className="summary-box">
          <div className="summary-icon">🎯</div>
          <h3>Ana Noktalar</h3>
          <ul>
            {content.key_points?.map((point, idx) => (
              <li key={idx}>{point}</li>
            ))}
          </ul>
        </div>

        {content.practice_tasks && content.practice_tasks.length > 0 && (
          <div className="summary-box" style={{ marginTop: 20 }}>
            <div className="summary-icon">✍️</div>
            <h3>Pratik Görevleri</h3>
            <ul>
              {content.practice_tasks.map((task, idx) => (
                <li key={idx}>{task}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="summary-complete">
          <div className="complete-icon">🎉</div>
          <h3>Tebrikler!</h3>
          <p>Bu dersi başarıyla tamamladınız. Öğrendiklerinizi pekiştirmek için pratik görevlerini yapmayı unutmayın.</p>
        </div>

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

        {content?.rule && (
          <div className="rule-box">
            <span className="rule-icon">📌</span>
            <span>{content.rule}</span>
          </div>
        )}

        {content?.short_forms && (
          <div className="short-forms-box">
            <span className="short-icon">⚡</span>
            <span>{content.short_forms}</span>
          </div>
        )}

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

// ❓ PRACTICE ADIMI - Tek Soru (OTOMATİK KONTROL)
function PracticeStep({ step, onNext, onPrevious, isFirst, isLast }) {
  const [answer, setAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const questions = step.questions || [];
  const question = questions[0];

  useEffect(() => {
    setAnswer('');
    setShowFeedback(false);
    setIsCorrect(false);
  }, [step.id]);

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
    const correct = value === question.correct;
    setIsCorrect(correct);
    setShowFeedback(true);
  };

  const handleInputChange = (value) => {
    if (showFeedback) return;
    setAnswer(value);
  };

  const handleInputCheck = () => {
    if (!answer) {
      alert('Lütfen bir cevap yazın!');
      return;
    }
    const correct = answer.trim().toLowerCase() === question.correct.toLowerCase();
    setIsCorrect(correct);
    setShowFeedback(true);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !showFeedback && answer) {
      handleInputCheck();
    }
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
    setAnswer('');
    setShowFeedback(false);
    setIsCorrect(false);
    onNext();
  };

  const handlePrevious = () => {
    setAnswer('');
    setShowFeedback(false);
    setIsCorrect(false);
    onPrevious();
  };

  return (
    <div className="step-container">
      <div className="step-header">
        <span className="step-number">Adım {step.id?.split('_')[1] || '?'}</span>
        <h2 className="step-title">{step.title}</h2>
      </div>

      <div className="step-content practice-content">
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

          {question.options && (
            <div className="options-group">
              {question.options.map((option, optIndex) => {
                const isSelected = answer === option;
                const isCorrectOption = showFeedback && option === question.correct;
                const isWrongOption = showFeedback && isSelected && option !== question.correct;
                
                return (
                  <label 
                    key={optIndex} 
                    className={`option-label 
                      ${showFeedback ? (isCorrectOption ? 'correct-option' : isWrongOption ? 'wrong-option' : '') : ''}
                      ${isSelected && !showFeedback ? 'selected-option' : ''}
                    `}
                  >
                    <input
                      type="radio"
                      name="question"
                      value={option}
                      checked={isSelected}
                      onChange={() => handleOptionSelect(option)}
                      disabled={showFeedback}
                    />
                    <span>{option}</span>
                    {showFeedback && isCorrectOption && (
                      <span className="check-icon">✅</span>
                    )}
                    {showFeedback && isWrongOption && (
                      <span className="check-icon">❌</span>
                    )}
                  </label>
                );
              })}
            </div>
          )}

          {!question.options && (
            <div className="fill-blank-group">
              <input
                type="text"
                className="fill-blank-input"
                value={answer}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={showFeedback}
                placeholder="Cevabınızı yazın..."
              />
              {!showFeedback && (
                <button 
                  className="check-btn"
                  onClick={handleInputCheck}
                >
                  Kontrol Et
                </button>
              )}
            </div>
          )}

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

// 🎭 DIALOGUE ADIMI - Diyalog (DÜZELTİLMİŞ)
function DialogueStep({ step, onNext, onPrevious, isFirst, isLast }) {
  const [answer, setAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const content = step.content || {};
  const scenes = content.scenes || [];
  const practice = step.practice || {};
  const practiceQuestions = practice.questions || [];
  const question = practiceQuestions[0];

  useEffect(() => {
    setAnswer('');
    setShowFeedback(false);
    setIsCorrect(false);
  }, [step.id]);

  const handleInputChange = (value) => {
    if (showFeedback) return;
    setAnswer(value);
  };

  const handleCheckAnswer = () => {
    if (!answer) {
      alert('Lütfen bir cevap yazın!');
      return;
    }
    if (!question) {
      alert('Soru bulunamadı!');
      return;
    }
    const correct = answer.trim().toLowerCase() === question.correct.toLowerCase();
    setIsCorrect(correct);
    setShowFeedback(true);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !showFeedback && answer) {
      handleCheckAnswer();
    }
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
    setAnswer('');
    setShowFeedback(false);
    setIsCorrect(false);
    onNext();
  };

  const handlePrevious = () => {
    setAnswer('');
    setShowFeedback(false);
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
                  onKeyPress={handleKeyPress}
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

        {!question && (
          <div className="dialogue-practice" style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>
            <p>Bu adımda pratik sorusu bulunmuyor.</p>
            <p style={{ fontSize: 13, marginTop: 8 }}>Diyalogu okuduktan sonra devam edin.</p>
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
            disabled={question ? (!showFeedback || !isCorrect) : false}
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
      case 'summary':
        return <SummaryStep {...props} />;
      default:
        console.warn(`Bilinmeyen adım tipi: ${step.type}`, step);
        return (
          <div className="step-container">
            <div className="step-content">
              <div style={{ 
                textAlign: 'center', 
                padding: '40px 20px',
                color: '#94a3b8'
              }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
                <h3 style={{ color: '#f1f5f9', marginBottom: 8 }}>Bilinmeyen Adım Tipi</h3>
                <p>Bu adım için görüntülenecek bileşen bulunamadı: <strong>{step.type}</strong></p>
                <button 
                  onClick={goToNextStep}
                  className="nav-btn next-btn"
                  style={{ marginTop: 16 }}
                >
                  Geç →
                </button>
              </div>
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
    <div className="lesson-page">
      {/* HEADER */}
      <header className="lesson-header">
        <div className="header-content">
          <button 
            onClick={onBack}
            className="back-btn"
          >
            ← Geri
          </button>
          
          <div className="header-info">
            <span className="lesson-number">
              Ders #{lesson.lesson_number}
            </span>
            <span 
              className="lesson-level"
              style={{ backgroundColor: getLevelColor(lesson.level) }}
            >
              {lesson.level}
            </span>
            <span className="step-counter">
              {currentStepIndex + 1} / {totalSteps}
            </span>
          </div>
        </div>
      </header>

      {/* PROGRESS BAR */}
      {totalSteps > 0 && (
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="main-content">
        {totalSteps > 0 && currentStep ? (
          renderStep(currentStep)
        ) : (
          <div className="no-content">
            <p>Bu ders için içerik bulunamadı.</p>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="lesson-footer">
        <div className="footer-content">
          <button 
            onClick={handlePrevLesson}
            disabled={!lesson || lesson.lesson_number <= 1}
            className="footer-btn"
          >
            ← Önceki Ders
          </button>
          <button 
            onClick={handleNextLesson}
            className="footer-btn"
          >
            Sonraki Ders →
          </button>
        </div>
      </footer>
    </div>
  );
}