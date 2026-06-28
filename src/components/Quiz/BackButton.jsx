// src/components/BackButton.jsx
export default function BackButton({ onClick, label = "Geri Dön" }) {
  return (
    <button
      onClick={onClick}
      className="btn btn-ghost btn-sm gap-1.5 text-base-content/60 hover:text-primary transition-colors duration-200"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-4 w-4" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M10 19l-7-7m0 0l7-7m-7 7h18" 
        />
      </svg>
      {label}
    </button>
  );
}