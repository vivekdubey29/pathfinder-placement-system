import { Link } from 'react-router-dom'
import { Briefcase, CalendarDays, Clock, IndianRupee, MapPin } from 'lucide-react'
import { Badge } from '../common/Indicators.jsx'
import { MatchScore, SkillList } from './SkillList.jsx'
import { SaveButton } from './TrackingControls.jsx'
import {
    formatDate,
    formatDuration,
    formatStipend,
    getDeadlineInfo,
    getWorkModeLabel,
} from '../../utils/formatters.js'

function toList(value) {
    return Array.isArray(value) ? value : []
}

// item: one Recommendation from getRecommendations(). Every insight field is optional,
// so a backend that omits one simply hides that part of the card.
export function RecommendationItem({ item }) {
    const { internship, rank, matchScore, eligibility, explanation } = item
    const matched = toList(item.matchedSkills)
    const missing = toList(item.missingSkills)
    const suggested = toList(item.suggestedSkills)
    const reasons = toList(eligibility?.reasons)
    const hasEligibility = typeof eligibility?.eligible === 'boolean'
    const deadline = getDeadlineInfo(internship.applicationDeadline)
    const detailsPath = `/internships/${internship.id}`
    const titleId = `rec-title-${internship.id}`

    return (
        <article className="card card-interactive recommendation-item" aria-labelledby={titleId}>
            <div className="recommendation-top">
                {rank !== undefined && (
                    <span className="rank-badge" aria-label={`Rank ${rank}`}>
            {rank}
          </span>
                )}
                <div className="grow">
                    <h2 id={titleId} className="recommendation-title">
                        <Link to={detailsPath}>{internship.title}</Link>
                    </h2>
                    <p className="text-sm text-muted">
                        {internship.company?.name} &middot; {internship.roleCategory}
                    </p>
                </div>
                {typeof matchScore === 'number' && <MatchScore score={matchScore} compact />}
            </div>

            <ul className="internship-meta">
                <li>
                    <MapPin size={14} aria-hidden="true" />
                    {internship.location}
                </li>
                <li>
                    <Briefcase size={14} aria-hidden="true" />
                    {getWorkModeLabel(internship.workMode)}
                </li>
                <li>
                    <IndianRupee size={14} aria-hidden="true" />
                    {formatStipend(internship.stipendMonthly)}
                </li>
                <li>
                    <Clock size={14} aria-hidden="true" />
                    {formatDuration(internship.durationMonths)}
                </li>
                <li>
                    <CalendarDays size={14} aria-hidden="true" />
                    Apply by {formatDate(internship.applicationDeadline)}
                </li>
            </ul>

            {explanation && (
                <div className="recommendation-explanation">
                    <strong>Why this match: </strong>
                    {explanation}
                </div>
            )}

            <div className="skill-columns">
                <div className="stack stack-sm">
                    <span className="text-sm text-strong">Matched required skills</span>
                    {matched.length > 0 ? (
                        <SkillList
                            skills={matched}
                            matched={matched}
                            ariaLabel={`Matched required skills for ${internship.title}`}
                        />
                    ) : (
                        <p className="text-sm text-subtle">None of the required skills matched yet.</p>
                    )}
                </div>
                <div className="stack stack-sm">
                    <span className="text-sm text-strong">Missing required skills</span>
                    {missing.length > 0 ? (
                        <SkillList
                            skills={missing}
                            missing={missing}
                            ariaLabel={`Missing required skills for ${internship.title}`}
                        />
                    ) : (
                        <p className="text-sm text-subtle">You have every required skill.</p>
                    )}
                </div>
            </div>

            {suggested.length > 0 && (
                <div className="stack stack-sm">
                    <span className="text-sm text-strong">Skills worth improving</span>
                    <SkillList skills={suggested} ariaLabel={`Suggested skills to improve for ${internship.title}`} />
                </div>
            )}

            {hasEligibility && !eligibility.eligible && reasons.length > 0 && (
                <ul className="reason-list text-xs text-muted" aria-label="Why you are not eligible">
                    {reasons.map((reason) => (
                        <li key={reason}>{reason}</li>
                    ))}
                </ul>
            )}

            <div className="internship-card-footer">
                <div className="row row-wrap">
                    {hasEligibility && (
                        <Badge tone={eligibility.eligible ? 'success' : 'danger'}>
                            {eligibility.eligible ? 'Eligible' : 'Not eligible'}
                        </Badge>
                    )}
                    <Badge tone={deadline.tone}>{deadline.label}</Badge>
                </div>
                <div className="row row-wrap">
                    <SaveButton internshipId={internship.id} internshipTitle={internship.title} />
                    <Link to={detailsPath} className="btn btn-primary btn-sm">
                        View full details
                        <span className="sr-only">
              {' '}
                            for {internship.title} at {internship.company?.name}
            </span>
                    </Link>
                </div>
            </div>
        </article>
    )
}