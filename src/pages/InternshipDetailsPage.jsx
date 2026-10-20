import { Link, useParams } from 'react-router-dom'
import { Check, SearchX, X } from 'lucide-react'
import { Badge } from '../components/common/Indicators.jsx'
import { PageHeader } from '../components/common/PageHeader.jsx'
import { DemoDataNotice, EmptyState, ErrorState, LoadingState } from '../components/common/StateViews.jsx'
import { MatchScore, SkillList } from '../components/internships/SkillList.jsx'
import { TrackingControls } from '../components/internships/TrackingControls.jsx'
import { useAppState } from '../context/AppStateContext.jsx'
import { useAsync, useDocumentTitle } from '../hooks/commonHooks.js'
import { isNotFoundError } from '../services/apiClient.js'
import { getInternshipById } from '../services/internshipService.js'
import { getRecommendationForInternship } from '../services/recommendationService.js'
import {
    formatCgpa,
    formatDate,
    formatDuration,
    formatPostedDate,
    formatStipend,
    getDeadlineInfo,
    getWorkModeLabel,
} from '../utils/formatters.js'

function KeyFacts({ internship }) {
    const deadline = getDeadlineInfo(internship.applicationDeadline)

    return (
        <dl className="fact-list">
            <div className="fact">
                <dt>Location</dt>
                <dd>{internship.location}</dd>
            </div>
            <div className="fact">
                <dt>Work mode</dt>
                <dd>{getWorkModeLabel(internship.workMode)}</dd>
            </div>
            <div className="fact">
                <dt>Stipend</dt>
                <dd>{formatStipend(internship.stipendMonthly)}</dd>
            </div>
            <div className="fact">
                <dt>Duration</dt>
                <dd>{formatDuration(internship.durationMonths)}</dd>
            </div>
            <div className="fact">
                <dt>Role</dt>
                <dd>{internship.roleCategory}</dd>
            </div>
            <div className="fact">
                <dt>Posted</dt>
                <dd>{formatPostedDate(internship.postedDate)}</dd>
            </div>
            <div className="fact fact-wide">
                <dt>Application deadline</dt>
                <dd className="row row-wrap">
                    {formatDate(internship.applicationDeadline)}
                    <Badge tone={deadline.tone}>{deadline.label}</Badge>
                </dd>
            </div>
        </dl>
    )
}

