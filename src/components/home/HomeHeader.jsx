// components/home/HomeHeader.jsx
import { styles } from "./styles.js";

export default function HomeHeader({ userLevel }) {
  return (
    <div style={styles.header} className="reveal" data-delay="0">
      <div style={styles.brand}>
        <span style={styles.brandDot} />
        LINGORA
      </div>
      <div style={styles.levelRow}>
        <span style={styles.levelBadge}>{userLevel}</span>
        <span style={styles.levelLabel}>Seviyesi</span>
      </div>
    </div>
  );
}