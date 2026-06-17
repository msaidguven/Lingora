// LessonPage.jsx
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
// BÖLÜM BİLEŞENLERİ
// ============================

// 📖 TEORİ BÖLÜMÜ
function TheorySection({ section }) {
  if (!section || !section.content) return null;
  
  const contentLines = typeof section.content === 'string' 
    ? section.content.split('\n') 
    : [];

  return (
    <div className="section theory-section">
      <h3 className="section-title">{section.title || "📖 Teori"}</h3>
      <div className="theory-content">
        {contentLines.map((line, i) => {
          if (line.trim().startsWith('KURAL:')) {
            return <div key={i} className="rule-box">{line}</div>;
          }
          if (line.trim().startsWith('DİKKAT:')) {
            return <div key={i} className="warning-box">{line}</div>;
          }
          if (line.trim().startsWith('Örnek:')) {
            return <div key={i} className="example-box">{line}</div>;
          }
          if (line.trim() === '') {
            return <br key={i} />;
          }
          if (line.trim().match(/^\d\./)) {
            return <div key={i} className="theory-heading">{line}</div>;
          }
          return <p key={i} className="theory-text">{line}</p>;
        })}
      </div>
      
      {section.key_rules && section.key_rules.length > 0 && (
        <div className="key-rules">
          <h4>🔑 Ana Kurallar</h4>
          <ul>
            {section.key_rules.map((rule, i) => (
              <li key={i}>{rule}</li>
            ))}
          </ul>
        </div>
      )}

      {section.common_mistakes && section.common_mistakes.length > 0 && (
        <div className="common-mistakes">
          <h4>⚠️ Sık Yapılan Hatalar</h4>
          <ul>
            {section.common_mistakes.map((mistake, i) => (
              <li key={i}>{mistake}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// 📚 KELİME BÖLÜMÜ
function VocabularySection({ section }) {
  const words = section.words || section.vocabulary || [];
  if (words.length === 0) return null;

  return (
    <div className="section vocabulary-section">
      <h3 className="section-title">{section.title || "📚 Kelimeler"}</h3>
      <div className="vocabulary-grid">
        {words.map((word, i) => (
          <div key={i} className="vocabulary-card">
            <div className="vocabulary-word">
              {word.word}
              {word.article && <span className="article-badge">{word.article}</span>}
              {word.part_of_speech && (
                <span className="pos-badge">{word.part_of_speech}</span>
              )}
            </div>
            <div className="vocabulary-meaning">{word.meaning}</div>
            {word.example && (
              <div className="vocabulary-example">
                <span className="example-en">"{word.example}"</span>
                <span className="example-tr">({word.example_tr})</span>
              </div>
            )}
            {word.category && (
              <div className="vocabulary-category">
                <span className="category-tag">{word.category}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// 💬 ÖRNEK CÜMLELER BÖLÜMÜ
function ExampleSentencesSection({ section }) {
  const sentences = section.sentences || section.example_sentences || [];
  if (sentences.length === 0) return null;

  return (
    <div className="section examples-section">
      <h3 className="section-title">{section.title || "💬 Örnek Cümleler"}</h3>
      <div className="examples-grid">
        {sentences.map((sentence, i) => (
          <div key={i} className="example-card">
            <div className="example-en">🇬🇧 {sentence.en}</div>
            <div className="example-tr">🇹🇷 {sentence.tr}</div>
            {sentence.structure && (
              <div className="example-structure">📐 {sentence.structure}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// 🎭 DİYALOG BÖLÜMÜ
function DialogueSection({ section }) {
  const scenes = section.scenes || section.dialogue || [];
  if (scenes.length === 0) return null;

  const isSimpleDialogue = !section.scenes;

  return (
    <div className="section dialogue-section">
      <h3 className="section-title">{section.title || "🎭 Diyalog"}</h3>
      {section.context && (
        <div className="dialogue-context">📌 {section.context}</div>
      )}
      <div className="dialogue-container">
        {isSimpleDialogue ? (
          scenes.map((line, i) => (
            <div key={i} className={`dialogue-line ${line.speaker === 'A' ? 'speaker-a' : 'speaker-b'}`}>
              <span className="speaker-name">{line.speaker}:</span>
              <span className="dialogue-text">{line.text}</span>
            </div>
          ))
        ) : (
          scenes.map((scene, i) => (
            <div key={i} className={`dialogue-line ${i % 2 === 0 ? 'speaker-a' : 'speaker-b'}`}>
              <div className="dialogue-speaker">
                <span className="speaker-name">{scene.speaker}:</span>
                <span className="dialogue-text">{scene.text}</span>
              </div>
              <div className="dialogue-details">
                <span className="dialogue-translation">🇹🇷 {scene.translation}</span>
                {scene.grammar_note && (
                  <span className="dialogue-grammar">📝 {scene.grammar_note}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      {section.roleplay_questions && section.roleplay_questions.length > 0 && (
        <div className="roleplay-section">
          <h4>🎭 Rol Yapma Aktiviteleri</h4>
          <ul>
            {section.roleplay_questions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ❓ QUIZ BÖLÜMÜ
function QuizSection({ section }) {
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const questions = section.questions || [];
  if (questions.length === 0) return null;

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const getScore = () => {
    let correct = 0;
    questions.forEach(q => {
      const qId = q.id || questions.indexOf(q);
      if (answers[qId] === q.correct) correct++;
    });
    return correct;
  };

  const isQuestionCorrect = (question) => {
    const qId = question.id || questions.indexOf(question);
    return answers[qId] && answers[qId] === question.correct;
  };

  const renderQuestion = (question, index) => {
    const qId = question.id || index;

    if (question.type === 'multiple_choice' || (!question.type && question.options)) {
      return (
        <div key={qId} className="quiz-question">
          <p className="question-text">
            <span className="question-number">{index + 1}.</span> {question.question}
          </p>
          <div className="options-group">
            {question.options.map((option, optIndex) => (
              <label key={optIndex} className="option-label">
                <input
                  type="radio"
                  name={`question-${qId}`}
                  value={option}
                  checked={answers[qId] === option}
                  onChange={() => handleAnswer(qId, option)}
                  disabled={showResults}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
          {showResults && (
            <div className={`feedback ${isQuestionCorrect(question) ? 'correct' : 'incorrect'}`}>
              {isQuestionCorrect(question) ? '✅ Doğru!' : '❌ Yanlış'}
              {question.explanation && (
                <span className="explanation"> - {question.explanation}</span>
              )}
            </div>
          )}
        </div>
      );
    }

    if (question.type === 'fill_blank') {
      return (
        <div key={qId} className="quiz-question">
          <p className="question-text">
            <span className="question-number">{index + 1}.</span> {question.question}
          </p>
          <input
            type="text"
            className="fill-blank-input"
            value={answers[qId] || ''}
            onChange={(e) => handleAnswer(qId, e.target.value)}
            disabled={showResults}
            placeholder="Cevabınızı yazın..."
          />
          {showResults && (
            <div className={`feedback ${answers[qId] === question.correct ? 'correct' : 'incorrect'}`}>
              {answers[qId] === question.correct ? '✅ Doğru!' : `❌ Doğru cevap: ${question.correct}`}
              {question.explanation && (
                <span className="explanation"> - {question.explanation}</span>
              )}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="section quiz-section">
      <h3 className="section-title">{section.title || "❓ Kendini Test Et"}</h3>
      <div className="quiz-container">
        {questions.map((question, index) => renderQuestion(question, index))}
        
        {!showResults && questions.length > 0 && (
          <button 
            className="check-answers-btn"
            onClick={() => setShowResults(true)}
          >
            ✅ Cevapları Kontrol Et
          </button>
        )}
        
        {showResults && (
          <div className="quiz-results">
            <div className="score-box">
              <span className="score-number">{getScore()}</span>
              <span className="score-total"> / {questions.length}</span>
              <span className="score-label">doğru</span>
            </div>
            <button 
              className="reset-quiz-btn"
              onClick={() => {
                setAnswers({});
                setShowResults(false);
              }}
            >
              🔄 Quiz'i Yeniden Başlat
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// 📝 ÖZET BÖLÜMÜ
function SummarySection({ section }) {
  if (!section) return null;

  const keyPoints = section.key_points || [];
  const practiceTasks = section.practice_tasks || [];

  if (keyPoints.length === 0 && practiceTasks.length === 0 && !section.next_lesson_preview) {
    return null;
  }

  return (
    <div className="section summary-section">
      <h3 className="section-title">{section.title || "📝 Ders Özeti"}</h3>
      <div className="summary-content">
        {keyPoints.length > 0 && (
          <div className="summary-points">
            <h4>🎯 Ana Noktalar</h4>
            <ul>
              {keyPoints.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          </div>
        )}
        
        {practiceTasks.length > 0 && (
          <div className="practice-tasks">
            <h4>✍️ Pratik Görevleri</h4>
            <ul>
              {practiceTasks.map((task, i) => (
                <li key={i}>{task}</li>
              ))}
            </ul>
          </div>
        )}
        
        {section.next_lesson_preview && (
          <div className="next-lesson-preview">
            <h4>🔜 Sıradaki Ders</h4>
            <p>{section.next_lesson_preview}</p>
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
  const [sections, setSections] = useState([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

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
    setCurrentSectionIndex(0);
    
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
        if (lessonData.content_json.theory_text || 
            lessonData.content_json.vocabulary || 
            lessonData.content_json.example_sentences) {
          const parsedSections = parseLegacyFormat(lessonData.content_json);
          setSections(parsedSections);
        } else if (lessonData.content_json.sections && Array.isArray(lessonData.content_json.sections)) {
          setSections(lessonData.content_json.sections);
        } else {
          setSections([]);
        }
      } else {
        setSections([]);
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
    setCurrentSectionIndex(0);
    
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
        if (lessonData.content_json.theory_text || 
            lessonData.content_json.vocabulary || 
            lessonData.content_json.example_sentences) {
          const parsedSections = parseLegacyFormat(lessonData.content_json);
          setSections(parsedSections);
        } else if (lessonData.content_json.sections && Array.isArray(lessonData.content_json.sections)) {
          setSections(lessonData.content_json.sections);
        } else {
          setSections([]);
        }
      } else {
        setSections([]);
      }
      
      setLesson(lessonData);
    } catch (error) {
      console.error("Ders yüklenirken hata:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const parseLegacyFormat = (content) => {
    const sections = [];
    
    if (content.theory_text) {
      sections.push({
        type: 'theory',
        title: '📖 Teori',
        content: content.theory_text,
        key_rules: content.key_rules || [],
        common_mistakes: content.common_mistakes || []
      });
    }
    
    if (content.vocabulary && content.vocabulary.length > 0) {
      sections.push({
        type: 'vocabulary',
        title: '📚 Kelimeler',
        vocabulary: content.vocabulary
      });
    }
    
    if (content.example_sentences && content.example_sentences.length > 0) {
      sections.push({
        type: 'example_sentences',
        title: '💬 Örnek Cümleler',
        example_sentences: content.example_sentences
      });
    }
    
    if (content.dialogue && content.dialogue.length > 0) {
      sections.push({
        type: 'dialogue',
        title: '🎭 Diyalog',
        dialogue: content.dialogue
      });
    }
    
    if (content.quiz && content.quiz.length > 0) {
      sections.push({
        type: 'quiz',
        title: '❓ Quiz',
        questions: content.quiz.map(q => ({ ...q, type: q.type || 'multiple_choice' }))
      });
    }
    
    if (content.summary) {
      const summaryText = typeof content.summary === 'string' ? content.summary : JSON.stringify(content.summary);
      sections.push({
        type: 'summary',
        title: '📝 Özet',
        key_points: [summaryText],
        practice_tasks: content.practice_tasks || []
      });
    }
    
    return sections;
  };

  const renderSection = (section) => {
    if (!section) return null;
    
    switch(section.type) {
      case 'theory':
        return <TheorySection section={section} />;
      case 'vocabulary':
        return <VocabularySection section={section} />;
      case 'example_sentences':
        return <ExampleSentencesSection section={section} />;
      case 'dialogue':
        return <DialogueSection section={section} />;
      case 'quiz':
        return <QuizSection section={section} />;
      case 'summary':
        return <SummarySection section={section} />;
      default:
        return (
          <div className="section unknown-section">
            <h3 className="section-title">{section.title || 'Bölüm'}</h3>
            <pre style={{ color: '#94a3b8', fontSize: 13, overflow: 'auto' }}>
              {JSON.stringify(section, null, 2)}
            </pre>
          </div>
        );
    }
  };

  // Navigasyon fonksiyonları
  const goToPreviousSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToNextSection = () => {
    if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToSection = (index) => {
    if (index >= 0 && index < sections.length) {
      setCurrentSectionIndex(index);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Önceki/Sonraki Ders
  const handlePrevLesson = () => {
    if (lesson && lesson.lesson_number > 1) {
      const prev = lesson.lesson_number - 1;
      fetchLesson(prev.toString());
    }
  };

  const handleNextLesson = () => {
    if (lesson) {
      const next = lesson.lesson_number + 1;
      fetchLesson(next.toString());
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

  const currentSection = sections[currentSectionIndex];
  const totalSections = sections.length;
  const progress = totalSections > 0 ? ((currentSectionIndex + 1) / totalSections) * 100 : 0;

  return (
    <div className="lesson-page" style={{ 
      minHeight: "100vh", 
      background: "#0f0f1a", 
      color: "#e2e8f0",
      fontFamily: "'Inter', system-ui, sans-serif"
    }}>
      {/* BACK BUTTON */}
      <div style={{ 
        maxWidth: 1200, 
        margin: "0 auto", 
        padding: "16px 24px 0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <button 
          onClick={onBack}
          style={{
            background: "#1e293b",
            border: "none",
            borderRadius: 8,
            padding: "8px 16px",
            color: "#94a3b8",
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "inherit"
          }}
        >
          ← Ana Sayfaya Dön
        </button>
        <span style={{ fontSize: 12, color: "#475569" }}>
          {lesson.level} Seviyesi
        </span>
      </div>

      {/* HEADER */}
      <header style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        borderBottom: "1px solid #1e293b",
        padding: "24px 0",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          position: "relative",
          zIndex: 1
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 8,
            flexWrap: "wrap"
          }}>
            <div style={{
              fontSize: 13,
              color: "#94a3b8",
              fontWeight: 600,
              background: "#0f0f1a",
              padding: "4px 12px",
              borderRadius: 6,
              border: "1px solid #1e293b"
            }}>
              Ders #{lesson.lesson_number}
            </div>
            <div style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "4px 12px",
              borderRadius: 6,
              color: "#fff",
              letterSpacing: 1,
              backgroundColor: getLevelColor(lesson.level)
            }}>
              {lesson.level}
            </div>
            {totalSections > 0 && (
              <div style={{
                fontSize: 12,
                color: "#64748b",
                background: "#0f0f1a",
                padding: "4px 12px",
                borderRadius: 6,
                border: "1px solid #1e293b"
              }}>
                {currentSectionIndex + 1} / {totalSections} Bölüm
              </div>
            )}
          </div>
          <h1 style={{
            fontSize: 28,
            fontWeight: 800,
            margin: "0 0 4px 0",
            lineHeight: 1.2,
            background: "linear-gradient(135deg, #f1f5f9 0%, #94a3b8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text"
          }}>
            {lesson.title}
          </h1>
          {currentSection && (
            <div style={{
              fontSize: 14,
              color: "#6366f1",
              fontWeight: 600
            }}>
              {currentSection.title || `Bölüm ${currentSectionIndex + 1}`}
            </div>
          )}
        </div>
      </header>

      {/* PROGRESS BAR */}
      {totalSections > 0 && (
        <div style={{
          height: 4,
          background: "#1e293b",
          position: "sticky",
          top: 0,
          zIndex: 20
        }}>
          <div style={{
            height: "100%",
            width: `${progress}%`,
            background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
            transition: "width 0.4s ease"
          }} />
        </div>
      )}

      {/* SECTION NAVIGATION - Mini */}
      {totalSections > 1 && (
        <div style={{
          background: "#1a1a2e",
          borderBottom: "1px solid #1e293b",
          padding: "8px 0",
          overflowX: "auto",
          position: "sticky",
          top: 4,
          zIndex: 15,
          backdropFilter: "blur(10px)",
          background: "rgba(26, 26, 46, 0.95)"
        }}>
          <div style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            gap: 6,
            flexWrap: "nowrap",
            justifyContent: "center"
          }}>
            {sections.map((section, index) => (
              <button
                key={index}
                onClick={() => goToSection(index)}
                style={{
                  padding: "4px 12px",
                  background: currentSectionIndex === index ? "#6366f1" : "transparent",
                  border: currentSectionIndex === index ? "1px solid #6366f1" : "1px solid #1e293b",
                  borderRadius: 6,
                  color: currentSectionIndex === index ? "#fff" : "#64748b",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                  fontFamily: "inherit"
                }}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CONTENT */}
      <main style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "24px 24px 16px"
      }}>
        {totalSections > 0 && currentSection ? (
          <div style={{
            animation: "fadeIn 0.3s ease-in"
          }}>
            {renderSection(currentSection)}
          </div>
        ) : (
          <div style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "#64748b"
          }}>
            <p style={{ fontSize: 16 }}>Bu ders için içerik bulunamadı.</p>
            <button 
              onClick={() => {
                console.log("Ders içeriği:", lesson?.content_json);
                alert("Konsola bakın (F12)");
              }}
              style={{
                marginTop: 16,
                background: "#1e293b",
                border: "none",
                borderRadius: 8,
                padding: "8px 16px",
                color: "#94a3b8",
                cursor: "pointer",
                fontFamily: "inherit"
              }}
            >
              📋 İçeriği Kontrol Et
            </button>
          </div>
        )}
      </main>

      {/* NAVIGATION BUTTONS - Previous / Next Section */}
      {totalSections > 0 && (
        <div style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px 24px"
        }}>
          <div style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            alignItems: "center",
            flexWrap: "wrap"
          }}>
            <button
              onClick={goToPreviousSection}
              disabled={currentSectionIndex === 0}
              style={{
                padding: "12px 24px",
                background: currentSectionIndex === 0 ? "#1a1a2e" : "#6366f1",
                border: currentSectionIndex === 0 ? "1px solid #1e293b" : "none",
                borderRadius: 10,
                color: currentSectionIndex === 0 ? "#475569" : "#fff",
                fontWeight: 700,
                fontSize: 14,
                cursor: currentSectionIndex === 0 ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                gap: 8,
                minWidth: 120,
                justifyContent: "center"
              }}
            >
              ← Önceki Bölüm
            </button>

            <div style={{
              display: "flex",
              gap: 6,
              alignItems: "center"
            }}>
              {sections.map((_, index) => (
                <div
                  key={index}
                  onClick={() => goToSection(index)}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: currentSectionIndex === index ? "#6366f1" : "#1e293b",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    border: currentSectionIndex === index ? "2px solid #6366f1" : "none"
                  }}
                />
              ))}
            </div>

            <button
              onClick={goToNextSection}
              disabled={currentSectionIndex === totalSections - 1}
              style={{
                padding: "12px 24px",
                background: currentSectionIndex === totalSections - 1 ? "#1a1a2e" : "#6366f1",
                border: currentSectionIndex === totalSections - 1 ? "1px solid #1e293b" : "none",
                borderRadius: 10,
                color: currentSectionIndex === totalSections - 1 ? "#475569" : "#fff",
                fontWeight: 700,
                fontSize: 14,
                cursor: currentSectionIndex === totalSections - 1 ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                gap: 8,
                minWidth: 120,
                justifyContent: "center"
              }}
            >
              Sonraki Bölüm →
            </button>
          </div>
        </div>
      )}

      {/* FOOTER - Previous / Next Lesson */}
      <footer style={{
        background: "#1a1a2e",
        borderTop: "1px solid #1e293b",
        padding: "16px 0"
      }}>
        <div style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap"
        }}>
          <button 
            onClick={handlePrevLesson}
            disabled={!lesson || lesson.lesson_number <= 1}
            style={{
              padding: "10px 20px",
              background: "#0f0f1a",
              border: "1px solid #1e293b",
              borderRadius: 8,
              color: "#94a3b8",
              fontWeight: 600,
              fontSize: 13,
              cursor: lesson && lesson.lesson_number > 1 ? "pointer" : "not-allowed",
              transition: "all 0.2s",
              fontFamily: "inherit",
              opacity: lesson && lesson.lesson_number > 1 ? 1 : 0.3
            }}
          >
            ← Önceki Ders
          </button>
          
          <button onClick={onBack} style={{
            padding: "10px 24px",
            background: "#6366f1",
            border: "none",
            borderRadius: 8,
            color: "#fff",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
            transition: "all 0.2s",
            fontFamily: "inherit"
          }}>
            🏠 Ana Sayfa
          </button>
          
          <button 
            onClick={handleNextLesson}
            style={{
              padding: "10px 20px",
              background: "#0f0f1a",
              border: "1px solid #1e293b",
              borderRadius: 8,
              color: "#94a3b8",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.2s",
              fontFamily: "inherit"
            }}
          >
            Sonraki Ders →
          </button>
        </div>
      </footer>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .section {
          background: #1a1a2e;
          border-radius: 16px;
          padding: 32px;
          border: 1px solid #1e293b;
          margin-bottom: 24px;
        }

        .section:last-child {
          margin-bottom: 0;
        }

        .section-title {
          font-size: 20px;
          font-weight: 700;
          margin: 0 0 20px 0;
          color: #f1f5f9;
          border-bottom: 2px solid #1e293b;
          padding-bottom: 12px;
        }

        .theory-content {
          font-size: 15px;
          line-height: 1.8;
          color: #cbd5e1;
        }

        .theory-heading {
          font-weight: 700;
          color: #f1f5f9;
          font-size: 16px;
          margin: 16px 0 8px 0;
        }

        .theory-text {
          margin: 8px 0;
        }

        .rule-box {
          background: #0f0f1a;
          border-left: 4px solid #6366f1;
          padding: 12px 16px;
          margin: 12px 0;
          border-radius: 0 8px 8px 0;
          font-weight: 600;
          color: #e2e8f0;
        }

        .warning-box {
          background: #1a0e0e;
          border-left: 4px solid #ef4444;
          padding: 12px 16px;
          margin: 12px 0;
          border-radius: 0 8px 8px 0;
          color: #fca5a5;
        }

        .example-box {
          background: #0e1a1a;
          border-left: 4px solid #10b981;
          padding: 12px 16px;
          margin: 12px 0;
          border-radius: 0 8px 8px 0;
          color: #6ee7b7;
          font-style: italic;
        }

        .key-rules, .common-mistakes {
          margin-top: 20px;
          padding: 16px;
          background: #0f0f1a;
          border-radius: 8px;
        }

        .key-rules h4 {
          color: #6366f1;
          margin: 0 0 8px 0;
          font-size: 14px;
        }

        .common-mistakes h4 {
          color: #ef4444;
          margin: 0 0 8px 0;
          font-size: 14px;
        }

        .key-rules ul, .common-mistakes ul {
          margin: 0;
          padding-left: 20px;
          color: #94a3b8;
          font-size: 14px;
        }

        .key-rules li, .common-mistakes li {
          margin: 4px 0;
        }

        .vocabulary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }

        .vocabulary-card {
          background: #0f0f1a;
          border-radius: 12px;
          padding: 16px;
          border: 1px solid #1e293b;
          transition: all 0.2s;
        }

        .vocabulary-card:hover {
          border-color: #334155;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        }

        .vocabulary-word {
          font-size: 18px;
          font-weight: 700;
          color: #f1f5f9;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .article-badge {
          font-size: 11px;
          font-weight: 600;
          color: #6366f1;
          background: #6366f122;
          padding: 2px 8px;
          border-radius: 4px;
        }

        .pos-badge {
          font-size: 10px;
          color: #64748b;
          background: #1e293b;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 500;
          text-transform: lowercase;
        }

        .vocabulary-meaning {
          color: #94a3b8;
          font-size: 14px;
          margin: 6px 0;
        }

        .vocabulary-example {
          font-size: 13px;
          color: #64748b;
          margin: 8px 0;
          padding: 8px;
          background: #0a0a14;
          border-radius: 6px;
        }

        .example-en {
          color: #e2e8f0;
        }

        .example-tr {
          color: #64748b;
          margin-left: 8px;
        }

        .vocabulary-category {
          margin-top: 8px;
        }

        .category-tag {
          font-size: 10px;
          color: #64748b;
          background: #1e293b;
          padding: 2px 10px;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .examples-grid {
          display: grid;
          gap: 12px;
        }

        .example-card {
          background: #0f0f1a;
          border-radius: 10px;
          padding: 16px;
          border: 1px solid #1e293b;
          transition: all 0.2s;
        }

        .example-card:hover {
          border-color: #334155;
        }

        .dialogue-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .dialogue-line {
          padding: 12px 16px;
          border-radius: 10px;
          transition: all 0.2s;
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
          display: block;
        }

        .dialogue-grammar {
          font-size: 12px;
          color: #6366f1;
          background: #6366f122;
          padding: 2px 10px;
          border-radius: 4px;
          display: inline-block;
          margin-top: 4px;
        }

        .roleplay-section {
          margin-top: 20px;
          padding: 16px;
          background: #0f0f1a;
          border-radius: 8px;
        }

        .roleplay-section h4 {
          color: #10b981;
          margin: 0 0 8px 0;
          font-size: 14px;
        }

        .roleplay-section ul {
          margin: 0;
          padding-left: 20px;
          color: #94a3b8;
          font-size: 14px;
        }

        .roleplay-section li {
          margin: 4px 0;
        }

        .quiz-question {
          margin-bottom: 24px;
          padding: 16px;
          background: #0f0f1a;
          border-radius: 10px;
          border: 1px solid #1e293b;
        }

        .question-text {
          font-size: 15px;
          font-weight: 500;
          color: #f1f5f9;
          margin: 0 0 12px 0;
        }

        .question-number {
          color: #6366f1;
          margin-right: 8px;
        }

        .options-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .option-label {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          background: #0a0a14;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .option-label:hover {
          background: #141425;
        }

        .option-label input[type="radio"] {
          accent-color: #6366f1;
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .option-label span {
          color: #cbd5e1;
        }

        .fill-blank-input {
          width: 100%;
          max-width: 400px;
          padding: 10px 14px;
          background: #0a0a14;
          border: 1px solid #1e293b;
          border-radius: 8px;
          color: #e2e8f0;
          font-size: 14px;
          font-family: inherit;
          transition: border-color 0.2s;
        }

        .fill-blank-input:focus {
          outline: none;
          border-color: #6366f1;
        }

        .feedback {
          margin-top: 10px;
          padding: 10px 14px;
          border-radius: 6px;
          font-size: 14px;
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

        .explanation {
          color: #94a3b8;
          font-weight: 400;
        }

        .check-answers-btn, .reset-quiz-btn {
          padding: 12px 24px;
          border: none;
          border-radius: 10px;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
          margin-top: 16px;
        }

        .check-answers-btn {
          background: #6366f1;
          color: #fff;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .check-answers-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
        }

        .reset-quiz-btn {
          background: #1e293b;
          color: #94a3b8;
        }

        .reset-quiz-btn:hover {
          background: #334155;
          color: #e2e8f0;
        }

        .quiz-results {
          margin-top: 20px;
          padding: 20px;
          background: #0f0f1a;
          border-radius: 10px;
          border: 1px solid #1e293b;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }

        .score-box {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }

        .score-number {
          font-size: 36px;
          font-weight: 800;
          color: #10b981;
        }

        .score-total {
          font-size: 20px;
          color: #64748b;
        }

        .score-label {
          font-size: 14px;
          color: #94a3b8;
          margin-left: 8px;
        }

        .summary-content {
          display: grid;
          gap: 20px;
        }

        .summary-points, .practice-tasks, .next-lesson-preview {
          padding: 16px;
          background: #0f0f1a;
          border-radius: 8px;
        }

        .summary-points h4 {
          color: #6366f1;
          margin: 0 0 8px 0;
          font-size: 14px;
        }

        .practice-tasks h4 {
          color: #10b981;
          margin: 0 0 8px 0;
          font-size: 14px;
        }

        .next-lesson-preview h4 {
          color: #f59e0b;
          margin: 0 0 8px 0;
          font-size: 14px;
        }

        .summary-points ul, .practice-tasks ul {
          margin: 0;
          padding-left: 20px;
          color: #94a3b8;
          font-size: 14px;
        }

        .summary-points li, .practice-tasks li {
          margin: 4px 0;
        }

        .next-lesson-preview p {
          margin: 0;
          color: #94a3b8;
          font-size: 14px;
        }

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
          text-decoration: none;
          border-radius: 10px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
          font-size: 14px;
        }

        .back-home-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .unknown-section pre {
          background: #0f0f1a;
          padding: 16px;
          border-radius: 8px;
          overflow: auto;
          max-height: 400px;
          font-size: 12px;
        }

        @media (max-width: 768px) {
          .section {
            padding: 20px;
          }
          .vocabulary-grid {
            grid-template-columns: 1fr;
          }
          .lesson-title {
            font-size: 22px;
          }
          .quiz-results {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          .lesson-header-content h1 {
            font-size: 22px;
          }
        }
      `}</style>
    </div>
  );
}