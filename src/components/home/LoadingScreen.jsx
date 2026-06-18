// components/home/LoadingScreen.jsx
import { styles } from "./styles.js";

export default function LoadingScreen() {
  return (
    <div style={styles.loadingScreen}>
      <style>{globalCss}</style>
      <div style={styles.loadingRing} />
      <div style={styles.loadingText}>Yükleniyor</div>
    </div>
  );
}