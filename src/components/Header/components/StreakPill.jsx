// src/components/Header/components/StreakPill.jsx
export default function StreakPill({ days }) {
  return (
    <div className="streak-pill">
      <i className="ti ti-flame" aria-hidden="true" />
      <span>{days}</span>
    </div>
  );
}
