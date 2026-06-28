import { useState } from "react";
import { supabase } from "../../config.js";
import { useAuth } from "../../contexts/AuthContext.jsx";

export default function ExampleModal({ 
  word, 
  onClose, 
  onSuccess,
  examplesMap,
  setExamplesMap 
}) {
  const { user } = useAuth();
  const userId = user?.id;

  const [exampleJsonInput, setExampleJsonInput] = useState("");
  const [exampleParseError, setExampleParseError] = useState(null);
  const [exampleStatus, setExampleStatus] = useState(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

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
    if (!exampleJsonInput.trim() || !word || !userId) {
      setExampleParseError("Kullanıcı bilgisi yüklenemedi.");
      return;
    }

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
            word_id: word.id,
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
          user_id: userId,
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
        .eq("word_id", word.id)
        .order("order_index");

      setExamplesMap(prev => ({
        ...prev,
        [word.id]: newExamples || []
      }));

      setExampleStatus("success");
      setTimeout(() => {
        onSuccess();
      }, 1500);

    } catch (e) {
      setExampleParseError(e.message);
      setExampleStatus("error");
    }
  };

  return (
    <div style={{ 
      position: "fixed", 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      background: "rgba(0,0,0,0.85)", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      zIndex: 1000, 
      padding: 20 
    }}>
      <div style={{ 
        background: "#1a1a2e", 
        borderRadius: 20, 
        maxWidth: 500, 
        width: "100%", 
        maxHeight: "90vh", 
        overflowY: "auto", 
        padding: 24, 
        border: "1px solid #1e293b" 
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>📝 Örnek Cümle Ekle</div>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
              Kelime: <span style={{ color: "#6366f1", fontWeight: 700 }}>{word.word}</span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            style={{ 
              background: "#1e293b", 
              border: "none", 
              borderRadius: 8, 
              color: "#64748b", 
              fontSize: 20, 
              cursor: "pointer", 
              width: 32, 
              height: 32 
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ background: "#0f0f1a", borderRadius: 12, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>🤖 Yapay Zeka Promptu</div>
          <div style={{ 
            background: "#1a1a2e", 
            borderRadius: 8, 
            padding: 12, 
            fontSize: 11, 
            color: "#e2e8f0", 
            fontFamily: "monospace", 
            whiteSpace: "pre-wrap", 
            wordBreak: "break-word", 
            marginBottom: 10 
          }}>
            {generatePrompt(word.word)}
          </div>
          <button 
            onClick={() => handleCopyPrompt(word.word)} 
            style={{ 
              background: copiedPrompt ? "#0e2d1f" : "#1e293b", 
              border: "none", 
              borderRadius: 8, 
              color: copiedPrompt ? "#10b981" : "#94a3b8", 
              fontSize: 12, 
              padding: "6px 12px", 
              cursor: "pointer" 
            }}
          >
            {copiedPrompt ? "✓ Kopyalandı!" : "📋 Promptu Kopyala"}
          </button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>JSON Çıktısını Yapıştır</div>
          <textarea
            value={exampleJsonInput}
            onChange={e => { 
              setExampleJsonInput(e.target.value); 
              setExampleParseError(null); 
              setExampleStatus(null); 
            }}
            placeholder='[{"sentence_en": "...", "sentence_tr": "..."}]'
            rows={8}
            style={{ 
              width: "100%", 
              boxSizing: "border-box", 
              background: "#0f0f1a", 
              border: `1px solid ${exampleParseError ? "#ef4444" : "#1e293b"}`, 
              borderRadius: 12, 
              padding: 12, 
              color: "#e2e8f0", 
              fontSize: 11, 
              fontFamily: "monospace", 
              resize: "vertical", 
              outline: "none" 
            }}
          />
          {exampleParseError && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 6 }}>⚠️ {exampleParseError}</div>}
        </div>

        <button
          onClick={handleParseAndSaveExamples}
          disabled={!exampleJsonInput.trim() || exampleStatus === "loading"}
          style={{ 
            width: "100%", 
            padding: 14, 
            borderRadius: 12, 
            border: "none", 
            background: exampleJsonInput.trim() ? "#6366f1" : "#1e1e30", 
            color: exampleJsonInput.trim() ? "#fff" : "#475569", 
            fontWeight: 700, 
            fontSize: 14, 
            cursor: exampleJsonInput.trim() ? "pointer" : "not-allowed" 
          }}
        >
          {exampleStatus === "loading" ? "Kaydediliyor..." : 
           exampleStatus === "success" ? "✓ Kaydedildi!" : 
           "💾 Örnek Cümleleri Kaydet"}
        </button>
      </div>
    </div>
  );
}