// src/components/Header/components/StreakPill.jsx
export default function StreakPill({ days }) {
  return (
    <div className="flex shrink-0 items-center gap-1.5 rounded-xl border border-warning/25 bg-warning/10 px-2.5 py-2 transition-colors hover:bg-warning/15">
      <i className="ti ti-flame text-[15px] text-warning" aria-hidden="true" />
      <span className="min-w-3 text-center font-display text-[13px] font-bold text-warning">
        {days}
      </span>
    </div>
  );
}