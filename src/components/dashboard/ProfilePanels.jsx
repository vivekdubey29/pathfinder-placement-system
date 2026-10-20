import { Link } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import { Badge, ProgressBar } from '../common/Indicators.jsx'
import { formatCgpa, getWorkModeLabel } from '../../utils/formatters.js'
import { getProfileCompleteness } from '../../utils/matchingUtils.js'

function getInitials(name) {
    const parts = String(name ?? '').trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return '?'
    const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
    return `${parts[0][0]}${last}`.toUpperCase()
}

function joinOrDash(list) {
    return Array.isArray(list) && list.length > 0 ? list.join(', ') : '-'
}

// Shared card wrapper used by the panels in this file, OpportunityPanels.jsx and the dashboard.
// Children supply their own padding (for example a .card-body wrapper).
export function PanelCard({ id, title, action, children }) {
    return (
        <section className="card" aria-labelledby={id}>
            <div className="card-header">
                <h2 id={id} className="card-title">
                    {title}
                </h2>
                {action}
            </div>
            {children}
        </section>
    )
}

// student: the Student object from shared state.
export function ProfileSummaryCard({ student }) {
    return (
        <PanelCard
            id="profile-summary-title"
            title="Profile summary"
            action={
                <Link to="/profile" className="btn btn-ghost btn-sm">
                    <Pencil size={14} aria-hidden="true" />
                    Edit
                </Link>
            }
        >
            <div className="card-body stack">
                <div className="row">
          <span className="avatar" aria-hidden="true">
            {getInitials(student.fullName)}
          </span>
                    <div className="grow">
                        <p className="text-strong">{student.fullName}</p>
                        <p className="text-sm text-muted">{student.email}</p>
                    </div>
                </div>
                <dl className="summary-list">
                    <div>
                        <dt>College</dt>
                        <dd>{student.college || '-'}</dd>
                    </div>
                    <div>
                        <dt>Degree</dt>
                        <dd>
                            {student.degree || '-'}, class of {student.graduationYear || '-'}
                        </dd>
                    </div>
                    <div>
                        <dt>Preferred roles</dt>
                        <dd>{joinOrDash(student.preferredRoles)}</dd>
                    </div>
                    <div>
                        <dt>Preferred locations</dt>
                        <dd>{joinOrDash(student.preferredLocations)}</dd>
                    </div>
                    <div>
                        <dt>Work mode</dt>
                        <dd>{getWorkModeLabel(student.workModePreference)}</dd>
                    </div>
                </dl>
            </div>
        </PanelCard>
    )
}

// summary: { status: 'loading' | 'error' | 'ready', eligible?: number, total?: number }
// The counts come from the recommendation service's eligibility checks.
export function EligibilityCard({ student, summary }) {
    let eligibilityBody
    if (summary.status === 'loading') {
        eligibilityBody = <p className="text-sm text-muted">Checking eligibility&hellip;</p>
    } else if (summary.status === 'error') {
        eligibilityBody = (
            <p className="text-sm text-muted">Eligibility counts are unavailable because recommendations could not be loaded.</p>
        )
    } else {
        const percent = summary.total > 0 ? Math.round((summary.eligible / summary.total) * 100) : 0
        eligibilityBody = (
            <div className="stack stack-sm">
                <p>
                    <strong>{summary.eligible}</strong> of {summary.total} listings meet the CGPA, degree and
                    graduation-year rules for your profile.
                </p>
                <ProgressBar value={percent} label={`${summary.eligible} of ${summary.total} listings eligible`} tone="success" />
            </div>
        )
    }

    return (
        <PanelCard id="eligibility-summary-title" title="Academic eligibility">
            <div className="card-body stack">
                <dl className="summary-list">
                    <div>
                        <dt>CGPA</dt>
                        <dd>{formatCgpa(student.cgpa)}</dd>
                    </div>
                    <div>
                        <dt>Degree</dt>
                        <dd>{student.degree || '-'}</dd>
                    </div>
                    <div>
                        <dt>Graduation year</dt>
                        <dd>{student.graduationYear || '-'}</dd>
                    </div>
                </dl>
                {eligibilityBody}
            </div>
        </PanelCard>
    )
}

// skills: string[]. gaps: [{ skill, count }] or null while loading.
// gapStatus: 'loading' | 'error' | 'ready'
export function SkillsOverview({ skills, gaps, gapStatus }) {
    const list = Array.isArray(skills) ? skills : []

    let gapBody
    if (gapStatus === 'loading') {
        gapBody = <p className="text-sm text-muted">Analysing listings&hellip;</p>
    } else if (gapStatus === 'error') {
        gapBody = <p className="text-sm text-muted">Skill gaps are unavailable right now.</p>
    } else if (!gaps || gaps.length === 0) {
        gapBody = <p className="text-sm text-muted">No missing required skills across your eligible listings.</p>
    } else {
        gapBody = (
            <ul className="gap-list" aria-label="Skills missing most often">
                {gaps.map(({ skill, count }) => (
                    <li key={skill}>
                        <span className="chip chip-missing">{skill}</span>
                        <span className="text-xs text-muted">
              missing in {count} eligible {count === 1 ? 'listing' : 'listings'}
            </span>
                    </li>
                ))}
            </ul>
        )
    }

    return (
        <PanelCard id="skills-overview-title" title="Skills overview">
            <div className="card-body stack">
                <div className="stack stack-sm">
                    <span className="text-sm text-strong">Your skills ({list.length})</span>
                    {list.length > 0 ? (
                        <ul className="chip-list" aria-label="Your skills">
                            {list.map((skill) => (
                                <li key={skill}>
                                    <span className="chip">{skill}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted">No skills added yet.</p>
                    )}
                </div>
                <div className="stack stack-sm">
                    <span className="text-sm text-strong">Skills missing most often</span>
                    {gapBody}
                </div>
            </div>
        </PanelCard>
    )
}

// Reads the SAVED profile. showLink adds a link to the profile page when items are missing.
export function ProfileCompleteness({ student, showLink = true }) {
    const { percent, completed, total, missingItems } = getProfileCompleteness(student)
    const tone = percent >= 100 ? 'success' : percent >= 70 ? 'primary' : 'warning'

    return (
        <PanelCard
            id="completeness-title"
            title="Profile completeness"
            action={<Badge tone={percent >= 100 ? 'success' : 'neutral'}>{percent}%</Badge>}
        >
            <div className="card-body stack">
                <ProgressBar value={percent} label={`Profile ${percent}% complete`} tone={tone} />
                <p className="text-sm text-muted">
                    {completed} of {total} profile items are filled in.
                </p>
                {missingItems.length > 0 ? (
                    <>
                        <ul className="bullet-list text-sm" aria-label="Missing profile items">
                            {missingItems.map((item) => (
                                <li key={item.key}>{item.label}</li>
                            ))}
                        </ul>
                        {showLink && (
                            <Link to="/profile" className="text-link text-sm">
                                Complete your profile
                            </Link>
                        )}
                    </>
                ) : (
                    <p className="text-sm">Every profile item is complete.</p>
                )}
            </div>
        </PanelCard>
    )
}