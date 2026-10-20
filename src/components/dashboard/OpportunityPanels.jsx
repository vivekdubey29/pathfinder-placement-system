import { Link } from 'react-router-dom'
import { ClipboardList, Search, Sparkles, User } from 'lucide-react'
import { Badge, ProgressBar, StatusBadge } from '../common/Indicators.jsx'
import { PanelCard } from './ProfilePanels.jsx'
import {
    formatDate,
    formatPostedDate,
    getDeadlineInfo,
    getWorkModeLabel,
} from '../../utils/formatters.js'

function getScoreTone(score) {
    if (score >= 75) return 'success'
    if (score >= 50) return 'primary'
    return 'warning'
}

// items: Recommendation[] from the service (already ranked, eligible first).
// Only eligible items are shown. engine: the engine info object (optional).
export function TopRecommendations({ items, engine, limit = 5 }) {
    const eligible = items.filter((item) => item.eligibility?.eligible === true).slice(0, limit)

    return (
        <PanelCard
            id="top-recommendations-title"
            title="Top recommendations"
            action={
                <Link to="/recommendations" className="text-link text-sm">
                    View all
                </Link>
            }
        >
            {eligible.length === 0 ? (
                <p className="card-body text-sm text-muted">
                    None of the listings currently meet the eligibility criteria for this profile.
                </p>
            ) : (
                <ol className="preview-list" aria-label="Top eligible recommendations">
                    {eligible.map((item) => {
                        const matched = item.matchedSkills ?? []
                        const requiredTotal = matched.length + (item.missingSkills ?? []).length
                        const hasScore = typeof item.matchScore === 'number'
                        return (
                            <li key={item.internship.id} className="preview-item">
                <span className="rank-badge" aria-label={`Rank ${item.rank}`}>
                  {item.rank}
                </span>
                                <div className="preview-item-main">
                                    <p className="preview-item-title">
                                        <Link className="text-link" to={`/internships/${item.internship.id}`}>
                                            {item.internship.title}
                                        </Link>
                                    </p>
                                    <p className="text-sm text-muted">
                                        {item.internship.company?.name} &middot; {item.internship.location} &middot;{' '}
                                        {getWorkModeLabel(item.internship.workMode)}
                                    </p>
                                    <p className="text-xs text-subtle">
                                        {matched.length} of {requiredTotal} required skills matched
                                    </p>
                                </div>
                                {hasScore && (
                                    <div className="preview-item-score">
                                        <span className="preview-score-value">{item.matchScore}%</span>
                                        <ProgressBar
                                            value={item.matchScore}
                                            label={`${item.matchScore}% match`}
                                            tone={getScoreTone(item.matchScore)}
                                        />
                                    </div>
                                )}
                            </li>
                        )
                    })}
                </ol>
            )}
            {engine?.isPlaceholder && (
                <p className="preview-footnote text-xs text-subtle">
                    Scored by {engine.name}. This is placeholder scoring, not the final recommendation engine.
                </p>
            )}
        </PanelCard>
    )
}

// records: tracker records from shared state (newest activity first).
// internshipsById: Map of id -> Internship. Missing entries get a fallback label.
export function RecentActivity({ records, internshipsById, limit = 5 }) {
    const recent = records.slice(0, limit)

    return (
        <PanelCard
            id="recent-activity-title"
            title="Recent tracker activity"
            action={
                <Link to="/applications" className="text-link text-sm">
                    Open tracker
                </Link>
            }
        >
            {recent.length === 0 ? (
                <div className="card-body stack stack-sm">
                    <p className="text-sm text-muted">
                        Your tracker is empty. Save an internship to bookmark it, or record an application status from its details page.
                    </p>
                    <div>
                        <Link to="/internships" className="btn btn-primary btn-sm">
                            Explore internships
                        </Link>
                    </div>
                </div>
            ) : (
                <ul className="panel-list">
                    {recent.map((record) => {
                        const internship = internshipsById.get(record.internshipId)
                        return (
                            <li key={record.id} className="panel-row">
                                <div className="panel-row-main">
                                    {internship ? (
                                        <Link className="panel-row-title" to={`/internships/${internship.id}`}>
                                            {internship.title}
                                        </Link>
                                    ) : (
                                        <span className="panel-row-title">Internship {record.internshipId}</span>
                                    )}
                                    <span className="text-sm text-muted">
                    {internship?.company?.name ?? 'Listing details unavailable'}
                  </span>
                                </div>
                                <div className="panel-row-side">
                                    <StatusBadge status={record.status} />
                                    <span className="text-xs text-subtle">Updated {formatDate(record.updatedAt)}</span>
                                </div>
                            </li>
                        )
                    })}
                </ul>
            )}
        </PanelCard>
    )
}

// internships: Internship[]. eligibilityById: Map of internship id -> boolean (optional).
export function RecentOpportunities({ internships, eligibilityById, limit = 5 }) {
    const recent = [...internships]
        .sort(
            (a, b) =>
                String(b.postedDate ?? '').localeCompare(String(a.postedDate ?? '')) || a.id.localeCompare(b.id),
        )
        .slice(0, limit)

    return (
        <PanelCard
            id="recent-opportunities-title"
            title="Recently added opportunities"
            action={
                <Link to="/internships" className="text-link text-sm">
                    Explore all
                </Link>
            }
        >
            {recent.length === 0 ? (
                <p className="card-body text-sm text-muted">No listings are available.</p>
            ) : (
                <ul className="panel-list">
                    {recent.map((internship) => {
                        const deadline = getDeadlineInfo(internship.applicationDeadline)
                        const eligible = eligibilityById?.get(internship.id)
                        return (
                            <li key={internship.id} className="panel-row">
                                <div className="panel-row-main">
                                    <Link className="panel-row-title" to={`/internships/${internship.id}`}>
                                        {internship.title}
                                    </Link>
                                    <span className="text-sm text-muted">
                    {internship.company?.name} &middot; {internship.location} &middot;{' '}
                                        {getWorkModeLabel(internship.workMode)}
                  </span>
                                    <span className="text-xs text-subtle">{formatPostedDate(internship.postedDate)}</span>
                                </div>
                                <div className="panel-row-side">
                                    {typeof eligible === 'boolean' && (
                                        <Badge tone={eligible ? 'success' : 'danger'}>{eligible ? 'Eligible' : 'Not eligible'}</Badge>
                                    )}
                                    <Badge tone={deadline.tone}>{deadline.label}</Badge>
                                </div>
                            </li>
                        )
                    })}
                </ul>
            )}
        </PanelCard>
    )
}

const QUICK_LINKS = [
    { to: '/internships', icon: Search, label: 'Explore internships', text: 'Search and filter listings' },
    { to: '/recommendations', icon: Sparkles, label: 'Recommendations', text: 'Ranked matches with reasons' },
    { to: '/applications', icon: ClipboardList, label: 'Application tracker', text: 'Saved items and statuses' },
    { to: '/profile', icon: User, label: 'My profile', text: 'Update skills and preferences' },
]

export function QuickLinks() {
    return (
        <nav aria-label="Quick links">
            <ul className="quick-links">
                {QUICK_LINKS.map(({ to, icon: Icon, label, text }) => (
                    <li key={to}>
                        <Link to={to} className="card card-interactive quick-link">
              <span className="stat-icon">
                <Icon size={18} aria-hidden="true" />
              </span>
                            <span className="quick-link-label">{label}</span>
                            <span className="text-xs text-muted">{text}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    )
}