// LessonPage.jsx - TÜM STEP TİPLERİNİ DESTEKLEYEN SON VERSİYON
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

// ❓ MULTIPLE CHOICE ADIMI
// ❓ MULTIPLE CHOICE ADIMI - Seçenek harfleri kaldırıldı
function MultipleChoiceStep({ step, onNext, onPrevious, isFirst, isLast, onWrongAnswer, wrongQuestions: externalWrongQuestions }) {
  const [selectedOptions, setSelectedOptions] = useState({});
  const [showFeedback, setShowFeedback] = useState({});
  const [isCorrect, setIsCorrect] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questionList, setQuestionList] = useState([]);
  const [isAllCompleted, setIsAllCompleted] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const allQuestions = step.questions || [];

  useEffect(() => {
    if (allQuestions.length === 0) {
      setQuestionList([]);
      setIsAllCompleted(true);
      setIsInitialized(true);
      return;
    }

    if (externalWrongQuestions && externalWrongQuestions.length > 0) {
      setQuestionList(externalWrongQuestions);
    } else {
      const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
      setQuestionList(shuffled);
      if (onWrongAnswer) {
        onWrongAnswer(shuffled);
      }
    }
    
    setCurrentIndex(0);
    setIsAllCompleted(false);
    setIsInitialized(true);
    setSelectedOptions({});
    setShowFeedback({});
    setIsCorrect({});
  }, [step.id]);

  const currentQuestion = (() => {
    if (!isInitialized) return null;
    if (questionList.length === 0) return null;
    if (currentIndex >= questionList.length) return null;
    return questionList[currentIndex];
  })();

  const handleOptionSelect = (optionIndex) => {
    if (showFeedback[currentIndex]) return;
    
    const correct = optionIndex === currentQuestion.correct;
    setSelectedOptions(prev => ({ ...prev, [currentIndex]: optionIndex }));
    setIsCorrect(prev => ({ ...prev, [currentIndex]: correct }));
    setShowFeedback(prev => ({ ...prev, [currentIndex]: true }));
  };

  const handleNext = () => {
    if (!showFeedback[currentIndex]) {
      alert('Lütfen önce soruyu cevaplayın!');
      return;
    }
    
    const newList = [...questionList];
    newList.splice(currentIndex, 1);
    
    if (!isCorrect[currentIndex]) {
      newList.push(currentQuestion);
    }

    setQuestionList(newList);
    
    if (onWrongAnswer) {
      onWrongAnswer(newList);
    }

    if (newList.length === 0) {
      setIsAllCompleted(true);
    } else {
      setCurrentIndex(0);
      setSelectedOptions({});
      setShowFeedback({});
      setIsCorrect({});
    }
  };

  const handlePrevious = () => {
    setSelectedOptions({});
    setShowFeedback({});
    setIsCorrect({});
    onPrevious();
  };

  if (isAllCompleted) {
    return (
      <div className="step-container">
        <div className="step-header">
          <span className="step-number">Adım {step.id?.split('_')[1] || '?'}</span>
          <h2 className="step-title">{step.title}</h2>
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

  if (!isInitialized || !currentQuestion) {
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

  const remainingCount = questionList.length;

  return (
    <div className="step-container">
      <div className="step-header">
        <span className="step-number">Adım {step.id?.split('_')[1] || '?'}</span>
        <h2 className="step-title">{step.title}</h2>
        <span className="completed-count">Kalan: {remainingCount} soru</span>
      </div>

      <div className="step-content practice-content">
        {step.rule && (
          <div className="rule-box"><span className="rule-icon">📌</span><span>{step.rule}</span></div>
        )}
        {step.instructions && <p className="instructions-text">{step.instructions}</p>}

        <div className="practice-question">
          <p className="question-text">{currentQuestion.question}</p>

          <div className="options-group">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedOptions[currentIndex] === idx;
              const isCorrectOption = showFeedback[currentIndex] && idx === currentQuestion.correct;
              const isWrongOption = showFeedback[currentIndex] && isSelected && idx !== currentQuestion.correct;
              
              return (
                <label key={idx} className={`option-label 
                  ${showFeedback[currentIndex] ? (isCorrectOption ? 'correct-option' : isWrongOption ? 'wrong-option' : '') : ''}
                  ${isSelected && !showFeedback[currentIndex] ? 'selected-option' : ''}
                `}>
                  <input
                    type="radio"
                    name="question"
                    value={idx}
                    checked={isSelected}
                    onChange={() => handleOptionSelect(idx)}
                    disabled={showFeedback[currentIndex]}
                  />
                  <span>{option}</span>
                  {showFeedback[currentIndex] && isCorrectOption && <span className="check-icon">✅</span>}
                  {showFeedback[currentIndex] && isWrongOption && <span className="check-icon">❌</span>}
                </label>
              );
            })}
          </div>

          {showFeedback[currentIndex] && (
            <div className={`feedback ${isCorrect[currentIndex] ? 'correct' : 'incorrect'}`}>
              {isCorrect[currentIndex] 
                ? currentQuestion.feedback_correct || '✅ Doğru!'
                : currentQuestion.feedback_wrong || '❌ Yanlış. Tekrar dene.'}
            </div>
          )}
        </div>

        <div className="step-navigation">
          <button onClick={handlePrevious} disabled={isFirst} className="nav-btn prev-btn">← Geri</button>
          <button onClick={handleNext} disabled={!showFeedback[currentIndex]} className="nav-btn next-btn">
            {isLast && questionList.length === 0 ? '✅ Dersi Tamamla' : 'İlerle →'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ❓ FILL BLANK ADIMI
// ❓ FILL BLANK ADIMI - Seçenek harfleri kaldırıldı
function FillBlankStep({ step, onNext, onPrevious, isFirst, isLast, onWrongAnswer, wrongQuestions: externalWrongQuestions }) {
  const [selectedOptions, setSelectedOptions] = useState({});
  const [showFeedback, setShowFeedback] = useState({});
  const [isCorrect, setIsCorrect] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questionList, setQuestionList] = useState([]);
  const [isAllCompleted, setIsAllCompleted] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const allQuestions = step.questions || [];

  useEffect(() => {
    if (allQuestions.length === 0) {
      setQuestionList([]);
      setIsAllCompleted(true);
      setIsInitialized(true);
      return;
    }

    if (externalWrongQuestions && externalWrongQuestions.length > 0) {
      setQuestionList(externalWrongQuestions);
    } else {
      const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
      setQuestionList(shuffled);
      if (onWrongAnswer) {
        onWrongAnswer(shuffled);
      }
    }
    
    setCurrentIndex(0);
    setIsAllCompleted(false);
    setIsInitialized(true);
    setSelectedOptions({});
    setShowFeedback({});
    setIsCorrect({});
  }, [step.id]);

  const currentQuestion = (() => {
    if (!isInitialized) return null;
    if (questionList.length === 0) return null;
    if (currentIndex >= questionList.length) return null;
    return questionList[currentIndex];
  })();

  const handleOptionSelect = (optionIndex) => {
    if (showFeedback[currentIndex]) return;
    
    const correct = optionIndex === currentQuestion.correct;
    setSelectedOptions(prev => ({ ...prev, [currentIndex]: optionIndex }));
    setIsCorrect(prev => ({ ...prev, [currentIndex]: correct }));
    setShowFeedback(prev => ({ ...prev, [currentIndex]: true }));
  };

  const handleNext = () => {
    if (!showFeedback[currentIndex]) {
      alert('Lütfen önce soruyu cevaplayın!');
      return;
    }
    
    const newList = [...questionList];
    newList.splice(currentIndex, 1);
    
    if (!isCorrect[currentIndex]) {
      newList.push(currentQuestion);
    }

    setQuestionList(newList);
    
    if (onWrongAnswer) {
      onWrongAnswer(newList);
    }

    if (newList.length === 0) {
      setIsAllCompleted(true);
    } else {
      setCurrentIndex(0);
      setSelectedOptions({});
      setShowFeedback({});
      setIsCorrect({});
    }
  };

  const handlePrevious = () => {
    setSelectedOptions({});
    setShowFeedback({});
    setIsCorrect({});
    onPrevious();
  };

  if (isAllCompleted) {
    return (
      <div className="step-container">
        <div className="step-header">
          <span className="step-number">Adım {step.id?.split('_')[1] || '?'}</span>
          <h2 className="step-title">{step.title}</h2>
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

  if (!isInitialized || !currentQuestion) {
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

  const remainingCount = questionList.length;

  return (
    <div className="step-container">
      <div className="step-header">
        <span className="step-number">Adım {step.id?.split('_')[1] || '?'}</span>
        <h2 className="step-title">{step.title}</h2>
        <span className="completed-count">Kalan: {remainingCount} soru</span>
      </div>

      <div className="step-content practice-content">
        {step.rule && (
          <div className="rule-box"><span className="rule-icon">📌</span><span>{step.rule}</span></div>
        )}
        {step.instructions && <p className="instructions-text">{step.instructions}</p>}

        <div className="practice-question">
          <p className="question-text">{currentQuestion.question}</p>

          <div className="options-group fill-blank-options">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedOptions[currentIndex] === idx;
              const isCorrectOption = showFeedback[currentIndex] && idx === currentQuestion.correct;
              const isWrongOption = showFeedback[currentIndex] && isSelected && idx !== currentQuestion.correct;
              
              return (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(idx)}
                  className={`fill-blank-btn 
                    ${showFeedback[currentIndex] ? (isCorrectOption ? 'correct-option' : isWrongOption ? 'wrong-option' : '') : ''}
                    ${isSelected && !showFeedback[currentIndex] ? 'selected-option' : ''}
                  `}
                  disabled={showFeedback[currentIndex]}
                >
                  {option}
                  {showFeedback[currentIndex] && isCorrectOption && ' ✅'}
                  {showFeedback[currentIndex] && isWrongOption && ' ❌'}
                </button>
              );
            })}
          </div>

          {showFeedback[currentIndex] && (
            <div className={`feedback ${isCorrect[currentIndex] ? 'correct' : 'incorrect'}`}>
              {isCorrect[currentIndex] 
                ? currentQuestion.feedback_correct || '✅ Doğru!'
                : currentQuestion.feedback_wrong || '❌ Yanlış. Tekrar dene.'}
            </div>
          )}
        </div>

        <div className="step-navigation">
          <button onClick={handlePrevious} disabled={isFirst} className="nav-btn prev-btn">← Geri</button>
          <button onClick={handleNext} disabled={!showFeedback[currentIndex]} className="nav-btn next-btn">
            {isLast && questionList.length === 0 ? '✅ Dersi Tamamla' : 'İlerle →'}
          </button>
        </div>
      </div>
    </div>
  );
}

