// admin/LessonManagement.jsx
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../config.js";
import { 
  styles, colors, PageHeader, Tabs, Card, Message, 
  Input, TextArea, JsonDisplay, SearchInput, Badge 
} from "./adminStyles.jsx";

// ============================
// LESSON STEP RENDERER BİLEŞENİ
// ============================
function LessonStepRenderer({ step, stepIndex }) {
  const [selectedOptions, setSelectedOptions] = useState({});
  const [matchAnswers, setMatchAnswers] = useState({});
  const [dragItems, setDragItems] = useState([]);
  const [showFeedback, setShowFeedback] = useState({});
  const [isCorrect, setIsCorrect] = useState({});

  const handleOptionSelect = (questionIndex, optionIndex) => {
    setSelectedOptions(prev => ({ ...prev, [questionIndex]: optionIndex }));
    setShowFeedback(prev => ({ ...prev, [questionIndex]: true }));
    
    const question = step.questions[questionIndex];
    const correct = optionIndex === question.correct;
    setIsCorrect(prev => ({ ...prev, [questionIndex]: correct }));
  };

  const handleMatchSelect = (pairIndex, value) => {
    setMatchAnswers(prev => ({ ...prev, [pairIndex]: value }));
  };

  const checkMatching = () => {
    let allCorrect = true;
    step.pairs.forEach((pair, index) => {
      if (matchAnswers[index] !== pair.right) {
        allCorrect = false;
      }
    });
    setIsCorrect({ matching: allCorrect });
    setShowFeedback({ matching: true });
  };

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetIndex) => {
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'));
    const newItems = [...dragItems];
    const [removed] = newItems.splice(sourceIndex, 1);
    newItems.splice(targetIndex, 0, removed);
    setDragItems(newItems);
  };

  const checkDragDrop = () => {
    const isCorrectOrder = dragItems.every((item, index) => 
      item === step.words[step.correct_order[index]]
    );
    setIsCorrect({ drag_drop: isCorrectOrder });
    setShowFeedback({ drag_drop: true });
  };

  // Render Info tipi
  if (step.type === 'info') {
    return (
      <div style={{ 
        background: colors.surfaceDark, 
        borderRadius: 12, 
        padding: 20, 
        marginBottom: 16 
      }}>
        <h3 style={{ color: colors.text, marginBottom: 12 }}>{step.title}</h3>
        {step.content.explanation && (
          <p style={{ color: colors.textSecondary, lineHeight: 1.6 }}>
            {step.content.explanation}
          </p>
        )}
        {step.content.rule && (
          <div style={{ 
            background: '#2a1f3d', 
            padding: 12, 
            borderRadius: 8, 
            margin: '12px 0',
            borderLeft: `3px solid ${colors.primary}`
          }}>
            <span style={{ color: colors.primary }}>{step.content.rule}</span>
          </div>
        )}
        {step.content.tip && (
          <div style={{ 
            background: '#1a2a3d', 
            padding: 12, 
            borderRadius: 8, 
            margin: '8px 0',
            borderLeft: `3px solid #f59e0b`
          }}>
            <span style={{ color: '#f59e0b' }}>{step.content.tip}</span>
          </div>
        )}
        {step.content.items && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
            {step.content.items.map((item, idx) => (
              <div key={idx} style={{ 
                background: colors.surface, 
                padding: 8, 
                borderRadius: 6,
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>{item.meaning}</span>
                <span style={{ color: colors.primary, fontWeight: 'bold' }}>{item.pronoun || item.key}</span>
              </div>
            ))}
          </div>
        )}
        {step.content.examples && (
          <div style={{ marginTop: 12 }}>
            {step.content.examples.map((example, idx) => (
              <div key={idx} style={{ 
                background: colors.surface, 
                padding: 10, 
                borderRadius: 6, 
                marginBottom: 6 
              }}>
                <div style={{ color: '#4ade80' }}>✅ {example.correct}</div>
                {example.wrong && <div style={{ color: '#f87171' }}>❌ {example.wrong}</div>}
                {example.note && <div style={{ color: colors.textSecondary, fontSize: 12 }}>📌 {example.note}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Render Multiple Choice tipi
  if (step.type === 'multiple_choice') {
    return (
      <div style={{ 
        background: colors.surfaceDark, 
        borderRadius: 12, 
        padding: 20, 
        marginBottom: 16 
      }}>
        <h3 style={{ color: colors.text, marginBottom: 8 }}>{step.title}</h3>
        {step.rule && (
          <div style={{ 
            background: '#2a1f3d', 
            padding: 10, 
            borderRadius: 6, 
            marginBottom: 12,
            borderLeft: `3px solid ${colors.primary}`
          }}>
            <span style={{ color: colors.primary, fontSize: 14 }}>{step.rule}</span>
          </div>
        )}
        <p style={{ color: colors.textSecondary, marginBottom: 16 }}>{step.instructions}</p>
        
        {step.questions.map((q, qIdx) => (
          <div key={qIdx} style={{ 
            background: colors.surface, 
            padding: 16, 
            borderRadius: 8, 
            marginBottom: 12 
          }}>
            <p style={{ color: colors.text, marginBottom: 12 }}>{q.question}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {q.options.map((opt, oIdx) => (
                <button
                  key={oIdx}
                  onClick={() => handleOptionSelect(qIdx, oIdx)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 8,
                    border: `2px solid ${
                      selectedOptions[qIdx] === oIdx 
                        ? showFeedback[qIdx] 
                          ? isCorrect[qIdx] 
                            ? colors.success 
                            : colors.error
                        : colors.primary
                      : colors.border
                    }`,
                    background: selectedOptions[qIdx] === oIdx ? colors.surfaceLight : 'transparent',
                    color: colors.text,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                >
                  {String.fromCharCode(65 + oIdx)}. {opt}
                </button>
              ))}
            </div>
            {showFeedback[qIdx] && (
              <div style={{ 
                marginTop: 12, 
                padding: 10, 
                borderRadius: 6,
                background: isCorrect[qIdx] ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                borderLeft: `3px solid ${isCorrect[qIdx] ? colors.success : colors.error}`
              }}>
                <span style={{ color: isCorrect[qIdx] ? colors.success : colors.error }}>
                  {isCorrect[qIdx] ? q.feedback_correct : q.feedback_wrong}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Render Fill Blank tipi
  if (step.type === 'fill_blank') {
    return (
      <div style={{ 
        background: colors.surfaceDark, 
        borderRadius: 12, 
        padding: 20, 
        marginBottom: 16 
      }}>
        <h3 style={{ color: colors.text, marginBottom: 8 }}>{step.title}</h3>
        {step.rule && (
          <div style={{ 
            background: '#2a1f3d', 
            padding: 10, 
            borderRadius: 6, 
            marginBottom: 12,
            borderLeft: `3px solid ${colors.primary}`
          }}>
            <span style={{ color: colors.primary, fontSize: 14 }}>{step.rule}</span>
          </div>
        )}
        <p style={{ color: colors.textSecondary, marginBottom: 16 }}>{step.instructions}</p>
        
        {step.questions.map((q, qIdx) => (
          <div key={qIdx} style={{ 
            background: colors.surface, 
            padding: 16, 
            borderRadius: 8, 
            marginBottom: 12 
          }}>
            <p style={{ color: colors.text, marginBottom: 12 }}>{q.question}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {q.options.map((opt, oIdx) => (
                <button
                  key={oIdx}
                  onClick={() => handleOptionSelect(qIdx, oIdx)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 20,
                    border: `2px solid ${
                      selectedOptions[qIdx] === oIdx 
                        ? showFeedback[qIdx] 
                          ? isCorrect[qIdx] 
                            ? colors.success 
                            : colors.error
                        : colors.primary
                      : colors.border
                    }`,
                    background: selectedOptions[qIdx] === oIdx ? colors.surfaceLight : 'transparent',
                    color: colors.text,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
            {showFeedback[qIdx] && (
              <div style={{ 
                marginTop: 12, 
                padding: 10, 
                borderRadius: 6,
                background: isCorrect[qIdx] ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                borderLeft: `3px solid ${isCorrect[qIdx] ? colors.success : colors.error}`
              }}>
                <span style={{ color: isCorrect[qIdx] ? colors.success : colors.error }}>
                  {isCorrect[qIdx] ? q.feedback_correct : q.feedback_wrong}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Render Matching tipi
  if (step.type === 'matching') {
    // Başlangıçta dragItems'i pairs'ten oluştur
    if (dragItems.length === 0) {
      const shuffled = [...step.pairs].sort(() => Math.random() - 0.5);
      setDragItems(shuffled.map(p => p.left));
    }

    return (
      <div style={{ 
        background: colors.surfaceDark, 
        borderRadius: 12, 
        padding: 20, 
        marginBottom: 16 
      }}>
        <h3 style={{ color: colors.text, marginBottom: 8 }}>{step.title}</h3>
        <p style={{ color: colors.textSecondary, marginBottom: 16 }}>{step.instructions}</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Sol taraf - Sürüklenebilir öğeler */}
          <div>
            <h4 style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 8 }}>📌 Eşleştir</h4>
            {dragItems.map((item, idx) => (
              <div
                key={idx}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                style={{
                  padding: '10px 16px',
                  background: colors.surface,
                  borderRadius: 6,
                  marginBottom: 6,
                  cursor: 'grab',
                  border: `1px solid ${colors.border}`
                }}
              >
                {item}
              </div>
            ))}
          </div>
          
          {/* Sağ taraf - Hedef alanlar */}
          <div>
            <h4 style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 8 }}>🎯 Anlamları</h4>
            {step.pairs.map((pair, idx) => (
              <div
                key={idx}
                onDragOver={handleDragOver}
                onDrop={(e) => {
                  e.preventDefault();
                  const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'));
                  const newItems = [...dragItems];
                  const [removed] = newItems.splice(sourceIndex, 1);
                  // Eşleştirme kontrolü
                  if (removed === pair.left) {
                    setMatchAnswers(prev => ({ ...prev, [idx]: pair.right }));
                    // Doğru eşleştiğinde öğeyi kaldır
                    setDragItems(newItems);
                  }
                }}
                style={{
                  padding: '10px 16px',
                  background: matchAnswers[idx] ? 'rgba(74, 222, 128, 0.1)' : colors.surface,
                  borderRadius: 6,
                  marginBottom: 6,
                  border: `2px solid ${matchAnswers[idx] ? colors.success : colors.border}`,
                  minHeight: 45,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {matchAnswers[idx] || '📥 Buraya bırak'}
              </div>
            ))}
          </div>
        </div>
        
        {showFeedback.matching && (
          <div style={{ 
            marginTop: 16, 
            padding: 12, 
            borderRadius: 8,
            background: isCorrect.matching ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)',
            borderLeft: `3px solid ${isCorrect.matching ? colors.success : colors.error}`
          }}>
            <span style={{ color: isCorrect.matching ? colors.success : colors.error }}>
              {isCorrect.matching ? step.feedback_correct : step.feedback_wrong}
            </span>
          </div>
        )}
        
        {Object.keys(matchAnswers).length === step.pairs.length && !showFeedback.matching && (
          <button
            onClick={checkMatching}
            style={{
              marginTop: 16,
              padding: '10px 24px',
              borderRadius: 8,
              border: 'none',
              background: colors.primary,
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
              width: '100%'
            }}
          >
            ✅ Kontrol Et
          </button>
        )}
      </div>
    );
  }

  // Render Drag & Drop tipi
  if (step.type === 'drag_drop') {
    if (dragItems.length === 0) {
      setDragItems(step.words);
    }

    return (
      <div style={{ 
        background: colors.surfaceDark, 
        borderRadius: 12, 
        padding: 20, 
        marginBottom: 16 
      }}>
        <h3 style={{ color: colors.text, marginBottom: 8 }}>{step.title}</h3>
        <p style={{ color: colors.textSecondary, marginBottom: 16 }}>{step.instructions}</p>
        
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 8, 
          padding: 16,
          background: colors.surface,
          borderRadius: 8,
          minHeight: 60
        }}>
          {dragItems.map((word, idx) => (
            <div
              key={idx}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              style={{
                padding: '10px 16px',
                background: colors.surfaceLight,
                borderRadius: 6,
                cursor: 'grab',
                border: `1px solid ${colors.border}`,
                userSelect: 'none'
              }}
            >
              {word}
            </div>
          ))}
        </div>
        
        <div style={{ 
          marginTop: 16,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          padding: 16,
          background: '#1a1a2e',
          borderRadius: 8,
          minHeight: 60,
          border: `2px dashed ${colors.border}`
        }}>
          {dragItems.map((word, idx) => (
            <div
              key={idx}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, idx)}
              style={{
                padding: '10px 16px',
                background: colors.surface,
                borderRadius: 6,
                border: `1px solid ${colors.border}`,
                minWidth: 50,
                textAlign: 'center'
              }}
            >
              {word}
            </div>
          ))}
        </div>
        
        {showFeedback.drag_drop && (
          <div style={{ 
            marginTop: 16, 
            padding: 12, 
            borderRadius: 8,
            background: isCorrect.drag_drop ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)',
            borderLeft: `3px solid ${isCorrect.drag_drop ? colors.success : colors.error}`
          }}>
            <span style={{ color: isCorrect.drag_drop ? colors.success : colors.error }}>
              {isCorrect.drag_drop ? step.feedback_correct : step.feedback_wrong}
            </span>
            {!isCorrect.drag_drop && (
              <div style={{ marginTop: 8, color: colors.textSecondary, fontSize: 13 }}>
                💡 İpucu: Doğru sıralama: {step.words.join(' ')}
              </div>
            )}
          </div>
        )}
        
        {!showFeedback.drag_drop && (
          <button
            onClick={checkDragDrop}
            style={{
              marginTop: 16,
              padding: '10px 24px',
              borderRadius: 8,
              border: 'none',
              background: colors.primary,
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
              width: '100%'
            }}
          >
            ✅ Kontrol Et
          </button>
        )}
      </div>
    );
  }

  // Render Dialogue tipi
  if (step.type === 'dialogue') {
    return (
      <div style={{ 
        background: colors.surfaceDark, 
        borderRadius: 12, 
        padding: 20, 
        marginBottom: 16 
      }}>
        <h3 style={{ color: colors.text, marginBottom: 8 }}>{step.title}</h3>
        <p style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 12 }}>
          💬 {step.content.context}
        </p>
        
        <div style={{ 
          background: colors.surface, 
          borderRadius: 8, 
          padding: 16,
          marginBottom: 16
        }}>
          {step.content.scenes.map((scene, idx) => (
            <div key={idx} style={{ 
              display: 'flex', 
              flexDirection: 'column',
              marginBottom: idx < step.content.scenes.length - 1 ? 12 : 0,
              padding: 8,
              borderRadius: 6,
              background: idx % 2 === 0 ? 'rgba(99, 102, 241, 0.05)' : 'transparent'
            }}>
              <span style={{ color: colors.primary, fontWeight: 600, fontSize: 13 }}>
                {scene.speaker}:
              </span>
              <span style={{ color: colors.text, fontSize: 15 }}>
                {scene.text}
              </span>
              <span style={{ color: colors.textSecondary, fontSize: 12 }}>
                {scene.translation}
              </span>
            </div>
          ))}
        </div>
        
        {step.practice && (
          <div style={{ marginTop: 12 }}>
            <p style={{ color: colors.textSecondary, marginBottom: 12 }}>{step.practice.instructions}</p>
            {step.practice.questions.map((q, qIdx) => (
              <div key={qIdx} style={{ 
                background: colors.surface, 
                padding: 16, 
                borderRadius: 8, 
                marginBottom: 12 
              }}>
                <p style={{ color: colors.text, marginBottom: 12 }}>{q.question}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {q.options.map((opt, oIdx) => (
                    <button
                      key={oIdx}
                      onClick={() => handleOptionSelect(`practice_${qIdx}`, oIdx)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 20,
                        border: `2px solid ${
                          selectedOptions[`practice_${qIdx}`] === oIdx 
                            ? showFeedback[`practice_${qIdx}`] 
                              ? isCorrect[`practice_${qIdx}`] 
                                ? colors.success 
                                : colors.error
                            : colors.primary
                          : colors.border
                        }`,
                        background: selectedOptions[`practice_${qIdx}`] === oIdx ? colors.surfaceLight : 'transparent',
                        color: colors.text,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {showFeedback[`practice_${qIdx}`] && (
                  <div style={{ 
                    marginTop: 12, 
                    padding: 10, 
                    borderRadius: 6,
                    background: isCorrect[`practice_${qIdx}`] ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                    borderLeft: `3px solid ${isCorrect[`practice_${qIdx}`] ? colors.success : colors.error}`
                  }}>
                    <span style={{ color: isCorrect[`practice_${qIdx}`] ? colors.success : colors.error }}>
                      {isCorrect[`practice_${qIdx}`] ? q.feedback_correct : q.feedback_wrong}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Render Summary tipi
  if (step.type === 'summary') {
    return (
      <div style={{ 
        background: colors.surfaceDark, 
        borderRadius: 12, 
        padding: 20, 
        marginBottom: 16,
        border: `2px solid ${colors.primary}`
      }}>
        <h3 style={{ color: colors.text, marginBottom: 12 }}>{step.title}</h3>
        
        {step.content.key_points && (
          <div style={{ marginBottom: 12 }}>
            <h4 style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 8 }}>📌 Önemli Noktalar</h4>
            <ul style={{ color: colors.textSecondary, lineHeight: 1.8, paddingLeft: 20 }}>
              {step.content.key_points.map((point, idx) => (
                <li key={idx}>{point}</li>
              ))}
            </ul>
          </div>
        )}
        
        {step.content.practice_tasks && (
          <div>
            <h4 style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 8 }}>✏️ Pratik Görevleri</h4>
            <ul style={{ color: colors.textSecondary, lineHeight: 1.8, paddingLeft: 20 }}>
              {step.content.practice_tasks.map((task, idx) => (
                <li key={idx}>{task}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // Bilinmeyen tip
  return (
    <div style={{ 
      background: '#2a1a1a', 
      borderRadius: 12, 
      padding: 20, 
      marginBottom: 16,
      border: `1px solid ${colors.error}`
    }}>
      <h3 style={{ color: colors.error }}>⚠️ Bilinmeyen Adım Tipi: {step.type}</h3>
      <p style={{ color: colors.textSecondary }}>Bu adım tipi henüz desteklenmiyor.</p>
    </div>
  );
}

// ============================
// ANA BİLEŞEN
// ============================
const NEW_JSON_EXAMPLE = `{
  "steps": [
    {
      "id": "step_1",
      "type": "info",
      "title": "To Be Fiili - Olumsuz (Negative)",
      "content": {
        "explanation": "İngilizcede 'to be' fiilini (am/is/are) olumsuz yapmak için fiilden hemen sonra 'not' kelimesini ekleriz.",
        "rule": "📌 KURAL: Özne + am/is/are + NOT + tamlayıcı",
        "examples": [
          {
            "correct": "I am not a doctor. (I'm not a doctor.)",
            "wrong": "I not am a doctor.",
            "note": "Kişi tanıtırken"
          },
          {
            "correct": "She isn't from Turkey.",
            "wrong": "She not is from Turkey.",
            "note": "Üçüncü tekil şahıs"
          }
        ]
      }
    },
    {
      "id": "step_2",
      "type": "multiple_choice",
      "title": "Pratik: Olumsuz Cümleler",
      "rule": "📌 KURAL: Özne + am/is/are + NOT + tamlayıcı",
      "instructions": "Aşağıdaki cümlelerde doğru olumsuz formu seçin:",
      "questions": [
        {
          "question": "I ___ a teacher.",
          "options": ["am not", "is not", "are not", "not am"],
          "correct": 0,
          "feedback_correct": "✅ Doğru! 'I am not a teacher.'",
          "feedback_wrong": "❌ İpucu: 'I' ile 'am not' kullanılır."
        },
        {
          "question": "She ___ from England.",
          "options": ["am not", "isn't", "aren't", "not is"],
          "correct": 1,
          "feedback_correct": "✅ Doğru! 'She isn't from England.'",
          "feedback_wrong": "❌ İpucu: 'She' ile 'isn't' kullanılır."
        }
      ]
    },
    {
      "id": "step_3",
      "type": "fill_blank",
      "title": "Boşluk Doldurma",
      "rule": "📌 KURAL: I → am not, He/She/It → isn't, You/We/They → aren't",
      "instructions": "Doğru olumsuz formu seçin:",
      "questions": [
        {
          "question": "I ___ (am not / isn't / aren't) a student.",
          "options": ["am not", "isn't", "aren't"],
          "correct": 0,
          "feedback_correct": "✅ Doğru! 'I am not a student.'",
          "feedback_wrong": "❌ İpucu: 'I' ile 'am not' kullanılır."
        }
      ]
    },
    {
      "id": "step_4",
      "type": "matching",
      "title": "Eşleştirme: Olumlu ve Olumsuz Formlar",
      "instructions": "Olumlu formları doğru olumsuz formlarıyla eşleştirin:",
      "pairs": [
        {"left": "I am", "right": "I am not"},
        {"left": "He is", "right": "He isn't"},
        {"left": "She is", "right": "She isn't"},
        {"left": "We are", "right": "We aren't"}
      ],
      "feedback_correct": "🎉 Harika! Tüm eşleştirmeler doğru!",
      "feedback_wrong": "😅 Bazı eşleştirmeler yanlış."
    },
    {
      "id": "step_5",
      "type": "drag_drop",
      "title": "Sürükle-Bırak: Cümle Kurma",
      "instructions": "Kelimeleri doğru sıraya dizin:",
      "sentence": "I am not a student.",
      "words": ["I", "am", "not", "a", "student", "."],
      "correct_order": [0, 1, 2, 3, 4, 5],
      "feedback_correct": "✅ Mükemmel!",
      "feedback_wrong": "❌ Sıralama yanlış."
    },
    {
      "id": "step_6",
      "type": "dialogue",
      "title": "Diyalog",
      "content": {
        "context": "Ali ve Emma meslekleri hakkında konuşuyorlar.",
        "scenes": [
          {"speaker": "Ali", "text": "Are you a doctor?", "translation": "Sen doktor musun?"},
          {"speaker": "Emma", "text": "No, I am not a doctor.", "translation": "Hayır, ben doktor değilim."}
        ]
      },
      "practice": {
        "instructions": "Diyaloga göre doğru cevabı seçin:",
        "questions": [
          {
            "question": "Emma: 'No, I ___ a doctor.'",
            "options": ["am not", "isn't", "aren't"],
            "correct": 0,
            "feedback_correct": "✅ Doğru! 'I am not a doctor.'",
            "feedback_wrong": "❌ İpucu: 'I' ile 'am not' kullanılır."
          }
        ]
      }
    },
    {
      "id": "step_7",
      "type": "summary",
      "title": "🎉 Ders Özeti",
      "content": {
        "key_points": [
          "Olumsuz cümleler: Özne + am/is/are + NOT + tamlayıcı",
          "Kısaltmalar: I'm not, He isn't, She isn't, You aren't, We aren't, They aren't"
        ],
        "practice_tasks": [
          "3 olumsuz cümle yazın (I am not ...)",
          "Bir arkadaşınız hakkında 3 olumsuz cümle yazın"
        ]
      }
    }
  ],
  "metadata": {
    "level": "A1",
    "title": "To Be Fiili - Olumsuz Cümleler",
    "duration": 45,
    "lesson_number": 1,
    "learning_objectives": [
      "'To be' fiilini olumsuz yapmayı öğrenmek",
      "'not' kelimesinin doğru yerini kavramak"
    ]
  }
}`;

// Prompt Template
const PROMPT_TEMPLATE = `Aşağıdaki JSON formatında sana verdiğim konularda bir ders içeriği oluştur.

JSON Formatı (DESTEKLENEN TİPLER: info, multiple_choice, fill_blank, matching, drag_drop, dialogue, summary):

{
  "steps": [
    {
      "id": "step_1",
      "type": "info",
      "title": "Başlık",
      "content": {
        "explanation": "Açıklama metni",
        "rule": "📌 KURAL: Kural metni",
        "tip": "💡 İpucu metni",
        "examples": [
          {
            "correct": "Doğru örnek cümle",
            "wrong": "Yanlış örnek cümle",
            "note": "Açıklama notu"
          }
        ]
      }
    },
    {
      "id": "step_2",
      "type": "multiple_choice",
      "title": "Test Başlığı",
      "rule": "📌 KURAL: Kural metni",
      "instructions": "Aşağıdaki cümlede doğru seçeneği işaretleyin:",
      "questions": [
        {
          "question": "Soru metni",
          "options": ["A seçeneği", "B seçeneği", "C seçeneği", "D seçeneği"],
          "correct": 0,
          "feedback_correct": "✅ Doğru! Açıklama",
          "feedback_wrong": "❌ Yanlış! İpucu"
        }
      ]
    },
    {
      "id": "step_3",
      "type": "fill_blank",
      "title": "Boşluk Doldurma",
      "rule": "📌 KURAL: Kural metni",
      "instructions": "Boşluğa uygun kelimeyi seçin:",
      "questions": [
        {
          "question": "I ___ a student.",
          "options": ["am", "is", "are"],
          "correct": 0,
          "feedback_correct": "✅ Doğru! Açıklama",
          "feedback_wrong": "❌ Yanlış! İpucu"
        }
      ]
    },
    {
      "id": "step_4",
      "type": "matching",
      "title": "Eşleştirme",
      "instructions": "Sol taraftaki kelimeleri sağ taraftaki anlamlarıyla eşleştirin:",
      "pairs": [
        {"left": "I", "right": "ben"},
        {"left": "you", "right": "sen"},
        {"left": "he", "right": "o"}
      ],
      "feedback_correct": "🎉 Harika! Tüm eşleştirmeler doğru!",
      "feedback_wrong": "😅 Bazı eşleştirmeler yanlış. Tekrar dene!"
    },
    {
      "id": "step_5",
      "type": "drag_drop",
      "title": "Sürükle-Bırak",
      "instructions": "Kelimeleri doğru sıraya dizerek cümle oluşturun:",
      "sentence": "I am a teacher.",
      "words": ["I", "am", "a", "teacher", "."],
      "correct_order": [0, 1, 2, 3, 4],
      "feedback_correct": "✅ Mükemmel! Doğru sıralama!",
      "feedback_wrong": "❌ Sıralama yanlış. Tekrar deneyin!"
    },
    {
      "id": "step_6",
      "type": "dialogue",
      "title": "Diyalog",
      "content": {
        "context": "Diyalog bağlamı (kim, nerede, ne hakkında konuşuyor)",
        "scenes": [
          {"speaker": "Ali", "text": "Hello! I am Ali.", "translation": "Merhaba! Ben Ali."},
          {"speaker": "Emma", "text": "Hi Ali! I am Emma.", "translation": "Merhaba Ali! Ben Emma."}
        ]
      },
      "practice": {
        "instructions": "Diyaloga göre boşluğu doldurun:",
        "questions": [
          {
            "question": "Ali: Hello! I ___ Ali.",
            "options": ["am", "is", "are"],
            "correct": 0,
            "feedback_correct": "✅ Doğru! 'I am Ali'",
            "feedback_wrong": "❌ İpucu: 'I' ile 'am' kullanılır."
          }
        ]
      }
    },
    {
      "id": "step_7",
      "type": "summary",
      "title": "🎉 Ders Özeti",
      "content": {
        "key_points": [
          "Önemli nokta 1",
          "Önemli nokta 2",
          "Önemli nokta 3"
        ],
        "practice_tasks": [
          "Pratik görevi 1",
          "Pratik görevi 2"
        ]
      }
    }
  ],
  "metadata": {
    "level": "A1",
    "title": "Ders Başlığı",
    "duration": 45,
    "lesson_number": 1,
    "learning_objectives": [
      "Öğrenim hedefi 1",
      "Öğrenim hedefi 2"
    ]
  }
}

KONU: [BURAYA KONUYU YAZIN]

KURALLAR:
1. Her step için benzersiz id kullan (step_1, step_2, ...)
2. type alanları SADECE: info, multiple_choice, fill_blank, matching, drag_drop, dialogue, summary
3. multiple_choice: 4-5 seçenek, correct index 0'dan başlar
4. fill_blank: 3-4 seçenek, correct index 0'dan başlar
5. matching: pairs array'inde left/right eşleştirmeleri
6. drag_drop: words array'i ve correct_order array'i (index'ler 0'dan başlar)
7. dialogue: scenes array'i (speaker, text, translation) + practice questions
8. summary: key_points ve practice_tasks array'leri
9. Tüm metinler Türkçe açıklamalar içermeli
10. Öğrenici seviyesine uygun kelimeler kullan (A1/A2/B1/B2)
11. Her bölümde emojiler kullan (📚, ✏️, 🎯, 💡, ✅, ❌, 🎉)
12. JSON geçerli olmalı (son virgül yok, tüm tırnaklar kapalı)
13. metadata kısmını mutlaka doldur

Bu formata TAM OLARAK uygun bir ders içeriği hazırla.`;

export default function LessonManagement({ onBack }) {
  const [activeTab, setActiveTab] = useState("add");

  const tabs = [
    { id: "add", label: "Ders Ekle", icon: "➕" },
    { id: "edit", label: "Ders Düzenle", icon: "📖" },
  ];

  return (
    <div style={styles.container}>
      <PageHeader 
        title="📚 Ders Yönetimi"
        subtitle="Ders ekle, düzenle veya sil"
        onBack={onBack}
      />

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "add" ? <LessonAdder /> : <LessonEditor />}
    </div>
  );
}

// ============================
// DERS EKLEME BİLEŞENİ
// ============================
function LessonAdder() {
  const [lessonNumber, setLessonNumber] = useState("");
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState("A1");
  const [jsonInput, setJsonInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showExample, setShowExample] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [previewStep, setPreviewStep] = useState(null);

  const handleAddLesson = async () => {
    if (!lessonNumber || !title) {
      setMessage({ type: "error", text: "Ders numarası ve başlık zorunludur!" });
      return;
    }

    let contentJson = {};
    try {
      if (jsonInput.trim()) {
        contentJson = JSON.parse(jsonInput.trim());
      } else {
        contentJson = { steps: [] };
      }
    } catch (e) {
      setMessage({ type: "error", text: "⚠️ Geçersiz JSON formatı!" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { data: existing, error: checkError } = await supabase
        .from("en_lessons")
        .select("id, lesson_number")
        .eq("level", level)
        .eq("lesson_number", parseInt(lessonNumber))
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existing) {
        setMessage({ 
          type: "error", 
          text: `⚠️ Bu seviyede (${level}) ${lessonNumber}. ders zaten mevcut!` 
        });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("en_lessons")
        .insert({
          lesson_number: parseInt(lessonNumber),
          title: title.trim(),
          level: level,
          content_json: contentJson
        })
        .select()
        .single();

      if (error) throw error;

      setMessage({ 
        type: "success", 
        text: `✅ ${level} seviyesi ${lessonNumber}. ders başarıyla eklendi!` 
      });

      setLessonNumber("");
      setTitle("");
      setJsonInput("");
      
    } catch (error) {
      setMessage({ type: "error", text: "Ders eklenemedi: " + error.message });
    } finally {
      setLoading(false);
    }
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(PROMPT_TEMPLATE);
    setMessage({ type: "success", text: "✅ Prompt kopyalandı!" });
    setTimeout(() => setMessage(null), 2000);
  };

  const copyNewJsonExample = () => {
    navigator.clipboard.writeText(NEW_JSON_EXAMPLE);
    setMessage({ type: "success", text: "✅ Örnek JSON kopyalandı!" });
    setTimeout(() => setMessage(null), 2000);
  };

  // JSON'u parse et ve preview göster
  const handlePreview = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (parsed.steps && parsed.steps.length > 0) {
        setPreviewStep(parsed.steps[0]);
        setMessage({ type: "success", text: "✅ Önizleme yükleniyor..." });
        setTimeout(() => setMessage(null), 2000);
      } else {
        setMessage({ type: "error", text: "⚠️ Hiç step bulunamadı!" });
      }
    } catch (e) {
      setMessage({ type: "error", text: "⚠️ Geçersiz JSON formatı!" });
    }
  };

  return (
    <div>
      <Message type={message?.type} text={message?.text} />

      <Card>
        <div style={styles.grid2}>
          <Input
            label="Ders Numarası *"
            type="number"
            value={lessonNumber}
            onChange={(e) => setLessonNumber(e.target.value)}
            placeholder="1, 2, 3..."
          />
          <div>
            <label style={styles.label}>Seviye *</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              style={styles.input(true)}
            >
              <option value="A1">A1</option>
              <option value="A2">A2</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
            </select>
          </div>
        </div>

        <Input
          label="Ders Başlığı *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Örn: To Be Fiili - Olumsuz"
        />

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <label style={styles.label}>İçerik (JSON)</label>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setShowPrompt(!showPrompt)}
                style={{
                  background: "none",
                  border: `1px solid ${colors.border}`,
                  borderRadius: 6,
                  color: colors.textSecondary,
                  fontSize: 11,
                  padding: "4px 10px",
                  cursor: "pointer"
                }}
              >
                {showPrompt ? "Gizle" : "📋 Prompt"}
              </button>
              <button
                onClick={() => setShowExample(!showExample)}
                style={{
                  background: "none",
                  border: `1px solid ${colors.border}`,
                  borderRadius: 6,
                  color: colors.textSecondary,
                  fontSize: 11,
                  padding: "4px 10px",
                  cursor: "pointer"
                }}
              >
                {showExample ? "Gizle" : "Örnek JSON"}
              </button>
              <button
                onClick={handlePreview}
                style={{
                  background: colors.primary,
                  border: "none",
                  borderRadius: 6,
                  color: "#fff",
                  fontSize: 11,
                  padding: "4px 10px",
                  cursor: "pointer"
                }}
              >
                👁️ Önizle
              </button>
            </div>
          </div>
          <TextArea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='{"steps": [...]} veya boş bırakın'
            rows={8}
          />
          
          {showPrompt && (
            <div style={{ marginTop: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ fontSize: 11, color: colors.textSecondary }}>
                  📋 Prompt Template - AI'ya göndermek için kopyalayın
                </div>
                <button
                  onClick={copyPrompt}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 6,
                    border: `1px solid ${colors.border}`,
                    background: "transparent",
                    color: colors.textSecondary,
                    cursor: "pointer",
                    fontSize: 11
                  }}
                >
                  📋 Kopyala
                </button>
              </div>
              <div style={{
                background: colors.surfaceDark,
                borderRadius: 8,
                padding: "12px",
                maxHeight: 300,
                overflowY: "auto",
                border: `1px solid ${colors.border}`,
                fontSize: 12,
                fontFamily: "monospace",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                color: colors.textSecondary,
                lineHeight: 1.6
              }}>
                {PROMPT_TEMPLATE}
              </div>
            </div>
          )}

          {showExample && (
            <div style={{ marginTop: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ fontSize: 11, color: colors.textSecondary }}>
                  📄 JSON Formatı Örneği
                </div>
                <button
                  onClick={copyNewJsonExample}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 6,
                    border: `1px solid ${colors.border}`,
                    background: "transparent",
                    color: colors.textSecondary,
                    cursor: "pointer",
                    fontSize: 11
                  }}
                >
                  📋 Kopyala
                </button>
              </div>
              <JsonDisplay data={NEW_JSON_EXAMPLE} />
            </div>
          )}

          {/* PREVIEW */}
          {previewStep && (
            <div style={{ marginTop: 16 }}>
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                marginBottom: 8
              }}>
                <div style={{ fontSize: 11, color: colors.textSecondary }}>
                  👁️ Adım Önizleme
                </div>
                <button
                  onClick={() => setPreviewStep(null)}
                  style={{
                    background: "none",
                    border: `1px solid ${colors.border}`,
                    borderRadius: 6,
                    color: colors.textSecondary,
                    fontSize: 11,
                    padding: "2px 10px",
                    cursor: "pointer"
                  }}
                >
                  ✕ Kapat
                </button>
              </div>
              <LessonStepRenderer step={previewStep} stepIndex={0} />
            </div>
          )}
        </div>
      </Card>

      <button
        onClick={handleAddLesson}
        disabled={loading || !lessonNumber || !title}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: 12,
          border: "none",
          background: (loading || !lessonNumber || !title) ? "#1e1e30" : colors.primary,
          color: (loading || !lessonNumber || !title) ? colors.textMuted : "#fff",
          fontWeight: 700,
          fontSize: 15,
          cursor: (loading || !lessonNumber || !title) ? "not-allowed" : "pointer",
          transition: "all 0.2s"
        }}
      >
        {loading ? "⏳ Ekleniyor..." : "📚 Dersi Ekle"}
      </button>
    </div>
  );
}

// ============================
// DERS DÜZENLEME BİLEŞENİ
// ============================
function LessonEditor() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState(null);
  const [searchTimeout, setSearchTimeout] = useState(null);

  const [formData, setFormData] = useState({
    lesson_number: "",
    title: "",
    level: "A1",
    content_json: {}
  });

  const performSearch = useCallback(async (term) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setMessage(null);
    setSelectedLesson(null);

    try {
      const { data, error } = await supabase
        .from("en_lessons")
        .select("*")
        .or(`title.ilike.%${term}%, lesson_number::text.ilike.%${term}%`)
        .order("level")
        .order("lesson_number")
        .limit(20);

      if (error) throw error;

      setSearchResults(data || []);
      if (data.length === 0) {
        setMessage({ type: "info", text: `"${term}" için ders bulunamadı` });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Arama hatası: " + error.message });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      performSearch(value);
    }, 300);

    setSearchTimeout(timeout);
  };

  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const selectLesson = (lesson) => {
    setSelectedLesson(lesson);
    setFormData({
      lesson_number: lesson.lesson_number,
      title: lesson.title,
      level: lesson.level || "A1",
      content_json: lesson.content_json || {}
    });
    setEditing(false);
    setMessage(null);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getPrettyJson = (json) => {
    try {
      return JSON.stringify(json, null, 2);
    } catch {
      return JSON.stringify(json);
    }
  };

  const handleJsonChange = (value) => {
    try {
      const parsed = JSON.parse(value);
      setFormData(prev => ({ ...prev, content_json: parsed }));
      setMessage(null);
    } catch (e) {
      setFormData(prev => ({ ...prev, content_json: value }));
      setMessage({ type: "error", text: "⚠️ Geçersiz JSON formatı" });
    }
  };

  const handleSave = async () => {
    if (!selectedLesson) return;

    let contentToSave = formData.content_json;
    if (typeof contentToSave === 'string') {
      try {
        contentToSave = JSON.parse(contentToSave);
      } catch (e) {
        setMessage({ type: "error", text: "⚠️ Lütfen geçerli bir JSON girin" });
        return;
      }
    }

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from("en_lessons")
        .update({
          lesson_number: parseInt(formData.lesson_number),
          title: formData.title,
          level: formData.level,
          content_json: contentToSave,
        })
        .eq("id", selectedLesson.id);

      if (error) throw error;

      setMessage({ type: "success", text: "✅ Ders başarıyla güncellendi!" });
      setEditing(false);

      const updatedLesson = { 
        ...selectedLesson, 
        ...formData,
        content_json: contentToSave
      };
      setSelectedLesson(updatedLesson);

      setSearchResults(prev => 
        prev.map(l => l.id === updatedLesson.id ? updatedLesson : l)
      );

    } catch (error) {
      setMessage({ type: "error", text: "Kaydetme hatası: " + error.message });
    } finally {
      setLoading(false);
    }
  };

  const deleteLesson = async () => {
    if (!selectedLesson) return;
    if (!window.confirm(`"${selectedLesson.title}" dersini silmek istediğinize emin misiniz?`)) return;

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from("en_lessons")
        .delete()
        .eq("id", selectedLesson.id);

      if (error) throw error;

      setMessage({ type: "success", text: "🗑️ Ders başarıyla silindi!" });
      
      setSearchResults(prev => prev.filter(l => l.id !== selectedLesson.id));
      setSelectedLesson(null);
      setFormData({
        lesson_number: "",
        title: "",
        level: "A1",
        content_json: {}
      });

    } catch (error) {
      setMessage({ type: "error", text: "Silme hatası: " + error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Card>
        <SearchInput
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Ders numarası veya başlık ara..."
          loading={loading}
          onClear={() => {
            setSearchTerm("");
            setSearchResults([]);
            setMessage(null);
          }}
        />

        {searchResults.length > 0 && !selectedLesson && (
          <div style={{ marginTop: 10, fontSize: 12, color: colors.textSecondary }}>
            {searchResults.length} ders bulundu
          </div>
        )}

        <Message type={message?.type} text={message?.text} />
      </Card>

      {searchResults.length > 0 && !selectedLesson && (
        <Card>
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {searchResults.map((lesson) => (
              <div 
                key={lesson.id}
                onClick={() => selectLesson(lesson)}
                style={styles.listItem}
                onMouseEnter={(e) => e.currentTarget.style.background = colors.surfaceDark}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Badge text={`#${lesson.lesson_number}`} />
                    <span style={{ fontWeight: 700, fontSize: 16 }}>{lesson.title}</span>
                  </div>
                  <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                    Seviye: {lesson.level || "A1"}
                  </div>
                </div>
                <span style={{ 
                  fontSize: 10, 
                  background: colors.surfaceLight, 
                  color: colors.textSecondary, 
                  padding: "2px 10px", 
                  borderRadius: 4
                }}>
                  📝 {lesson.content_json?.steps?.length || 0} adım
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {selectedLesson && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <span style={{ fontSize: 18, fontWeight: 800 }}>#{selectedLesson.lesson_number} - {selectedLesson.title}</span>
              <span style={{ fontSize: 14, color: colors.textSecondary, marginLeft: 12 }}>ID: {selectedLesson.id.slice(0, 8)}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button 
                onClick={() => setSelectedLesson(null)}
                style={styles.backButton}
              >
                ← Listeye Dön
              </button>
              <button 
                onClick={() => setEditing(!editing)}
                style={styles.editButton(editing)}
              >
                {editing ? "Düzenlemeyi Kapat" : "✏️ Düzenle"}
              </button>
              {editing && (
                <>
                  <button 
                    onClick={handleSave}
                    disabled={loading}
                    style={{
                      padding: "6px 20px",
                      borderRadius: 8,
                      border: "none",
                      background: colors.success,
                      color: "#fff",
                      fontWeight: 700,
                      cursor: loading ? "not-allowed" : "pointer",
                      opacity: loading ? 0.6 : 1
                    }}
                  >
                    💾 Kaydet
                  </button>
                  <button 
                    onClick={deleteLesson}
                    disabled={loading}
                    style={styles.dangerButton(loading)}
                  >
                    🗑️ Sil
                  </button>
                </>
              )}
            </div>
          </div>

          <div style={styles.grid2}>
            <Input
              label="Ders Numarası"
              type="number"
              value={formData.lesson_number}
              onChange={(e) => handleFormChange("lesson_number", e.target.value)}
              disabled={!editing}
            />
            <Input
              label="Başlık"
              value={formData.title}
              onChange={(e) => handleFormChange("title", e.target.value)}
              disabled={!editing}
            />
            <div>
              <label style={styles.label}>Seviye</label>
              <select
                value={formData.level}
                onChange={(e) => handleFormChange("level", e.target.value)}
                disabled={!editing}
                style={styles.input(editing)}
              >
                <option value="A1">A1</option>
                <option value="A2">A2</option>
                <option value="B1">B1</option>
                <option value="B2">B2</option>
              </select>
            </div>
            <div>
              <label style={styles.label}>Oluşturulma Tarihi</label>
              <div style={{
                padding: "8px 12px",
                background: colors.surfaceDark,
                borderRadius: 8,
                color: colors.textSecondary,
                fontSize: 13,
                border: `1px solid ${colors.border}`
              }}>
                {new Date(selectedLesson.created_at).toLocaleString('tr-TR')}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 24, borderTop: `1px solid ${colors.border}`, paddingTop: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>📦 İçerik (JSON)</div>
              {!editing && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(getPrettyJson(formData.content_json));
                    setMessage({ type: "success", text: "✅ JSON kopyalandı!" });
                    setTimeout(() => setMessage(null), 2000);
                  }}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 6,
                    border: `1px solid ${colors.border}`,
                    background: "transparent",
                    color: colors.textSecondary,
                    cursor: "pointer",
                    fontSize: 11
                  }}
                >
                  📋 Kopyala
                </button>
              )}
            </div>
            
            {editing ? (
              <TextArea
                value={typeof formData.content_json === 'string' ? formData.content_json : getPrettyJson(formData.content_json)}
                onChange={(e) => handleJsonChange(e.target.value)}
                rows={15}
              />
            ) : (
              <div style={{
                background: colors.surfaceDark,
                borderRadius: 8,
                padding: "16px",
                maxHeight: 400,
                overflowY: "auto",
                border: `1px solid ${colors.border}`
              }}>
                <pre style={{
                  margin: 0,
                  color: colors.textSecondary,
                  fontSize: 12,
                  fontFamily: "monospace",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word"
                }}>
                  {getPrettyJson(formData.content_json)}
                </pre>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}