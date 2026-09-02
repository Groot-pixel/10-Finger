export default function StarRating({ value = 0, onChange, size = 'text-base', readOnly = false }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className={`inline-flex gap-0.5 ${size}`}>
      {stars.map((s) => (
        <button
          key={s}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(s)}
          className={`${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform ${
            s <= Math.round(value) ? 'text-amber-400' : 'text-slate-600'
          }`}
          aria-label={`${s} Sterne`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
