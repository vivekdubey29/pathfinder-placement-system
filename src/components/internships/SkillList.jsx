import { ProgressBar } from '../common/Indicators.jsx'

// skills: string[]. matched / missing: string[] using the same spelling as `skills`
// (the recommendation engine preserves the listing's spelling).
// limit: show only the first N skills, plus a "+k more" chip.
export function SkillList({ skills = [], matched = [], missing = [], limit, ariaLabel = 'Skills' }) {
    if (!Array.isArray(skills) || skills.length === 0) {
        return <p className="text-sm text-subtle">No skills listed.</p>
    }

    const matchedSet = new Set(matched)
    const missingSet = new Set(missing)
    const visible = typeof limit === 'number' ? skills.slice(0, limit) : skills
    const hiddenCount = skills.length - visible.length

    return (
        <ul className="chip-list" aria-label={ariaLabel}>
            {visible.map((skill) => {
                const isMatched = matchedSet.has(skill)
                const isMissing = missingSet.has(skill)
                const className = `chip${isMatched ? ' chip-matched' : ''}${isMissing ? ' chip-missing' : ''}`
                return (
                    <li key={skill}>
            <span className={className}>
              {skill}
                {isMatched && <span className="sr-only"> (you have this skill)</span>}
                {isMissing && <span className="sr-only"> (you are missing this skill)</span>}
            </span>
                    </li>
                )
            })}
            {hiddenCount > 0 && (
                <li>
                    <span className="chip chip-more">+{hiddenCount} more</span>
                </li>
            )}
        </ul>
    )
}

function getScoreTone(score) {
    if (score >= 75) return 'success'
    if (score >= 50) return 'primary'
    return 'warning'
}

// score: number from 0 to 100. compact: smaller layout for cards.
export function MatchScore({ score, compact = false }) {
    const value = Math.max(0, Math.min(100, Math.round(Number(score) || 0)))

    return (
        <div className={`match-score${compact ? ' match-score-compact' : ''}`}>
            <span className="match-score-value">{value}%</span>
            <span className="match-score-label">match</span>
            <ProgressBar value={value} label={`${value}% match`} tone={getScoreTone(value)} />
        </div>
    )
}