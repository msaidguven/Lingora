// LessonPage.jsx - KARARLI SON VERSİYON
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../../config.js";
import "./LessonPage.css";

// ============================
// SABİT KULLANICI ID
// ============================
const FIXED_USER_ID = "302a3b6b-c1e9-49c4-98fe-52115bd7d204";

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

// 📝 SUMMARY ADIMI
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
          <button onClick={onPrevious} disabled={isFirst} className="nav-btn prev-btn">← Geri</button>
          <button onClick={onNext} className="nav-btn next-btn">
            {isLast ? '✅ Dersi Tamamla' : 'İlerle →'}
          </button>
        </div>
      </div>
    </div>
  );
}

// 📝 INFO ADIMI
function InfoStep({ step, onNext, onPrevious, isFirst, isLast }) {
  const content = step.content || {};

  return (
    <div className="step-container">
      <div className="step-header">
        <span className="step-number">Adım {step.id?.split('_')[1] || '?'}</span>
        <h2 className="step-title">{step.title}</h2>
      </div>
      <div className="step-content info-content">
        {content?.explanation && <p className="explanation-text">{content.explanation}</p>}
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
              <thead><tr><th>Özne</th><th>To Be</th></tr></thead>
              <tbody>
                {content.table.map((row, idx) => (
                  <tr key={idx}><td>{row.subject}</td><td className="verb-cell">{row.verb}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {content?.rule && (
          <div className="rule-box"><span className="rule-icon">📌</span><span>{content.rule}</span></div>
        )}
        {content?.short_forms && (
          <div className="short-forms-box"><span className="short-icon">⚡</span><span>{content.short_forms}</span></div>
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
          <div className="tip-box"><span className="tip-icon">💡</span><span>{content.tip}</span></div>
        )}
        <div className="step-navigation">
          <button onClick={onPrevious} disabled={isFirst} className="nav-btn prev-btn">← Geri</button>
          <button onClick={onNext} className="nav-btn next-btn">
            {isLast ? '✅ Dersi Tamamla' : 'İlerle →'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ❓ PRACTICE ADIMI - DÜZELTİLMİŞ KARARLI VERSİYON
// ❓ PRACTICE ADIMI - SON KARARLI VERSİYON
function PracticeStep({ step, onNext, onPrevious, isFirst, isLast, onWrongAnswer, wrongQuestions: externalWrongQuestions }) {
  const [answer, setAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questionList, setQuestionList] = useState([]);
  const [answeredQuestion, setAnsweredQuestion] = useState(null);
  const [isAllCompleted, setIsAllCompleted] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const allQuestions = step.questions || [];

  // BAŞLATMA: Sadece step.id değiştiğinde çalışır
  useEffect(() => {
    console.log('🔄 PracticeStep başlatılıyor...', step.id);
    
    if (allQuestions.length === 0) {
      setQuestionList([]);
      setIsAllCompleted(true);
      setIsInitialized(true);
      return;
    }

    // External'dan gelen yanlış soruları kontrol et
    if (externalWrongQuestions && externalWrongQuestions.length > 0) {
      console.log('📝 External sorular kullanılıyor:', externalWrongQuestions.length);
      setQuestionList(externalWrongQuestions);
    } else {
      // Tüm soruları karıştır
      const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
      console.log('🔀 Yeni sorular karıştırıldı:', shuffled.length);
      setQuestionList(shuffled);
      if (onWrongAnswer) {
        onWrongAnswer(shuffled);
      }
    }
    
    setCurrentIndex(0);
    setIsAllCompleted(false);
    setIsInitialized(true);
    setAnswer('');
    setShowFeedback(false);
    setIsCorrect(false);
    setAnsweredQuestion(null);
  }, [step.id]); // Sadece step.id değiştiğinde

  // Mevcut soruyu al - SADECE burada kontrol et
  const currentQuestion = (() => {
    if (answeredQuestion) return answeredQuestion;
    if (!isInitialized) return null;
    if (questionList.length === 0) return null;
    if (currentIndex >= questionList.length) return null;
    return questionList[currentIndex];
  })();

  // Soru değiştiğinde state'leri sıfırla
  useEffect(() => {
    if (questionList.length > 0 && !answeredQuestion) {
      setAnswer('');
      setShowFeedback(false);
      setIsCorrect(false);
    }
  }, [currentIndex, questionList.length, answeredQuestion]);

  // ============================
  // RENDER DURUMLARI
  // ============================

  // 1. Henüz başlatılmadı
  if (!isInitialized) {
    return (
      <div className="step-container">
        <div className="step-content">
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div className="loading-spinner">⏳</div>
            <p style={{ color: '#94a3b8' }}>Yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Hiç soru yok
  if (allQuestions.length === 0) {
    return (
      <div className="step-container">
        <div className="step-content">
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>❓</div>
            <h3 style={{ color: '#f1f5f9', marginBottom: 8 }}>Soru Bulunamadı</h3>
            <button onClick={onNext} className="nav-btn next-btn" style={{ marginTop: 16 }}>İlerle →</button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Tüm sorular tamamlandı - SADECE isAllCompleted true ise
  if (isAllCompleted) {
    return (
      <div className="step-container">
        <div className="step-header">
          <span className="step-number">Adım {step.id?.split('_')[1] || '?'}</span>
          <h2 className="step-title">{step.title}</h2>
          <span className="completed-count">✅ Tüm sorular tamamlandı!</span>
        </div>
        <div className="step-content">
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <h3 style={{ color: '#10b981', marginBottom: 8 }}>Tüm Sorular Tamamlandı!</h3>
            <p style={{ color: '#94a3b8' }}>Tüm soruları başarıyla cevapladınız.</p>
            <button onClick={onNext} className="nav-btn next-btn" style={{ marginTop: 16 }}>Devam Et →</button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Soru yok ama tamamlanmadı (arada bir durum)
  if (!currentQuestion) {
    return (
      <div className="step-container">
        <div className="step-content">
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div className="loading-spinner">⏳</div>
            <p style={{ color: '#94a3b8' }}>Soru hazırlanıyor...</p>
          </div>
        </div>
      </div>
    );
  }

  // ============================
  // SORU GÖSTERİMİ
  // ============================

  const handleOptionSelect = (value) => {
    if (showFeedback) return;
    setAnswer(value);
    const correct = value === currentQuestion.correct;
    setIsCorrect(correct);
    setShowFeedback(true);
    setAnsweredQuestion(currentQuestion);

    // Soruyu listeden çıkar
    const newList = [...questionList];
    newList.splice(currentIndex, 1);
    
    // Yanlışsa sona ekle
    if (!correct) {
      newList.push(currentQuestion);
    }

    console.log(`📝 ${correct ? '✅ Doğru' : '❌ Yanlış'} - Kalan soru: ${newList.length}`);
    setQuestionList(newList);
    
    if (onWrongAnswer) {
      onWrongAnswer(newList);
    }
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
    const correct = answer.trim().toLowerCase() === currentQuestion.correct.toLowerCase();
    setIsCorrect(correct);
    setShowFeedback(true);
    setAnsweredQuestion(currentQuestion);

    const newList = [...questionList];
    newList.splice(currentIndex, 1);
    
    if (!correct) {
      newList.push(currentQuestion);
    }

    console.log(`📝 ${correct ? '✅ Doğru' : '❌ Yanlış'} - Kalan soru: ${newList.length}`);
    setQuestionList(newList);
    
    if (onWrongAnswer) {
      onWrongAnswer(newList);
    }
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
    
    // Eğer hala soru varsa, sıradakine geç
    if (questionList.length > 0) {
      setCurrentIndex(0);
      setAnswer('');
      setShowFeedback(false);
      setIsCorrect(false);
      setAnsweredQuestion(null);
    } else {
      // Tüm sorular bitti
      onNext();
    }
  };

  const handlePrevious = () => {
    setAnswer('');
    setShowFeedback(false);
    setIsCorrect(false);
    setAnsweredQuestion(null);
    onPrevious();
  };

  const remainingCount = questionList.length;

  return (
    <div className="step-container">
      <div className="step-header">
        <span className="step-number">Adım {step.id?.split('_')[1] || '?'}</span>
        <h2 className="step-title">{step.title}</h2>
      </div>

      <div className="step-content practice-content">
        {step.rule && (
          <div className="rule-box"><span className="rule-icon">📌</span><span>{step.rule}</span></div>
        )}
        {step.instructions && <p className="instructions-text">{step.instructions}</p>}

        <div className="practice-question">
          <p className="question-text">{currentQuestion.question}</p>

          {currentQuestion.options && currentQuestion.options.length > 0 ? (
            <div className="options-group">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = answer === option;
                const isCorrectOption = showFeedback && option === currentQuestion.correct;
                const isWrongOption = showFeedback && isSelected && option !== currentQuestion.correct;
                
                return (
                  <label key={idx} className={`option-label 
                    ${showFeedback ? (isCorrectOption ? 'correct-option' : isWrongOption ? 'wrong-option' : '') : ''}
                    ${isSelected && !showFeedback ? 'selected-option' : ''}
                  `}>
                    <input
                      type="radio"
                      name="question"
                      value={option}
                      checked={isSelected}
                      onChange={() => handleOptionSelect(option)}
                      disabled={showFeedback}
                    />
                    <span>{option}</span>
                    {showFeedback && isCorrectOption && <span className="check-icon">✅</span>}
                    {showFeedback && isWrongOption && <span className="check-icon">❌</span>}
                  </label>
                );
              })}
            </div>
          ) : (
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
                <button className="check-btn" onClick={handleInputCheck}>Kontrol Et</button>
              )}
            </div>
          )}

          {showFeedback && (
            <div className={`feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
              {isCorrect 
                ? currentQuestion.feedback_correct || '✅ Doğru!'
                : currentQuestion.feedback_wrong || '❌ Yanlış. Tekrar deneyeceksiniz.'}
            </div>
          )}
        </div>

        <div className="step-navigation">
          <button onClick={handlePrevious} disabled={isFirst} className="nav-btn prev-btn">← Geri</button>
          <button onClick={handleNext} disabled={!showFeedback} className="nav-btn next-btn">
            {isLast && questionList.length === 0 ? '✅ Dersi Tamamla' : 'İlerle →'}
          </button>
        </div>

        {showFeedback && !isCorrect && (
          <div className="progress-warning">⚠️ Bu soruyu yanlış cevapladınız. Tekrar karşınıza çıkacak.</div>
        )}
        {showFeedback && isCorrect && remainingCount > 0 && (
          <div className="progress-info">✅ Doğru cevap! Kalan {remainingCount} soru var.</div>
        )}
        {showFeedback && isCorrect && remainingCount === 0 && (
          <div className="progress-info success">🎉 Tüm sorular tamamlandı! Devam edebilirsiniz.</div>
        )}
      </div>
    </div>
  );
}

// 🎭 DIALOGUE ADIMI
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
        {content.context && <div className="dialogue-context">📌 {content.context}</div>}
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
                  <button className="check-btn" onClick={handleCheckAnswer}>Kontrol Et</button>
                )}
              </div>
              {showFeedback && (
                <div className={`feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
                  {isCorrect ? question.feedback_correct || '✅ Doğru!' : question.feedback_wrong || '❌ Yanlış. Tekrar deneyin.'}
                </div>
              )}
            </div>
          </div>
        )}

        {!question && (
          <div className="dialogue-practice" style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>
            <p>Bu adımda pratik sorusu bulunmuyor.</p>
          </div>
        )}

        <div className="step-navigation">
          <button onClick={handlePrevious} disabled={isFirst} className="nav-btn prev-btn">← Geri</button>
          <button onClick={handleNext} disabled={question ? (!showFeedback || !isCorrect) : false} className="nav-btn next-btn">
            {isLast ? '✅ Dersi Tamamla' : 'İlerle →'}
          </button>
        </div>

        {showFeedback && !isCorrect && (
          <div className="progress-warning">⚠️ Doğru cevabı bulmadan ilerleyemezsiniz. Tekrar deneyin!</div>
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
  const [savingProgress, setSavingProgress] = useState(false);
  const [wrongQuestionsMap, setWrongQuestionsMap] = useState({});
  const [saveError, setSaveError] = useState(null);
  const [isProgressLoaded, setIsProgressLoaded] = useState(false);
  const contentRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  // Supabase işlemleri
  const loadProgressFromSupabase = async (lessonId) => {
    if (!lessonId) return null;
    try {
      const { data, error } = await supabase
        .from('en_user_lesson_progress')
        .select('*')
        .eq('user_id', FIXED_USER_ID)
        .eq('lesson_id', lessonId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Progress yükleme hatası:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Progress yükleme hatası:', error);
      return null;
    }
  };

  const saveProgressToSupabase = async (lessonId, stepIndex, totalSteps, wrongQuestions = {}) => {
    if (!lessonId) return;

    setSavingProgress(true);
    setSaveError(null);
    
    try {
      const isCompleted = stepIndex >= totalSteps - 1;
      const score = isCompleted ? 100 : Math.round((stepIndex / totalSteps) * 100);
      const wrongQuestionsJson = JSON.stringify(wrongQuestions);

      const { data: existing } = await supabase
        .from('en_user_lesson_progress')
        .select('id')
        .eq('user_id', FIXED_USER_ID)
        .eq('lesson_id', lessonId)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('en_user_lesson_progress')
          .update({
            completed: isCompleted,
            score: score,
            completed_at: isCompleted ? new Date().toISOString() : null,
            wrong_questions: wrongQuestionsJson
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('en_user_lesson_progress')
          .insert({
            user_id: FIXED_USER_ID,
            lesson_id: lessonId,
            completed: isCompleted,
            score: score,
            completed_at: isCompleted ? new Date().toISOString() : null,
            wrong_questions: wrongQuestionsJson
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Progress kaydetme hatası:', error);
      setSaveError(error.message);
    } finally {
      setSavingProgress(false);
    }
  };

  // Debounced save
  const debouncedSave = useCallback((lessonId, stepIndex, totalSteps, wrongQuestions) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveProgressToSupabase(lessonId, stepIndex, totalSteps, wrongQuestions);
    }, 1000);
  }, []);

  // Ders yükleme
  const fetchLesson = async (id) => {
    setLoading(true);
    setError(null);
    setCurrentStepIndex(0);
    setIsProgressLoaded(false);
    
    try {
      let query = supabase.from("en_lessons").select("*");
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
          lessonData.content_json = {};
        }
      }
      
      let loadedSteps = [];
      if (lessonData.content_json?.steps && Array.isArray(lessonData.content_json.steps)) {
        loadedSteps = lessonData.content_json.steps;
      } else {
        loadedSteps = convertLegacyToSteps(lessonData.content_json);
      }
      
      setSteps(loadedSteps);
      setLesson(lessonData);

      // Progress yükle
      const progress = await loadProgressFromSupabase(lessonData.id);
      if (progress) {
        if (progress.score !== null && progress.score !== undefined) {
          const stepIndex = Math.floor((progress.score / 100) * loadedSteps.length);
          if (stepIndex < loadedSteps.length) {
            setCurrentStepIndex(stepIndex);
          }
        }
        if (progress.wrong_questions) {
          try {
            const wrongQuestions = typeof progress.wrong_questions === 'string' 
              ? JSON.parse(progress.wrong_questions) 
              : progress.wrong_questions;
            setWrongQuestionsMap(wrongQuestions);
          } catch (e) {
            console.error('Wrong questions parse hatası:', e);
          }
        }
      }
      setIsProgressLoaded(true);
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
    setIsProgressLoaded(false);
    
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
          lessonData.content_json = {};
        }
      }
      
      let loadedSteps = [];
      if (lessonData.content_json?.steps && Array.isArray(lessonData.content_json.steps)) {
        loadedSteps = lessonData.content_json.steps;
      } else {
        loadedSteps = convertLegacyToSteps(lessonData.content_json);
      }
      
      setSteps(loadedSteps);
      setLesson(lessonData);

      const progress = await loadProgressFromSupabase(lessonData.id);
      if (progress) {
        if (progress.score !== null && progress.score !== undefined) {
          const stepIndex = Math.floor((progress.score / 100) * loadedSteps.length);
          if (stepIndex < loadedSteps.length) {
            setCurrentStepIndex(stepIndex);
          }
        }
        if (progress.wrong_questions) {
          try {
            const wrongQuestions = typeof progress.wrong_questions === 'string' 
              ? JSON.parse(progress.wrong_questions) 
              : progress.wrong_questions;
            setWrongQuestionsMap(wrongQuestions);
          } catch (e) {
            console.error('Wrong questions parse hatası:', e);
          }
        }
      }
      setIsProgressLoaded(true);
    } catch (error) {
      console.error("Ders yüklenirken hata:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (lessonId) {
      fetchLesson(lessonId);
    } else {
      fetchFirstLesson();
    }
  }, [lessonId]);

  // Progress kaydetme (debounced)
  useEffect(() => {
    if (lesson && steps.length > 0 && isProgressLoaded) {
      debouncedSave(lesson.id, currentStepIndex, steps.length, wrongQuestionsMap);
    }
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [currentStepIndex, lesson, steps, wrongQuestionsMap, isProgressLoaded, debouncedSave]);

  const convertLegacyToSteps = (content) => {
    const steps = [];
    let stepCounter = 1;

    if (content.theory_text) {
      steps.push({
        id: `step_${stepCounter++}`,
        type: 'info',
        title: 'Teori',
        content: { explanation: content.theory_text, rule: content.key_rules?.join('\n'), tip: content.common_mistakes?.join('\n') }
      });
    }

    if (content.vocabulary && content.vocabulary.length > 0) {
      steps.push({
        id: `step_${stepCounter++}`,
        type: 'info',
        title: 'Yeni Kelimeler',
        content: { items: content.vocabulary.map(v => ({ pronoun: v.word, meaning: v.meaning })) }
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
        content: { scenes: content.dialogue }
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
          key_points: typeof content.summary === 'string' ? [content.summary] : content.summary.key_points || [],
          practice_tasks: content.summary.practice_tasks || []
        }
      });
    }

    return steps;
  };

  const handleWrongAnswer = useCallback((stepId, wrongQuestions) => {
    setWrongQuestionsMap(prev => ({
      ...prev,
      [stepId]: wrongQuestions
    }));
  }, []);

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
        return (
          <PracticeStep 
            {...props}
            onWrongAnswer={(wrongQuestions) => handleWrongAnswer(step.id, wrongQuestions)}
            wrongQuestions={wrongQuestionsMap[step.id] || []}
          />
        );
      case 'dialogue':
        return <DialogueStep {...props} />;
      case 'summary':
        return <SummaryStep {...props} />;
      default:
        return (
          <div className="step-container">
            <div className="step-content">
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
                <h3 style={{ color: '#f1f5f9', marginBottom: 8 }}>Bilinmeyen Adım Tipi</h3>
                <p>Bu adım için görüntülenecek bileşen bulunamadı: <strong>{step.type}</strong></p>
                <button onClick={goToNextStep} className="nav-btn next-btn" style={{ marginTop: 16 }}>Geç →</button>
              </div>
            </div>
          </div>
        );
    }
  };

  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      if (contentRef.current) contentRef.current.scrollTop = 0;
    }
  };

  const goToNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      if (contentRef.current) contentRef.current.scrollTop = 0;
    } else {
      alert('🎉 Tebrikler! Dersi tamamladınız!');
      if (lesson) {
        saveProgressToSupabase(lesson.id, steps.length - 1, steps.length, wrongQuestionsMap);
      }
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
        <button onClick={onBack} className="back-home-btn">Ana Sayfaya Dön</button>
      </div>
    );
  }

  const currentStep = steps[currentStepIndex];
  const totalSteps = steps.length;
  const progress = totalSteps > 0 ? ((currentStepIndex + 1) / totalSteps) * 100 : 0;

  return (
    <div className="lesson-page">
      <header className="lesson-header">
        <div className="header-content">
          <button onClick={onBack} className="back-btn">← Geri</button>
          <div className="header-info">
            <span className="lesson-number">Ders #{lesson.lesson_number}</span>
            <span className="lesson-level" style={{ backgroundColor: getLevelColor(lesson.level) }}>
              {lesson.level}
            </span>
            <span className="step-counter">{currentStepIndex + 1} / {totalSteps}</span>
            {savingProgress && <span className="saving-indicator">💾 Kaydediliyor...</span>}
            {saveError && <span className="save-error">⚠️ Kayıt hatası</span>}
          </div>
        </div>
      </header>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <main className="main-content" ref={contentRef}>
        {totalSteps > 0 && currentStep ? renderStep(currentStep) : (
          <div className="no-content"><p>Bu ders için içerik bulunamadı.</p></div>
        )}
      </main>
    </div>
  );
}
