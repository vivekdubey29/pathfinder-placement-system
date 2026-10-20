import { Link } from 'react-router-dom'
import { APPLICATION_STATUSES, getStatusLabel } from '../../utils/formatters.js'

const BADGE_TONE_CLASSES = {
    neutral: '',
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info',
}

// tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info'
// icon: an optional Lucide icon component, e.g. icon={Clock}
export function Badge({ tone = 'neutral', icon: Icon, className = '', children }) {
    const classes = ['badge', BADGE_TONE_CLASSES[tone] ?? '', className].filter(Boolean).join(' ')
    return (
        <span className={classes}>
      {Icon && <Icon size={12} aria-hidden="true" />}
            {children}
    </span>
    )
}

// status: 'SAVED' | 'APPLIED' | 'INTERVIEW' | 'OFFERED' | 'REJECTED'
export function StatusBadge({ status }) {
    const isKnown = APPLICATION_STATUSES.includes(status)
    const className = isKnown ? `badge badge-status-${status.toLowerCase()}` : 'badge'
    return <span className={className}>{getStatusLabel(status)}</span>
}

// value: 0 to 100. label is announced by screen readers.
// tone: 'primary' | 'success' | 'warning'
export function ProgressBar({ value, label, tone = 'primary' }) {
    const percent = Math.max(0, Math.min(100, Math.round(Number(value) || 0)))
    const toneClass =
        tone === 'success' ? ' progress-bar-success' : tone === 'warning' ? ' progress-bar-warning' : ''

    return (
        <div
            className="progress"
            role="progressbar"
            aria-label={label}
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
        >
            <div className={`progress-bar${toneClass}`} style={{ width: `${percent}%` }} />
        </div>
    )
}

// A metric tile. Pass `to` to make the whole tile a link.
export function StatCard({ label, value, help, icon: Icon, to }) {
    const content = (
        <>
            <div className="stat-card-head">
                <span className="stat-label">{label}</span>
                {Icon && (
                    <span className="stat-icon">
            <Icon size={18} aria-hidden="true" />
          </span>
                )}
            </div>
            <span className="stat-value">{value}</span>
            {help && <span className="stat-help">{help}</span>}
        </>
    )

    if (to) {
        return (
            <Link to={to} className="card stat-card card-interactive">
                {content}
            </Link>
        )
    }
    return <div className="card stat-card">{content}</div>
}