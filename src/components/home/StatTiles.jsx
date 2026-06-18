// components/home/StatTiles.jsx
import { styles } from "./styles.js";

function StatTile({ icon, value, label }) {
  return (
    <div style={styles.statTile} className="stat-tile">
      <div style={styles.statIcon}>{icon}</div>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

export default function StatTiles({ progress, remainingWords }) {
  return (
    <div style={styles.statGrid} className="reveal" data-delay="4">
      <StatTile icon="📊" value={`${Math.round(progress)}%`} label="Tamamlanma" />
      <StatTile icon="⏳" value={remainingWords} label="Kalan Kelime" />
    </div>
  );
}