// components/home/LessonsSection.jsx
import { styles } from "./styles.js";

export default function LessonsSection({ 
  lessons, 
  loading, 
  onGoToLesson 
}) {
  if (loading) {
    return (
      <div style={styles.lessonsSection} className="reveal" data-delay="0.5">
        <div style={styles.lessonsHeader}>
          <span style={styles.lessonsTitle}>📚 Dersler</span>
        </div>
        <div style={styles.lessonsLoading}>
          <span style={styles.miniSpinner} />
          Dersler yükleniyor...
        </div>
      </div>
    );
  }

  return (
    <div style={styles.lessonsSection} className="reveal" data-delay="0.5">
      <div style={styles.lessonsHeader}>
        <span style={styles.lessonsTitle}>📚 Dersler</span>
        {lessons.length > 0 && (
          <span style={styles.lessonsCount}>{lessons.length} ders</span>
        )}
      </div>
      
      {lessons.length > 0 ? (
        <div style={styles.lessonsList}>
          {lessons.map((lesson) => (
            <div
              key={lesson.id}
              onClick={() => onGoToLesson?.(lesson.id)}
              style={styles.lessonCard}
              className="lesson-card"
            >
              <div style={styles.lessonCardLeft}>
                <div style={styles.lessonNumber}>
                  #{lesson.lesson_number}
                </div>
                <div>
                  <div style={styles.lessonTitle}>{lesson.title}</div>
                  <div style={styles.lessonLevel}>{lesson.level}</div>
                </div>
              </div>
              <div style={styles.lessonArrow}>→</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.noLessons}>
          <span style={styles.noLessonsIcon}>📖</span>
          <span>Henüz ders eklenmemiş</span>
        </div>
      )}
    </div>
  );
}