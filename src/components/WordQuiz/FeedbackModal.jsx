// FeedbackModal.jsx
import { useState } from 'react';
import { supabase } from '../../config.js';

export default function FeedbackModal({ word, onClose, user }) {
  const [feedback, setFeedback] = useState('');
  const [type, setType] = useState('suggestion');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim() || !user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('word_feedback')
        .insert({
          word_id: word.id,
          word: word.word,
          user_id: user.id,
          user_email: user.email,
          feedback: feedback.trim(),
          type: type,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Geri bildirim gönderme hatası:', error);
      alert('Geri bildirim gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-base-200 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-base-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">
            💬 Geri Bildirim
          </h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-square">
            ✕
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-base-content/70">
            Kelime: <span className="font-bold text-base-content">{word.word}</span>
          </p>
          <p className="text-xs text-base-content/50 mt-1">
            Anlamı: {word.meaning}
          </p>
        </div>

        <div className="form-control mb-4">
          <label className="label">
            <span className="label-text">Bildirim Türü</span>
          </label>
          <select 
            className="select select-bordered w-full"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="suggestion">Öneri</option>
            <option value="correction">Hata Düzeltme</option>
            <option value="question">Soru</option>
            <option value="other">Diğer</option>
          </select>
        </div>

        <div className="form-control mb-4">
          <label className="label">
            <span className="label-text">Geri Bildiriminiz</span>
          </label>
          <textarea
            className="textarea textarea-bordered w-full h-32 resize-none"
            placeholder="Bu kelimeyle ilgili düşüncelerinizi, önerilerinizi veya hata bildirimlerinizi yazın..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            disabled={success}
          />
        </div>

        {success && (
          <div className="alert alert-success mb-4">
            <span>✅ Geri bildiriminiz başarıyla gönderildi!</span>
          </div>
        )}

        <div className="flex gap-2">
          <button
            className="btn btn-ghost flex-1"
            onClick={onClose}
            disabled={loading}
          >
            İptal
          </button>
          <button
            className="btn btn-primary flex-1"
            onClick={handleSubmit}
            disabled={loading || !feedback.trim() || success}
          >
            {loading ? 'Gönderiliyor...' : 'Gönder'}
          </button>
        </div>
      </div>
    </div>
  );
}