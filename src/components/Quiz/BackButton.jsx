// src/components/BackButton.jsx
export default function BackButton({ onClick, label = "Geri Dön" }) {
  return (
    <button
      onClick={onClick}
      className="btn btn-ghost btn-sm mt-1 text-base-content/55 hover:text-primary"
    >
      ← {label}
    </button>
  );
}