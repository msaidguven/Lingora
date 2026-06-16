export default function ProgressBar({ current, total, color }) {
  return (
    <div style={{ height: 3, background: "#1e1e30", borderRadius: 99, marginBottom: 18, overflow: "hidden" }}>
      <div 
        style={{ 
          height: "100%", 
          width: `${((current + 1) / total) * 100}%`, 
          background: color, 
          borderRadius: 99, 
          transition: "width 0.4s" 
        }} 
      />
    </div>
  );
}