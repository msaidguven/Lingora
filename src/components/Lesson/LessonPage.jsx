// LessonPage.jsx - Hata Ayıklamalı Versiyon
import { useState, useEffect, useRef } from "react";
import { supabase } from "../../config.js";
import "./LessonPage.css";

// ============================
// SABİT KULLANICI ID
// ============================
const FIXED_USER_ID = "302a3b6b-c1e9-49c4-98fe-52115bd7d204";

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

// ❓ PRACTICE ADIMI - Tek Soru (Yanlışları Kaydet ve Tekrar Göster)
// ❓ PRACTICE ADIMI - DÜZELTİLMİŞ VERSİYON
function PracticeStep({ 
  step, 
  onNext, 
  onPrevious, 
  isFirst, 
  isLast, 
  onWrongAnswer, 
  wrongQuestions: externalWrongQuestions,
  onQuestionCompleted 
}) {
  const [answer, setAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [internalWrongQuestions, setInternalWrongQuestions] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const allQuestions = step.questions || [];
  
  // DEBUG: Soruları kontrol et
  console.log('🔍 PracticeStep - Sorular:', allQuestions);
  console.log('🔍 PracticeStep - External Wrong:', externalWrongQuestions);
  console.log('🔍 PracticeStep - Step ID:', step.id);

  // INIT: Soruları başlat
  useEffect(() => {
    console.log('🔄 PracticeStep - useEffect çalıştı');
    
    if (allQuestions.length === 0) {
      console.warn('⚠️ Hiç soru yok!');
      setInternalWrongQuestions([]);
      setCurrentQuestionIndex(0);
      setIsInitialized(true);
      return;
    }
    
    // Eğer external wrongQuestions varsa ve doluysa onu kullan
    if (externalWrongQuestions && externalWrongQuestions.length > 0) {
      console.log('📝 External wrong questions kullanılıyor:', externalWrongQuestions);
      setInternalWrongQuestions(externalWrongQuestions);
      setCurrentQuestionIndex(0);
    } else {
      // İlk yükleme: tüm soruları karıştır ve listeye ekle
      const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
      console.log('🔀 Tüm sorular karıştırıldı:', shuffled);
      setInternalWrongQuestions(shuffled);
      setCurrentQuestionIndex(0);
      
      // Parent'a bildir (ilk yükleme)
      if (onWrongAnswer) {
        onWrongAnswer(shuffled);
      }
    }
    
    setAnswer('');
    setShowFeedback(false);
    setIsCorrect(false);
    setIsInitialized(true);
  }, [step.id, allQuestions]);

  // Mevcut soruyu al
  const getCurrentQuestion = () => {
    if (!isInitialized) {
      console.log('⏳ Henüz başlatılmadı');
      return null;
    }
    
    if (internalWrongQuestions.length === 0) {
      console.log('ℹ️ Yanlış soru listesi boş - tüm sorular tamamlandı!');
      return null;
    }
    
    // currentQuestionIndex'in geçerli olduğundan emin ol
    if (currentQuestionIndex >= internalWrongQuestions.length) {
      console.log('🔄 Index sınırı aşıldı, sıfırlanıyor');
      setCurrentQuestionIndex(0);
      return internalWrongQuestions[0] || null;
    }
    
    const q = internalWrongQuestions[currentQuestionIndex];
    console.log('📌 Mevcut soru:', q);
    return q;
  };

  const question = getCurrentQuestion();

  // Soru değiştiğinde state'leri sıfırla
  useEffect(() => {
    if (question) {
      setAnswer('');
      setShowFeedback(false);
      setIsCorrect(false);
    }
  }, [currentQuestionIndex, question]);

  // Eğer soru yoksa ve tüm sorular tamamlandıysa
  if (allQuestions.length === 0) {
    return (
      <div className="step-container">
        <div className="step-content">
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>❓</div>
            <h3 style={{ color: '#f1f5f9', marginBottom: 8 }}>Soru Bulunamadı</h3>
            <p style={{ color: '#94a3b8' }}>Bu adım için soru mevcut değil.</p>
            <button 
              onClick={onNext} 
              className="nav-btn next-btn"
              style={{ marginTop: 16 }}
            >
              İlerle →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Eğer tüm sorular tamamlandıysa (liste boş)
  if (internalWrongQuestions.length === 0 && isInitialized) {
    console.log('🎉 Tüm sorular tamamlandı!');
    return (
      <div className="step-container">
        <div className="step-content">
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <h3 style={{ color: '#10b981', marginBottom: 8 }}>Tüm Sorular Tamamlandı!</h3>
            <p style={{ color: '#94a3b8' }}>Tüm soruları başarıyla cevapladınız.</p>
            <button 
              onClick={onNext} 
              className="nav-btn next-btn"
              style={{ marginTop: 16 }}
            >
              Devam Et →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Eğer henüz başlatılmadıysa veya soru yoksa
  if (!question) {
    console.log('⏳ Soru yükleniyor veya başlatılmadı...');
    return (
      <div className="step-container">
        <div className="step-content">
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div className="loading-spinner">⏳</div>
            <p style={{ color: '#94a3b8' }}>Soru yükleniyor...</p>
          </div>
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
    
    // Soruyu listeden çıkar
    const newWrongList = [...internalWrongQuestions];
    newWrongList.splice(currentQuestionIndex, 1);
    
    // Eğer yanlışsa sona ekle, doğruysa tamamen çıkar
    if (!correct) {
      newWrongList.push(question);
    }
    
    console.log(`📝 ${correct ? '✅ Doğru' : '❌ Yanlış'} - Kalan soru: ${newWrongList.length}`);
    setInternalWrongQuestions(newWrongList);
    
    // Parent'a bildir
    if (onWrongAnswer) {
      onWrongAnswer(newWrongList);
    }
    
    if (onQuestionCompleted) {
      onQuestionCompleted(question);
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
    const correct = answer.trim().toLowerCase() === question.correct.toLowerCase();
    setIsCorrect(correct);
    setShowFeedback(true);
    
    const newWrongList = [...internalWrongQuestions];
    newWrongList.splice(currentQuestionIndex, 1);
    
    if (!correct) {
      newWrongList.push(question);
    }
    
    console.log(`📝 ${correct ? '✅ Doğru' : '❌ Yanlış'} - Kalan soru: ${newWrongList.length}`);
    setInternalWrongQuestions(newWrongList);
    
    if (onWrongAnswer) {
      onWrongAnswer(newWrongList);
    }
    
    if (onQuestionCompleted) {
      onQuestionCompleted(question);
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
    if (internalWrongQuestions.length > 0) {
      setCurrentQuestionIndex(0);
      setAnswer('');
      setShowFeedback(false);
      setIsCorrect(false);
    } else {
      // Tüm sorular bitti
      onNext();
    }
  };

  const handlePrevious = () => {
    setAnswer('');
    setShowFeedback(false);
    setIsCorrect(false);
    onPrevious();
  };

  const wrongCount = internalWrongQuestions.length;

  return (
    <div className="step-container">
      <div className="step-header">
        <span className="step-number">Adım {step.id?.split('_')[1] || '?'}</span>
        <h2 className="step-title">{step.title}</h2>
        {wrongCount > 0 && (
          <span className="wrong-count">⚠️ {wrongCount} soru kaldı</span>
        )}
        {wrongCount === 0 && (
          <span className="completed-count">✅ Tüm sorular tamamlandı!</span>
        )}
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

          {question.options && question.options.length > 0 ? (
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
                ? question.feedback_correct || '✅ Doğru!'
                : question.feedback_wrong || '❌ Yanlış. Tekrar deneyeceksiniz.'}
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
            disabled={!showFeedback}
            className="nav-btn next-btn"
          >
            {isLast && wrongCount === 0
              ? '✅ Dersi Tamamla'
              : wrongCount > 0 
                ? 'Sonraki Soru →' 
                : 'İlerle →'}
          </button>
        </div>

        {showFeedback && !isCorrect && (
          <div className="progress-warning">
            ⚠️ Bu soruyu yanlış cevapladınız. Tekrar karşınıza çıkacak.
          </div>
        )}

        {showFeedback && isCorrect && wrongCount > 0 && (
          <div className="progress-info">
            ✅ Doğru cevap! Kalan {wrongCount} soru var.
          </div>
        )}

        {showFeedback && isCorrect && wrongCount === 0 && (
          <div className="progress-info success">
            🎉 Tüm soruları doğru cevapladınız! Devam edebilirsiniz.
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
  const [savingProgress, setSavingProgress] = useState(false);
  const [wrongQuestionsMap, setWrongQuestionsMap] = useState({});
  const [saveError, setSaveError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const contentRef = useRef(null);

  // Sabit kullanıcı ID'si
  const userId = FIXED_USER_ID;

  // İlerlemeyi Supabase'den yükle
  const loadProgressFromSupabase = async (lessonId) => {
    if (!lessonId) return null;

    try {
      console.log('📥 Progress yükleniyor...', { userId, lessonId });
      
      const { data, error } = await supabase
        .from('en_user_lesson_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Progress yükleme hatası:', error);
        return null;
      }

      if (data) {
        console.log('✅ Progress bulundu:', data);
      } else {
        console.log('ℹ️ Progress bulunamadı, yeni kayıt oluşturulacak');
      }

      return data;
    } catch (error) {
      console.error('❌ Progress yükleme hatası:', error);
      return null;
    }
  };

  // İlerlemeyi Supabase'e kaydet
  const saveProgressToSupabase = async (lessonId, stepIndex, totalSteps, wrongQuestions = {}) => {
    if (!lessonId) return;

    setSavingProgress(true);
    setSaveError(null);
    
    try {
      const isCompleted = stepIndex >= totalSteps - 1;
      const score = isCompleted ? 100 : Math.round((stepIndex / totalSteps) * 100);

      const wrongQuestionsJson = JSON.stringify(wrongQuestions);

      console.log('💾 Progress kaydediliyor...', { 
        userId, 
        lessonId, 
        stepIndex, 
        score, 
        isCompleted,
        wrongQuestionsCount: Object.keys(wrongQuestions).length
      });

      const { data: existing } = await supabase
        .from('en_user_lesson_progress')
        .select('id')
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .single();

      let result;
      if (existing) {
        const { data, error } = await supabase
          .from('en_user_lesson_progress')
          .update({
            completed: isCompleted,
            score: score,
            completed_at: isCompleted ? new Date().toISOString() : null,
            wrong_questions: wrongQuestionsJson
          })
          .eq('id', existing.id)
          .select();

        if (error) throw error;
        result = data;
        console.log('✅ Progress güncellendi:', result);
      } else {
        const { data, error } = await supabase
          .from('en_user_lesson_progress')
          .insert({
            user_id: userId,
            lesson_id: lessonId,
            completed: isCompleted,
            score: score,
            completed_at: isCompleted ? new Date().toISOString() : null,
            wrong_questions: wrongQuestionsJson
          })
          .select();

        if (error) throw error;
        result = data;
        console.log('✅ Progress oluşturuldu:', result);
      }

      return result;
    } catch (error) {
      console.error('❌ Progress kaydetme hatası:', error);
      setSaveError(error.message);
      return null;
    } finally {
      setSavingProgress(false);
    }
  };

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
      
      console.log('📚 Ders içeriği:', content);
      
      let loadedSteps = [];
      if (typeof lessonData.content_json === 'object' && lessonData.content_json !== null) {
        if (lessonData.content_json.steps && Array.isArray(lessonData.content_json.steps)) {
          loadedSteps = lessonData.content_json.steps;
        } else {
          loadedSteps = convertLegacyToSteps(lessonData.content_json);
        }
      }
      
      console.log('📝 Yüklenen adımlar:', loadedSteps);
      
      // Debug: Her adımın sorularını kontrol et
      loadedSteps.forEach((step, index) => {
        if (step.type === 'practice' || step.type === 'dialogue') {
          console.log(`🔍 Adım ${index} (${step.type}) - Sorular:`, step.questions || step.practice?.questions || 'Yok');
        }
      });
      
      setSteps(loadedSteps);
      setLesson(lessonData);
      setDebugInfo({
        totalSteps: loadedSteps.length,
        stepTypes: loadedSteps.map(s => s.type),
        hasQuestions: loadedSteps.some(s => s.questions?.length > 0 || s.practice?.questions?.length > 0)
      });

      // Supabase'den ilerlemeyi yükle
      const progress = await loadProgressFromSupabase(lessonData.id);
      if (progress) {
        if (progress.score !== null && progress.score !== undefined) {
          const stepIndex = Math.floor((progress.score / 100) * loadedSteps.length);
          if (stepIndex < loadedSteps.length) {
            setCurrentStepIndex(stepIndex);
            console.log('📍 Kaldığımız adım:', stepIndex);
          }
        }
        
        if (progress.wrong_questions) {
          try {
            const wrongQuestions = typeof progress.wrong_questions === 'string' 
              ? JSON.parse(progress.wrong_questions) 
              : progress.wrong_questions;
            setWrongQuestionsMap(wrongQuestions);
            console.log('📝 Yanlış sorular yüklendi:', wrongQuestions);
          } catch (e) {
            console.error('Wrong questions parse hatası:', e);
          }
        }
      }
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
      
      let loadedSteps = [];
      if (typeof lessonData.content_json === 'object' && lessonData.content_json !== null) {
        if (lessonData.content_json.steps && Array.isArray(lessonData.content_json.steps)) {
          loadedSteps = lessonData.content_json.steps;
        } else {
          loadedSteps = convertLegacyToSteps(lessonData.content_json);
        }
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
    } catch (error) {
      console.error("Ders yüklenirken hata:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // İlerleme değiştiğinde Supabase'e kaydet (debounce ile)
  useEffect(() => {
    let timeoutId;
    
    if (lesson && steps.length > 0) {
      timeoutId = setTimeout(() => {
        saveProgressToSupabase(
          lesson.id, 
          currentStepIndex, 
          steps.length,
          wrongQuestionsMap
        );
      }, 1000);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [currentStepIndex, lesson, steps, wrongQuestionsMap]);

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

  const handleWrongAnswer = (stepId, wrongQuestions) => {
    console.log(`📝 Adım ${stepId} için yanlış sorular güncellendi:`, wrongQuestions);
    setWrongQuestionsMap(prev => ({
      ...prev,
      [stepId]: wrongQuestions
    }));
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
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
    }
  };

  const goToNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
    } else {
      alert('🎉 Tebrikler! Dersi tamamladınız!');
      if (lesson) {
        saveProgressToSupabase(
          lesson.id, 
          steps.length - 1, 
          steps.length,
          wrongQuestionsMap
        );
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
            {savingProgress && (
              <span className="saving-indicator">💾 Kaydediliyor...</span>
            )}
            {saveError && (
              <span className="save-error">⚠️ Kayıt hatası</span>
            )}
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

      {/* DEBUG INFO */}
      {debugInfo && (
        <div style={{ 
          background: '#1a1a2e', 
          padding: '8px 16px', 
          fontSize: 12, 
          color: '#94a3b8',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap'
        }}>
          <span>📚 Toplam Adım: {debugInfo.totalSteps}</span>
          <span>📝 Tipler: {debugInfo.stepTypes.join(', ')}</span>
          <span>❓ Soru Var mı: {debugInfo.hasQuestions ? '✅ Evet' : '❌ Hayır'}</span>
          <span>📍 Mevcut Adım: {currentStepIndex + 1}</span>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="main-content" ref={contentRef}>
        {totalSteps > 0 && currentStep ? (
          renderStep(currentStep)
        ) : (
          <div className="no-content">
            <p>Bu ders için içerik bulunamadı.</p>
          </div>
        )}
      </main>
    </div>
  );
}