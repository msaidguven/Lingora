// WordEditor.jsx
import { useState, useEffect } from "react";
import { supabase } from "./config.js";

export default function WordEditor({ onBack }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedWord, setSelectedWord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState(null);
  const [newExample, setNewExample] = useState({ en: "", tr: "" });

  // Form state
  const [formData, setFormData] = useState({
    word: "",
    meaning: "",
    level: "A1",
    type: "word",
    part_of_speech: [],
    category: [],
    difficulty: 1,
    synonyms: [],
    antonyms: [],
    examples: [],
  });

  // Arama yap
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setMessage({ type: "error", text: "Lütfen bir kelime girin" });
      return;
    }

    setLoading(true);
    setMessage(null);
    setSelectedWord(null);

    try {
      const { data, error } = await supabase
        .from("en_words")
        .select(`
          *,
          en_example_sentences (
            id,
            sentence_en,
            sentence_tr,
            difficulty,
            order_index,
            is_approved
          )
        `)
        .or(`word.ilike.%${searchTerm}%, meaning.ilike.%${searchTerm}%`)
        .order("word")
        .limit(20);

      if (error) throw error;

      setSearchResults(data || []);
      if (data.length === 0) {
        setMessage({ type: "info", text: "Kelime bulunamadı" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Arama hatası: " + error.message });
    } finally {
      setLoading(false);
    }
  };

  // Enter tuşu ile ara
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Kelime seç
  const selectWord = (word) => {
    setSelectedWord(word);
    setFormData({
      word: word.word,
      meaning: word.meaning || "",
      level: word.level || "A1",
      type: word.type || "word",
      part_of_speech: word.part_of_speech || [],
      category: word.category || [],
      difficulty: word.difficulty || 1,
      synonyms: word.synonyms || [],
      antonyms: word.antonyms || [],
      examples: word.en_example_sentences || [],
    });
    setEditing(false);
    setMessage(null);
  };

  // Form alanlarını güncelle
  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Array alanlarını güncelle (virgülle ayır)
  const handleArrayChange = (field, value) => {
    const arr = value.split(",").map(s => s.trim()).filter(s => s);
    setFormData(prev => ({ ...prev, [field]: arr }));
  };

  // Kaydet
  const handleSave = async () => {
    if (!selectedWord) return;

    setLoading(true);
    setMessage(null);

    try {
      // 1. Kelimeyi güncelle
      const { error: wordError } = await supabase
        .from("en_words")
        .update({
          word: formData.word,
          meaning: formData.meaning,
          level: formData.level,
          type: formData.type,
          part_of_speech: formData.part_of_speech,
          category: formData.category,
          difficulty: formData.difficulty,
          synonyms: formData.synonyms,
          antonyms: formData.antonyms,
        })
        .eq("id", selectedWord.id);

      if (wordError) throw wordError;

      setMessage({ type: "success", text: "✅ Kelime başarıyla güncellendi!" });
      setEditing(false);

      // Seçili kelimeyi güncelle
      const updatedWord = { ...selectedWord, ...formData };
      setSelectedWord(updatedWord);

      // Arama sonuçlarını güncelle
      setSearchResults(prev => 
        prev.map(w => w.id === updatedWord.id ? updatedWord : w)
      );

    } catch (error) {
      setMessage({ type: "error", text: "Kaydetme hatası: " + error.message });
    } finally {
      setLoading(false);
    }
  };

  // Yeni cümle ekle
  const addExample = async () => {
    if (!selectedWord) return;
    if (!newExample.en.trim() || !newExample.tr.trim()) {
      setMessage({ type: "error", text: "Cümle ve çevirisi zorunlu" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("en_example_sentences")
        .insert({
          word_id: selectedWord.id,
          sentence_en: newExample.en,
          sentence_tr: newExample.tr,
          difficulty: formData.difficulty,
          order_index: formData.examples.length,
          source: "manual",
          is_approved: true,
        })
        .select();

      if (error) throw error;

      // Yerel state güncelle
      const updatedExamples = [...formData.examples, data[0]];
      setFormData(prev => ({ ...prev, examples: updatedExamples }));
      setNewExample({ en: "", tr: "" });
      setMessage({ type: "success", text: "✅ Cümle eklendi!" });

    } catch (error) {
      setMessage({ type: "error", text: "Cümle eklenemedi: " + error.message });
    } finally {
      setLoading(false);
    }
  };

  // Cümle sil
  const deleteExample = async (exampleId) => {
    if (!window.confirm("Bu cümleyi silmek istediğinize emin misiniz?")) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("en_example_sentences")
        .delete()
        .eq("id", exampleId);

      if (error) throw error;

      // Yerel state güncelle
      const updatedExamples = formData.examples.filter(e => e.id !== exampleId);
      setFormData(prev => ({ ...prev, examples: updatedExamples }));
      setMessage({ type: "success", text: "✅ Cümle silindi!" });

    } catch (error) {
      setMessage({ type: "error", text: "Cümle silinemedi: " + error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      {/* Başlık ve Geri Butonu */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 3, color: "#6366f1", fontWeight: 700, textTransform: "uppercase" }}>WordFlow</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>✏️ Kelime Düzenle</div>
        </div>
        <button 
          onClick={onBack} 
          style={{ 
            background: "#1e293b", 
            border: "none", 
            borderRadius: 8, 
            padding: "8px 16px", 
            color: "#94a3b8", 
            fontSize: 13, 
            cursor: "pointer" 
          }}
        >
          ← Ana Sayfaya Dön
        </button>
      </div>

      {/* Arama Bölümü */}
      <div style={{ 
        background: "#1a1a2e", 
        borderRadius: 14, 
        padding: 20, 
        border: "1px solid #1e293b",
        marginBottom: 24
      }}>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Kelime veya anlam ara..."
            style={{
              flex: 1,
              background: "#0f0f1a",
              border: "1px solid #1e293b",
              borderRadius: 10,
              padding: "10px 14px",
              color: "#e2e8f0",
              fontSize: 14,
              outline: "none",
              fontFamily: "inherit"
            }}
          />
          <button 
            onClick={handleSearch} 
            disabled={loading}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              border: "none",
              background: "#6366f1",
              color: "#fff",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "🔍" : "Ara"}
          </button>
        </div>

        {/* Mesajlar */}
        {message && (
          <div style={{ 
            marginTop: 12, 
            padding: 10, 
            borderRadius: 8, 
            background: message.type === "error" ? "#2d1a0e" : "#0e2d1f",
            border: `1px solid ${message.type === "error" ? "#ef4444" : "#10b981"}`,
            color: message.type === "error" ? "#ef4444" : "#10b981",
            fontSize: 13
          }}>
            {message.text}
          </div>
        )}
      </div>

      {/* Arama Sonuçları */}
      {searchResults.length > 0 && !selectedWord && (
        <div style={{ 
          background: "#1a1a2e", 
          borderRadius: 14, 
          padding: 16, 
          border: "1px solid #1e293b",
          marginBottom: 24
        }}>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>
            {searchResults.length} kelime bulundu
          </div>
          {searchResults.map((word) => (
            <div 
              key={word.id}
              onClick={() => selectWord(word)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 14px",
                borderBottom: "1px solid #0f0f1a",
                cursor: "pointer",
                transition: "all 0.2s",
                borderRadius: 6,
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#0f0f1a"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <div>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{word.word}</span>
                <span style={{ color: "#64748b", marginLeft: 10, fontSize: 13 }}>{word.meaning}</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ fontSize: 10, background: "#6366f122", color: "#6366f1", padding: "2px 8px", borderRadius: 4 }}>
                  {word.level}
                </span>
                <span style={{ fontSize: 10, background: "#1e293b", color: "#64748b", padding: "2px 8px", borderRadius: 4 }}>
                  ⭐ {word.difficulty}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Kelime Düzenleme Formu */}
      {selectedWord && (
        <div style={{ 
          background: "#1a1a2e", 
          borderRadius: 14, 
          padding: 24, 
          border: "1px solid #1e293b"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <span style={{ fontSize: 18, fontWeight: 800 }}>{selectedWord.word}</span>
              <span style={{ fontSize: 14, color: "#64748b", marginLeft: 12 }}>#{selectedWord.id.slice(0, 8)}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button 
                onClick={() => setEditing(!editing)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: "1px solid #6366f1",
                  background: editing ? "#6366f1" : "transparent",
                  color: editing ? "#fff" : "#6366f1",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600
                }}
              >
                {editing ? "Düzenlemeyi Kapat" : "✏️ Düzenle"}
              </button>
              {editing && (
                <button 
                  onClick={handleSave}
                  disabled={loading}
                  style={{
                    padding: "6px 20px",
                    borderRadius: 8,
                    border: "none",
                    background: "#10b981",
                    color: "#fff",
                    fontWeight: 700,
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  💾 Kaydet
                </button>
              )}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {/* Word */}
            <div>
              <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}>Kelime</label>
              <input
                value={formData.word}
                onChange={(e) => handleFormChange("word", e.target.value)}
                disabled={!editing}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: editing ? "#0f0f1a" : "#1a1a2e",
                  border: "1px solid #1e293b",
                  borderRadius: 8,
                  padding: "8px 12px",
                  color: "#e2e8f0",
                  fontSize: 14,
                  outline: "none",
                  fontFamily: "inherit",
                  opacity: editing ? 1 : 0.7
                }}
              />
            </div>

            {/* Meaning */}
            <div>
              <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}>Anlam</label>
              <input
                value={formData.meaning}
                onChange={(e) => handleFormChange("meaning", e.target.value)}
                disabled={!editing}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: editing ? "#0f0f1a" : "#1a1a2e",
                  border: "1px solid #1e293b",
                  borderRadius: 8,
                  padding: "8px 12px",
                  color: "#e2e8f0",
                  fontSize: 14,
                  outline: "none",
                  fontFamily: "inherit",
                  opacity: editing ? 1 : 0.7
                }}
              />
            </div>

            {/* Level */}
            <div>
              <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}>Seviye</label>
              <select
                value={formData.level}
                onChange={(e) => handleFormChange("level", e.target.value)}
                disabled={!editing}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: editing ? "#0f0f1a" : "#1a1a2e",
                  border: "1px solid #1e293b",
                  borderRadius: 8,
                  padding: "8px 12px",
                  color: "#e2e8f0",
                  fontSize: 14,
                  outline: "none",
                  fontFamily: "inherit",
                  opacity: editing ? 1 : 0.7
                }}
              >
                <option value="A1">A1</option>
                <option value="A2">A2</option>
                <option value="B1">B1</option>
                <option value="B2">B2</option>
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}>Zorluk (1-5)</label>
              <input
                type="number"
                min={1}
                max={5}
                value={formData.difficulty}
                onChange={(e) => handleFormChange("difficulty", Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))}
                disabled={!editing}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: editing ? "#0f0f1a" : "#1a1a2e",
                  border: "1px solid #1e293b",
                  borderRadius: 8,
                  padding: "8px 12px",
                  color: "#e2e8f0",
                  fontSize: 14,
                  outline: "none",
                  fontFamily: "inherit",
                  opacity: editing ? 1 : 0.7
                }}
              />
            </div>

            {/* Part of Speech */}
            <div>
              <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}>
                Tür (virgülle ayır)
              </label>
              <input
                value={formData.part_of_speech.join(", ")}
                onChange={(e) => handleArrayChange("part_of_speech", e.target.value)}
                disabled={!editing}
                placeholder="noun, verb, adjective"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: editing ? "#0f0f1a" : "#1a1a2e",
                  border: "1px solid #1e293b",
                  borderRadius: 8,
                  padding: "8px 12px",
                  color: "#e2e8f0",
                  fontSize: 13,
                  outline: "none",
                  fontFamily: "inherit",
                  opacity: editing ? 1 : 0.7
                }}
              />
            </div>

            {/* Category */}
            <div>
              <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}>
                Kategori (virgülle ayır)
              </label>
              <input
                value={formData.category.join(", ")}
                onChange={(e) => handleArrayChange("category", e.target.value)}
                disabled={!editing}
                placeholder="daily, business, travel"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: editing ? "#0f0f1a" : "#1a1a2e",
                  border: "1px solid #1e293b",
                  borderRadius: 8,
                  padding: "8px 12px",
                  color: "#e2e8f0",
                  fontSize: 13,
                  outline: "none",
                  fontFamily: "inherit",
                  opacity: editing ? 1 : 0.7
                }}
              />
            </div>

            {/* Synonyms */}
            <div>
              <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}>
                Eş Anlamlılar (virgülle ayır)
              </label>
              <input
                value={formData.synonyms.join(", ")}
                onChange={(e) => handleArrayChange("synonyms", e.target.value)}
                disabled={!editing}
                placeholder="joyful, cheerful"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: editing ? "#0f0f1a" : "#1a1a2e",
                  border: "1px solid #1e293b",
                  borderRadius: 8,
                  padding: "8px 12px",
                  color: "#e2e8f0",
                  fontSize: 13,
                  outline: "none",
                  fontFamily: "inherit",
                  opacity: editing ? 1 : 0.7
                }}
              />
            </div>

            {/* Antonyms */}
            <div>
              <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}>
                Zıt Anlamlılar (virgülle ayır)
              </label>
              <input
                value={formData.antonyms.join(", ")}
                onChange={(e) => handleArrayChange("antonyms", e.target.value)}
                disabled={!editing}
                placeholder="sad, unhappy"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: editing ? "#0f0f1a" : "#1a1a2e",
                  border: "1px solid #1e293b",
                  borderRadius: 8,
                  padding: "8px 12px",
                  color: "#e2e8f0",
                  fontSize: 13,
                  outline: "none",
                  fontFamily: "inherit",
                  opacity: editing ? 1 : 0.7
                }}
              />
            </div>
          </div>

          {/* Örnek Cümleler Bölümü */}
          <div style={{ marginTop: 24, borderTop: "1px solid #1e293b", paddingTop: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>📝 Örnek Cümleler ({formData.examples.length})</div>
            
            {/* Yeni Cümle Ekleme */}
            {editing && (
              <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                <input
                  value={newExample.en}
                  onChange={(e) => setNewExample(prev => ({ ...prev, en: e.target.value }))}
                  placeholder="İngilizce cümle..."
                  style={{
                    flex: 1,
                    background: "#0f0f1a",
                    border: "1px solid #1e293b",
                    borderRadius: 8,
                    padding: "8px 12px",
                    color: "#e2e8f0",
                    fontSize: 13,
                    outline: "none",
                    fontFamily: "inherit"
                  }}
                />
                <input
                  value={newExample.tr}
                  onChange={(e) => setNewExample(prev => ({ ...prev, tr: e.target.value }))}
                  placeholder="Türkçe çeviri..."
                  style={{
                    flex: 1,
                    background: "#0f0f1a",
                    border: "1px solid #1e293b",
                    borderRadius: 8,
                    padding: "8px 12px",
                    color: "#e2e8f0",
                    fontSize: 13,
                    outline: "none",
                    fontFamily: "inherit"
                  }}
                />
                <button
                  onClick={addExample}
                  disabled={loading}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: "none",
                    background: "#6366f1",
                    color: "#fff",
                    fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.6 : 1,
                    whiteSpace: "nowrap"
                  }}
                >
                  ➕ Ekle
                </button>
              </div>
            )}

            {/* Cümle Listesi */}
            <div style={{ maxHeight: 300, overflowY: "auto" }}>
              {formData.examples.map((example, index) => (
                <div 
                  key={example.id || index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                    background: index % 2 === 0 ? "#0f0f1a" : "transparent",
                    borderRadius: 6,
                    marginBottom: 4
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: "#e2e8f0" }}>{example.sentence_en}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{example.sentence_tr}</div>
                  </div>
                  {editing && (
                    <button
                      onClick={() => deleteExample(example.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#ef4444",
                        cursor: "pointer",
                        fontSize: 16,
                        padding: "4px 8px"
                      }}
                      title="Sil"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {formData.examples.length === 0 && (
                <div style={{ fontSize: 13, color: "#64748b", padding: "12px 0", textAlign: "center" }}>
                  Henüz örnek cümle yok
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}