function EligibilitySection({ internship, insight }) {
    const checks = insight?.eligibility?.checks

    if (Array.isArray(checks) && checks.length > 0) {
        return (
            <div className="stack">
                <div className="table-wrap">
                    <table className="table">
                        <thead>
                        <tr>
                            <th scope="col">Criterion</th>
                            <th scope="col">Required</th>
                            <th scope="col">Your profile</th>
                        </tr>
                        </thead>
                        <tbody>
                        {checks.map((check) => (
                            <tr key={check.key}>
                                <th scope="row">{check.label}</th>
                                <td>{check.requirement}</td>
                                <td>
                    <span className={`check-result ${check.passed ? 'is-passed' : 'is-failed'}`}>
                      {check.passed ? <Check size={14} aria-hidden="true" /> : <X size={14} aria-hidden="true" />}
                        <strong>{check.passed ? 'Met' : 'Not met'}</strong>
                    </span>
                                    <span className="check-detail text-xs text-muted">{check.detail}</span>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
                <Badge tone={insight.eligibility.eligible ? 'success' : 'danger'}>
                    {insight.eligibility.eligible ? 'You meet all criteria' : 'You do not meet every criterion'}
                </Badge>
            </div>
        )
    }

    const rules = internship.eligibility ?? {}
    const degrees = Array.isArray(rules.degrees) ? rules.degrees : []
    const years = Array.isArray(rules.graduationYears) ? rules.graduationYears : []

    return (
        <dl className="fact-list">
            <div className="fact">
                <dt>Minimum CGPA</dt>
                <dd>{formatCgpa(rules.minCgpa ?? 0)}</dd>
            </div>
            <div className="fact">
                <dt>Accepted degrees</dt>
                <dd>{degrees.length ? degrees.join(', ') : 'Any degree'}</dd>
            </div>
            <div className="fact">
                <dt>Graduation years</dt>
                <dd>{years.length ? years.join(', ') : 'Any year'}</dd>
            </div>
        </dl>
    )
}

function MatchPanel({ insight, isLoading, error, onRetry, isMockMode }) {
    if (isLoading) {
        return (
            <div className="row" role="status" aria-live="polite">
                <span className="spinner" aria-hidden="true" />
                <span className="text-sm text-muted">Calculating match&hellip;</span>
            </div>
        )
    }

    if (error) {
        return (
            <div className="alert alert-warning" role="alert">
                <div className="grow stack stack-sm">
          <span>
            Match insights could not be loaded: {error instanceof Error ? error.message : 'unknown error'}
          </span>
                    <div>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (!insight) {
        return <p className="text-sm text-muted">No match details are available for this internship.</p>
    }

    const suggested = Array.isArray(insight.suggestedSkills) ? insight.suggestedSkills : []
    const breakdown = Array.isArray(insight.scoreBreakdown) ? insight.scoreBreakdown : []

    return (
        <div className="stack">
            {typeof insight.matchScore === 'number' && <MatchScore score={insight.matchScore} />}
            {insight.explanation && <p className="text-sm">{insight.explanation}</p>}

            {suggested.length > 0 && (
                <div className="stack stack-sm">
                    <span className="text-sm text-strong">Skills worth improving</span>
                    <SkillList skills={suggested} missing={suggested} ariaLabel="Suggested skills to improve" />
                </div>
            )}

            {breakdown.length > 0 && (
                <details className="breakdown">
                    <summary>How the score was calculated</summary>
                    <ul className="breakdown-list">
                        {breakdown.map((factor) => (
                            <li key={factor.key}>
                                <span>{factor.label}</span>
                                <span className="text-muted">
                  {factor.earned} / {factor.weight}
                </span>
                            </li>
                        ))}
                    </ul>
                </details>
            )}

            <p className="text-xs text-subtle">
                {isMockMode
                    ? 'This score comes from the placeholder scorer used in mock mode. It is not the final recommendation engine.'
                    : 'This score was supplied by the connected backend.'}
            </p>
        </div>
    )
}

function DetailsContent({ internship, insightQuery }) {
    const { isMockMode } = useAppState()
    const insight = insightQuery.data
    const responsibilities = Array.isArray(internship.responsibilities) ? internship.responsibilities : []
    const company = internship.company ?? {}

    return (
        <div className="details-layout">
            <div className="details-main">
                <section className="card" aria-labelledby="overview-title">
                    <div className="card-header">
                        <h2 id="overview-title" className="card-title">
                            Overview
                        </h2>
                    </div>
                    <div className="card-body stack">
                        <KeyFacts internship={internship} />
                        <hr />
                        <p>{internship.description}</p>
                        {responsibilities.length > 0 && (
                            <div className="stack stack-sm">
                                <h3 className="subheading">Responsibilities</h3>
                                <ul className="bullet-list">
                                    {responsibilities.map((item) => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </section>

                <section className="card" aria-labelledby="skills-title">
                    <div className="card-header">
                        <h2 id="skills-title" className="card-title">
                            Skills
                        </h2>
                    </div>
                    <div className="card-body stack">
                        {insight && (
                            <p className="text-xs text-subtle">
                                Skills you have are highlighted green. Required skills you are missing are highlighted amber.
                            </p>
                        )}
                        <div className="stack stack-sm">
                            <h3 className="subheading">Required</h3>
                            <SkillList
                                skills={internship.requiredSkills}
                                matched={insight?.matchedSkills}
                                missing={insight?.missingSkills}
                                ariaLabel="Required skills"
                            />
                        </div>
                        <div className="stack stack-sm">
                            <h3 className="subheading">Preferred</h3>
                            <SkillList
                                skills={internship.preferredSkills}
                                matched={insight?.matchedPreferredSkills}
                                ariaLabel="Preferred skills"
                            />
                        </div>
                    </div>
                </section>

                <section className="card" aria-labelledby="eligibility-title">
                    <div className="card-header">
                        <h2 id="eligibility-title" className="card-title">
                            Eligibility
                        </h2>
                    </div>
                    <div className="card-body">
                        <EligibilitySection internship={internship} insight={insight} />
                    </div>
                </section>

                <section className="card" aria-labelledby="company-title">
                    <div className="card-header">
                        <h2 id="company-title" className="card-title">
                            About {company.name ?? 'the company'}
                        </h2>
                    </div>
                    <div className="card-body stack">
                        <p>{company.about}</p>
                        <dl className="fact-list">
                            <div className="fact">
                                <dt>Industry</dt>
                                <dd>{company.industry ?? '-'}</dd>
                            </div>
                            <div className="fact">
                                <dt>Company size</dt>
                                <dd>{company.size ?? '-'}</dd>
                            </div>
                            <div className="fact">
                                <dt>Headquarters</dt>
                                <dd>{company.headquarters ?? '-'}</dd>
                            </div>
                        </dl>
                    </div>
                </section>
            </div>

            <aside className="details-aside" aria-label="Actions and match">
                <section className="card" aria-labelledby="track-title">
                    <div className="card-header">
                        <h2 id="track-title" className="card-title">
                            Save or track
                        </h2>
                    </div>
                    <div className="card-body">
                        <TrackingControls internship={internship} />
                    </div>
                </section>

                <section className="card" aria-labelledby="match-title">
                    <div className="card-header">
                        <h2 id="match-title" className="card-title">
                            Your match
                        </h2>
                    </div>
                    <div className="card-body">
                        <MatchPanel
                            insight={insight}
                            isLoading={insightQuery.isLoading}
                            error={insightQuery.error}
                            onRetry={insightQuery.reload}
                            isMockMode={isMockMode}
                        />
                    </div>
                </section>
            </aside>
        </div>
    )
}

function InternshipDetailsPage() {
    const { internshipId } = useParams()
    const { studentId } = useAppState()

    const internshipQuery = useAsync(() => getInternshipById(internshipId), [internshipId])
    const insightQuery = useAsync(
        () => getRecommendationForInternship(studentId, internshipId),
        [studentId, internshipId],
    )

    const internship = internshipQuery.data
    useDocumentTitle(internship ? `${internship.title} at ${internship.company?.name ?? ''}` : 'Internship details')

    if (internshipQuery.isLoading) {
        return <LoadingState label="Loading internship details…" />
    }

    if (internshipQuery.error) {
        if (isNotFoundError(internshipQuery.error)) {
            return (
                <EmptyState
                    icon={SearchX}
                    title="Internship not found"
                    description={`There is no internship with the id "${internshipId}". It may have been removed, or the link may be mistyped.`}
                    action={
                        <Link to="/internships" className="btn btn-primary">
                            Back to all internships
                        </Link>
                    }
                />
            )
        }
        return (
            <ErrorState
                title="Could not load this internship"
                error={internshipQuery.error}
                onRetry={internshipQuery.reload}
            />
        )
    }

    return (
        <div className="stack stack-lg">
            <PageHeader
                backTo="/internships"
                backLabel="Back to internships"
                title={internship.title}
                description={`${internship.company?.name ?? 'Company'} \u00B7 ${internship.location} \u00B7 ${getWorkModeLabel(internship.workMode)}`}
            />
            <DemoDataNotice />
            <DetailsContent internship={internship} insightQuery={insightQuery} />
        </div>
    )
}

export default InternshipDetailsPage