// components/common/ProgressBar.jsx
export default function ProgressBar({ current, total, color }) {
  const progress = total > 0 ? ((current + 1) / total) * 100 : 0;
  
  return (
    <div className="w-full h-1.5 rounded-full overflow-hidden bg-base-300/50">
      <div 
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{ 
          width: `${progress}%`,
          backgroundColor: color,
          boxShadow: `0 0 12px ${color}60`
        }}
      />
    </div>
  );
}