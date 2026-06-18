// components/home/SummaryBar.jsx
import { styles } from "./styles.js";

function SummaryItem({ color, label, value }) {
  return (
    <div style={styles.summaryItem}>
      <span style={{ ...styles.summaryDot, background: color, boxShadow: `0 0 8px ${color}` }} />
      <span style={styles.summaryLabel}>{label}</span>
      <span style={styles.summaryValue}>{value}</span>
    </div>
  );
}

export default function SummaryBar({ dueCount, dueSentenceCount }) {
  return (
    <div style={styles.summaryBar} className="reveal" data-delay="5">
      <SummaryItem color="#10b981" label="Kelime" value={dueCount} />
      <div style={styles.summaryDivider} />
      <SummaryItem color="#3b82f6" label="Cümle" value={dueSentenceCount} />
      <div style={styles.summaryDivider} />
      <SummaryItem color="#a855f7" label="Toplam" value={dueCount + dueSentenceCount} />
    </div>
  );
}