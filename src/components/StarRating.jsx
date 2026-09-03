import { IconStar } from './Icons'

export default function StarRating({ value, onChange, size = 36 }) {
  return (
    <div className="star-row" role="radiogroup" aria-label="Calificación">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} estrella${n > 1 ? 's' : ''}`}
          className={`star-btn${n <= value ? ' filled' : ''}`}
          onClick={() => onChange(n)}
        >
          <IconStar width={size} height={size} fill={n <= value ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  )
}
