import { Link } from 'react-router-dom'
import { Briefcase, CalendarDays, Clock, IndianRupee, MapPin } from 'lucide-react'
import { Badge } from '../common/Indicators.jsx'
import { MatchScore, SkillList } from './SkillList.jsx'
import { SaveButton } from './TrackingControls.jsx'
import {
    formatDate,
    formatDuration,
    formatPostedDate,
    formatStipend,
    getDeadlineInfo,
    getWorkModeLabel,
} from '../../utils/formatters.js'

export function InternshipCard({ item }) {
    const { internship, matchScore, eligibility, matchedSkills, missingSkills } = item
    const deadline = getDeadlineInfo(internship.applicationDeadline)
    const hasScore = typeof matchScore === 'number'
    const hasEligibility = typeof eligibility?.eligible === 'boolean'
    const detailsPath = `/internships/${internship.id}`

    return (
        <article className="card card-interactive internship-card">
            <div className="internship-card-top">
                <div className="grow">
                    <h2 className="internship-card-title">
                        <Link to={detailsPath}>{internship.title}</Link>
                    </h2>
                    <p className="text-sm text-muted">
                        {internship.company?.name} &middot; {internship.roleCategory}
                    </p>
                </div>
                {hasScore && <MatchScore score={matchScore} compact />}
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

            <div className="stack stack-sm">
                <span className="text-xs text-subtle text-strong">Required skills</span>
                <SkillList
                    skills={internship.requiredSkills}
                    matched={matchedSkills}
                    missing={missingSkills}
                    limit={6}
                    ariaLabel={`Required skills for ${internship.title}`}
                />
            </div>

            {hasEligibility && !eligibility.eligible && Array.isArray(eligibility.reasons) && eligibility.reasons[0] && (
                <p className="text-xs text-muted">{eligibility.reasons[0]}</p>
            )}

            <div className="internship-card-footer">
                <div className="row row-wrap">
                    {hasEligibility && (
                        <Badge tone={eligibility.eligible ? 'success' : 'danger'}>
                            {eligibility.eligible ? 'Eligible' : 'Not eligible'}
                        </Badge>
                    )}
                    <Badge tone={deadline.tone === 'neutral' ? 'neutral' : deadline.tone}>{deadline.label}</Badge>
                    <span className="text-xs text-subtle">{formatPostedDate(internship.postedDate)}</span>
                </div>
                <div className="row row-wrap">
                    <SaveButton internshipId={internship.id} internshipTitle={internship.title} />
                    <Link to={detailsPath} className="btn btn-primary btn-sm">
                        View details
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