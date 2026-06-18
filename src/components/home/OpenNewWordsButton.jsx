// components/home/OpenNewWordsButton.jsx
import { styles } from "./styles.js";

export default function OpenNewWordsButton({ 
  dailyRemaining, 
  myWordsCount, 
  totalWords, 
  opening, 
  onOpenNewWords 
}) {
  if (dailyRemaining === 0 || myWordsCount >= totalWords) {
    return null;
  }

  return (
    <button
      onClick={onOpenNewWords}
      disabled={opening}
      className="reveal cta-btn"
      data-delay="2"
      style={{
        ...styles.ctaButton,
        ...(opening ? styles.ctaButtonDisabled : {}),
      }}
    >
      <span style={styles.ctaShine} />
      <span style={styles.ctaContent}>
        {opening ? (
          <>
            <span style={styles.miniSpinner} />
            Açılıyor
          </>
        ) : (
          <>
            <span style={styles.ctaIcon}>✦</span>
            {dailyRemaining} Yeni Kelime Aç
          </>
        )}
      </span>
    </button>
  );
}