// 🔗 MATCHING ADIMI
function MatchingStep({ step, onNext, onPrevious, isFirst, isLast }) {
  const [matches, setMatches] = useState({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [shuffledLeft, setShuffledLeft] = useState([]);
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [wrongPairs, setWrongPairs] = useState([]);
  const [retryMode, setRetryMode] = useState(false);

  const pairs = step.pairs || [];

  // Başlangıç: Karıştır ve sıfırla
  const initializeGame = useCallback(() => {
    const shuffled = [...pairs].sort(() => Math.random() - 0.5);
    setShuffledLeft(shuffled.map(p => p.left));
    setMatches({});
    setShowFeedback(false);
    setIsCorrect(false);
    setSelectedLeft(null);
    setWrongPairs([]);
    setRetryMode(false);
  }, [pairs]);

  useEffect(() => {
    initializeGame();
  }, [step.id, initializeGame]);

  // Sadece yanlışları sıfırla (doğru olanlar sabit kalsın)
  const resetWrongOnes = useCallback(() => {
    // Yanlış olan eşleştirmeleri bul
    const wrongMatchKeys = wrongPairs.map(wp => wp.left);
    
    // Yanlış olanları matches'ten kaldır
    const newMatches = { ...matches };
    wrongMatchKeys.forEach(key => {
      delete newMatches[key];
    });
    
    // Yanlış olan left'leri tekrar karıştır ve listeye ekle
    const wrongLeftItems = wrongPairs.map(wp => wp.left);
    const shuffledWrong = [...wrongLeftItems].sort(() => Math.random() - 0.5);
    
    // Mevcut left listesini güncelle (doğru olanlar sabit, yanlış olanlar karıştırıldı)
    const currentLeftItems = shuffledLeft.filter(item => !wrongLeftItems.includes(item));
    const newShuffledLeft = [...currentLeftItems, ...shuffledWrong];
    
    setShuffledLeft(newShuffledLeft);
    setMatches(newMatches);
    setShowFeedback(false);
    setIsCorrect(false);
    setSelectedLeft(null);
    setRetryMode(true);
  }, [matches, shuffledLeft, wrongPairs]);

  const handleLeftClick = (leftValue) => {
    if (showFeedback) return;
    if (matches[leftValue]) return;
    setSelectedLeft(selectedLeft === leftValue ? null : leftValue);
  };

  const handleRightClick = (rightValue) => {
    if (showFeedback) return;
    if (!selectedLeft) return;
    
    // Bu right zaten eşleşmiş mi kontrol et
    const alreadyMatched = Object.values(matches).some(m => m.right === rightValue);
    if (alreadyMatched) return;
    
    const pair = pairs.find(p => p.left === selectedLeft);
    if (!pair) return;

    const isMatch = pair.right === rightValue;
    
    setMatches(prev => ({
      ...prev,
      [selectedLeft]: { right: rightValue, isMatch }
    }));
    
    setSelectedLeft(null);
  };

  const handleCheck = () => {
    const allMatched = Object.keys(matches).length === pairs.length;
    if (!allMatched) {
      alert('Lütfen tüm eşleştirmeleri yapın!');
      return;
    }
    
    // Yanlış olanları bul
    const wrongs = Object.entries(matches)
      .filter(([key, value]) => !value.isMatch)
      .map(([key, value]) => ({ left: key, right: value.right }));
    
    setWrongPairs(wrongs);
    
    const allCorrect = wrongs.length === 0;
    setIsCorrect(allCorrect);
    setShowFeedback(true);
    
    if (!allCorrect) {
      setRetryMode(true);
    }
  };

  const handleNext = () => {
    if (!showFeedback || !isCorrect) {
      alert('Önce tüm eşleştirmeleri doğru yapmalısınız!');
      return;
    }
    onNext();
  };

  const handlePrevious = () => {
    initializeGame();
    onPrevious();
  };

  const matchedLeftItems = Object.keys(matches);
  const allMatched = matchedLeftItems.length === pairs.length;

  // Doğru olan eşleştirmeler (kontrol sonrası)
  const correctMatches = Object.entries(matches)
    .filter(([key, value]) => value.isMatch)
    .map(([key]) => key);

  return (
    <div className="step-container">
      <div className="step-header">
        <span className="step-number">Adım {step.id?.split('_')[1] || '?'}</span>
        <h2 className="step-title">{step.title}</h2>
        <span className="completed-count">
          {Object.keys(matches).length} / {pairs.length} eşleştirildi
          {showFeedback && !isCorrect && (
            <span style={{ color: '#ef4444', marginLeft: 12 }}>
              ❌ {wrongPairs.length} yanlış
            </span>
          )}
          {showFeedback && isCorrect && (
            <span style={{ color: '#10b981', marginLeft: 12 }}>✅ Tamamı doğru!</span>
          )}
        </span>
      </div>

      <div className="step-content matching-content">
        {step.instructions && <p className="instructions-text">{step.instructions}</p>}

        {/* Doğru olanlar sabit, yanlış olanlar tekrar çözülüyor */}
        {retryMode && !isCorrect && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 16,
            color: '#f87171'
          }}>
            <span style={{ fontWeight: 600 }}>⚠️ {wrongPairs.length} yanlış eşleştirme var!</span>
            <span style={{ marginLeft: 8, fontSize: 14 }}>
              Doğru olanlar sabitlendi, sadece yanlış olanları tekrar eşleştirin.
            </span>
          </div>
        )}

        <div className="matching-container">
          <div className="matching-left">
            <h4>📌 Kelimeler</h4>
            {shuffledLeft.map((left, idx) => {
              const isMatched = matchedLeftItems.includes(left);
              const isSelected = selectedLeft === left;
              const match = matches[left];
              const isWrong = wrongPairs.some(wp => wp.left === left);
              const isCorrectMatch = match && match.isMatch;
              
              let itemClass = 'matching-item left-item';
              if (isMatched) itemClass += ' matched';
              if (isSelected) itemClass += ' selected';
              
              // Feedback gösteriliyorsa renkleri göster
              if (showFeedback && match) {
                if (isCorrectMatch) {
                  itemClass += ' correct-match';
                } else if (isWrong) {
                  itemClass += ' wrong-match';
                }
              }
              
              // Eğer retry modundaysa ve doğruysa sabit göster
              if (retryMode && isCorrectMatch) {
                itemClass += ' correct-match';
              }
              
              return (
                <div
                  key={idx}
                  onClick={() => handleLeftClick(left)}
                  className={itemClass}
                  style={{
                    opacity: (retryMode && isCorrectMatch) ? 0.7 : 1,
                    cursor: (retryMode && isCorrectMatch) ? 'default' : 'pointer'
                  }}
                >
                  <span>{left}</span>
                  {isMatched && (
                    <span className="match-indicator">
                      {showFeedback && match ? (isCorrectMatch ? '✅' : '❌') : '✓'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="matching-arrow">⟷</div>

          <div className="matching-right">
            <h4>🎯 Anlamları</h4>
            {pairs.map((pair, idx) => {
              const matchedWith = Object.entries(matches).find(([key, val]) => val.right === pair.right);
              const isMatched = !!matchedWith;
              const leftKey = matchedWith?.[0];
              const match = matches[leftKey];
              const isWrong = wrongPairs.some(wp => wp.left === leftKey);
              const isCorrectMatch = match && match.isMatch;
              
              let itemClass = 'matching-item right-item';
              if (isMatched) itemClass += ' matched';
              
              if (showFeedback && match) {
                if (isCorrectMatch) {
                  itemClass += ' correct-match';
                } else if (isWrong) {
                  itemClass += ' wrong-match';
                }
              }
              
              if (retryMode && isCorrectMatch) {
                itemClass += ' correct-match';
              }
              
              return (
                <div
                  key={idx}
                  onClick={() => handleRightClick(pair.right)}
                  className={itemClass}
                  style={{
                    opacity: (retryMode && isCorrectMatch) ? 0.7 : 1,
                    cursor: (retryMode && isCorrectMatch) ? 'default' : 'pointer'
                  }}
                >
                  <span>{pair.right}</span>
                  {isMatched && (
                    <span className="match-indicator">
                      {showFeedback && match ? (isCorrectMatch ? '✅' : '❌') : '✓'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Butonlar */}
        <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
          {!showFeedback && allMatched && (
            <button onClick={handleCheck} className="check-btn" style={{ flex: 1 }}>
              ✅ Kontrol Et
            </button>
          )}

          {showFeedback && !isCorrect && (
            <>
              <button 
                onClick={resetWrongOnes} 
                className="retry-btn"
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#f59e0b',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#d97706'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#f59e0b'}
              >
                🔄 Sadece Yanlışları Tekrar Çöz
              </button>
              <button 
                onClick={initializeGame} 
                className="reset-btn"
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#6b7280',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#4b5563'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#6b7280'}
              >
                🔄 Tamamen Sıfırla
              </button>
            </>
          )}

          {showFeedback && isCorrect && (
            <div style={{ 
              flex: 1, 
              padding: '12px 20px',
              borderRadius: 8,
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid #10b981',
              color: '#10b981',
              textAlign: 'center',
              fontWeight: 600
            }}>
              🎉 Tüm eşleştirmeler doğru! Devam edebilirsiniz.
            </div>
          )}
        </div>

        {showFeedback && (
          <div className={`feedback ${isCorrect ? 'correct' : 'incorrect'}`} style={{ marginTop: 12 }}>
            {isCorrect 
              ? step.feedback_correct || '🎉 Harika! Tüm eşleştirmeler doğru!'
              : step.feedback_wrong || `😅 ${wrongPairs.length} eşleştirme yanlış. Yanlış olanları tekrar eşleştirin veya tamamen sıfırlayın.`}
          </div>
        )}

        <div className="step-navigation">
          <button onClick={handlePrevious} disabled={isFirst} className="nav-btn prev-btn">← Geri</button>
          <button 
            onClick={handleNext} 
            disabled={!showFeedback || !isCorrect} 
            className="nav-btn next-btn"
          >
            {isLast ? '✅ Dersi Tamamla' : 'İlerle →'}
          </button>
        </div>
      </div>
    </div>
  );
}

// 🎯 DRAG & DROP ADIMI
function DragDropStep({ step, onNext, onPrevious, isFirst, isLast }) {
  const [items, setItems] = useState([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);

  const words = step.words || [];
  const correctOrder = step.correct_order || [];

  useEffect(() => {
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setItems(shuffled);
    setShowFeedback(false);
    setIsCorrect(false);
  }, [step.id]);

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const newItems = [...items];
    const [draggedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, draggedItem);
    setItems(newItems);
    setDraggedIndex(null);
  };

  const handleCheck = () => {
    const isCorrectOrder = items.every((item, index) => {
      const originalIndex = words.indexOf(item);
      return originalIndex === correctOrder[index];
    });
    setIsCorrect(isCorrectOrder);
    setShowFeedback(true);
  };

  const handleNext = () => {
    if (!showFeedback || !isCorrect) {
      alert('Doğru sıralamayı bulmadan ilerleyemezsiniz!');
      return;
    }
    onNext();
  };

  const handlePrevious = () => {
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setItems(shuffled);
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

      <div className="step-content dragdrop-content">
        {step.instructions && <p className="instructions-text">{step.instructions}</p>}
        {step.sentence && (
          <div className="target-sentence">
            <span style={{ color: '#94a3b8', fontSize: 14 }}>🎯 Hedef Cümle:</span>
            <span style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 18 }}>{step.sentence}</span>
          </div>
        )}

        <div className="dragdrop-container">
          <div className="dragdrop-items">
            {items.map((item, index) => (
              <div
                key={index}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className={`dragdrop-item 
                  ${draggedIndex === index ? 'dragging' : ''}
                  ${showFeedback ? (items[index] === words[correctOrder[index]] ? 'correct-position' : 'wrong-position') : ''}
                `}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        {!showFeedback && (
          <button onClick={handleCheck} className="check-btn" style={{ marginTop: 16, width: '100%' }}>
            ✅ Kontrol Et
          </button>
        )}

        {showFeedback && (
          <div className={`feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
            {isCorrect ? step.feedback_correct || '✅ Mükemmel! Doğru sıralama!' : step.feedback_wrong || '❌ Sıralama yanlış. Tekrar dene!'}
            {!isCorrect && (
              <div style={{ marginTop: 8, fontSize: 13, color: '#94a3b8' }}>
                💡 İpucu: Doğru sıralama: {words.map(w => `"${w}"`).join(' → ')}
              </div>
            )}
          </div>
        )}

        <div className="step-navigation">
          <button onClick={handlePrevious} disabled={isFirst} className="nav-btn prev-btn">← Geri</button>
          <button onClick={handleNext} disabled={!showFeedback || !isCorrect} className="nav-btn next-btn">
            {isLast ? '✅ Dersi Tamamla' : 'İlerle →'}
          </button>
        </div>
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
        .select('id, completed, score, completed_at')
        .eq('user_id', FIXED_USER_ID)
        .eq('lesson_id', lessonId)
        .single();

      if (existing) {
        const nextCompleted = existing.completed || isCompleted;
        const nextScore = Math.max(existing.score || 0, score);
        const { error } = await supabase
          .from('en_user_lesson_progress')
          .update({
            completed: nextCompleted,
            score: nextScore,
            completed_at: nextCompleted ? (existing.completed_at || new Date().toISOString()) : null,
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
        type: 'summary',
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
      case 'multiple_choice':
        return (
          <MultipleChoiceStep 
            {...props}
            onWrongAnswer={(wrongQuestions) => handleWrongAnswer(step.id, wrongQuestions)}
            wrongQuestions={wrongQuestionsMap[step.id] || []}
          />
        );
      case 'fill_blank':
        return (
          <FillBlankStep 
            {...props}
            onWrongAnswer={(wrongQuestions) => handleWrongAnswer(step.id, wrongQuestions)}
            wrongQuestions={wrongQuestionsMap[step.id] || []}
          />
        );
      case 'matching':
        return <MatchingStep {...props} />;
      case 'drag_drop':
        return <DragDropStep {...props} />;
      case 'practice':
        return (
          <FillBlankStep 
            {...props}
            onWrongAnswer={(wrongQuestions) => handleWrongAnswer(step.id, wrongQuestions)}
            wrongQuestions={wrongQuestionsMap[step.id] || []}
          />
        );
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

  const handleBackToHome = async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    if (lesson && steps.length > 0 && isProgressLoaded) {
      await saveProgressToSupabase(lesson.id, currentStepIndex, steps.length, wrongQuestionsMap);
    }
    onBack?.();
  };

  const goToNextStep = async () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      if (contentRef.current) contentRef.current.scrollTop = 0;
    } else {
      if (lesson) {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = null;
        }
        const completedWrongQuestionsMap = steps.reduce((acc, step) => {
          if (step.type === 'practice' || step.type === 'multiple_choice' || step.type === 'fill_blank') {
            acc[step.id] = [];
          }
          return acc;
        }, {});
        setWrongQuestionsMap(completedWrongQuestionsMap);
        await saveProgressToSupabase(lesson.id, steps.length - 1, steps.length, completedWrongQuestionsMap);
      }
      onBack?.();
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
          <button onClick={handleBackToHome} className="back-btn">← Geri</button>
          <div className="header-info">
            <span className="lesson-number">Ders #{lesson.lesson_number}</span>
            <span className="lesson-level" style={{ backgroundColor: getLevelColor(lesson.level) }}>
              {lesson.level}
            </span>
            <span className="step-counter">{currentStepIndex + 1} / {totalSteps}</span>
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