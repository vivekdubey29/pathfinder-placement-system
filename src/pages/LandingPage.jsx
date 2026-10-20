import { Link } from 'react-router-dom'
import {
    ArrowRight,
    ClipboardList,
    Lightbulb,
    ShieldCheck,
    SlidersHorizontal,
    Target,
    User,
} from 'lucide-react'
import { Badge, ProgressBar } from '../components/common/Indicators.jsx'
import { DemoDataNotice } from '../components/common/StateViews.jsx'
import { useAppState } from '../context/AppStateContext.jsx'
import { useAsync, useDocumentTitle } from '../hooks/commonHooks.js'
import { getRecommendations } from '../services/recommendationService.js'
import { getWorkModeLabel } from '../utils/formatters.js'

const FEATURES = [
    {
        icon: Target,
        title: 'Skill-based matching',
        text: 'Your skills are compared with each internship\u2019s required and preferred skills, so you can see exactly what you already cover.',
    },
    {
        icon: ShieldCheck,
        title: 'Eligibility checks',
        text: 'CGPA, degree and graduation-year rules are checked against your profile. Listings you do not qualify for are clearly marked.',
    },
    {
        icon: Lightbulb,
        title: 'Explained recommendations',
        text: 'Each match lists matched and missing skills, a short explanation, and suggested skills to improve.',
    },
    {
        icon: SlidersHorizontal,
        title: 'Search, filter and sort',
        text: 'Search by title, company or skill, then narrow by location, work mode, role, stipend and eligibility.',
    },
    {
        icon: ClipboardList,
        title: 'Application tracker',
        text: 'Keep saved internships and your own application notes in one place. Records are kept locally; nothing is sent to a company.',
    },
    {
        icon: User,
        title: 'Profile you control',
        text: 'Edit your academic details, skills and preferences at any time. Changes are stored in this browser only.',
    },
]

const STEPS = [
    {
        title: 'Complete your profile',
        text: 'Add your CGPA, skills, preferred roles, locations and work mode.',
    },
    {
        title: 'Explore internships',
        text: 'Search and filter the demonstration listings and open any one for full details.',
    },
    {
        title: 'Review ranked matches',
        text: 'See a match score, matched and missing skills, and why each internship was ranked where it is.',
    },
    {
        title: 'Track your progress',
        text: 'Save internships and record your own status, from Saved through to Offered or Rejected.',
    },
]

function getScoreTone(score) {
    if (score >= 75) return 'success'
    if (score >= 50) return 'primary'
    return 'warning'
}

function PreviewBody({ result }) {
    const recommendations = Array.isArray(result.recommendations) ? result.recommendations : []

    if (recommendations.length === 0) {
        return <p className="preview-message text-sm text-muted">No recommendations were returned.</p>
    }

    const eligibleCount = recommendations.filter((item) => item.eligibility?.eligible).length
    const topThree = recommendations.slice(0, 3)
    const engine = result.engine

    return (
        <>
            <dl className="preview-stats">
                <div className="preview-stat">
                    <dt>Listings scored</dt>
                    <dd>{recommendations.length}</dd>
                </div>
                <div className="preview-stat">
                    <dt>Eligible for you</dt>
                    <dd>{eligibleCount}</dd>
                </div>
                <div className="preview-stat">
                    <dt>Top match</dt>
                    <dd>{topThree[0].matchScore}%</dd>
                </div>
            </dl>

            <ol className="preview-list" aria-label="Top three recommendations">
                {topThree.map((item) => {
                    const matched = item.matchedSkills ?? []
                    const missing = item.missingSkills ?? []
                    const requiredTotal = matched.length + missing.length
                    const isEligible = item.eligibility?.eligible === true

                    return (
                        <li key={item.internship.id} className="preview-item">
              <span className="rank-badge" aria-label={`Rank ${item.rank}`}>
                {item.rank}
              </span>
                            <div className="preview-item-main">
                                <p className="preview-item-title">{item.internship.title}</p>
                                <p className="preview-item-company text-sm text-muted">
                                    {item.internship.company?.name} &middot; {item.internship.location} &middot;{' '}
                                    {getWorkModeLabel(item.internship.workMode)}
                                </p>
                                <p className="text-xs text-subtle">
                                    {matched.length} of {requiredTotal} required skills matched
                                </p>
                            </div>
                            <div className="preview-item-score">
                                <span className="preview-score-value">{item.matchScore}%</span>
                                <ProgressBar value={item.matchScore} label={`${item.matchScore}% match`} tone={getScoreTone(item.matchScore)} />
                                <Badge tone={isEligible ? 'success' : 'danger'}>{isEligible ? 'Eligible' : 'Not eligible'}</Badge>
                            </div>
                        </li>
                    )
                })}
            </ol>

            {engine && (
                <p className="preview-footnote text-xs text-subtle">
                    Scored by: {engine.name}.{' '}
                    {engine.isPlaceholder && 'This is placeholder scoring, not the final recommendation engine.'}
                </p>
            )}
        </>
    )
}

function RecommendationPreview() {
    const { studentId } = useAppState()
    const { data, error, isLoading, reload } = useAsync(() => getRecommendations(studentId), [studentId])

    let body
    if (isLoading) {
        body = (
            <div className="preview-message" role="status" aria-live="polite">
                <span className="spinner" aria-hidden="true" />
                <p className="text-sm text-muted">Loading preview&hellip;</p>
            </div>
        )
    } else if (error) {
        body = (
            <div className="preview-message" role="alert">
                <p className="text-sm text-muted">
                    {error instanceof Error ? error.message : 'The preview could not be loaded.'}
                </p>
                <button type="button" className="btn btn-secondary btn-sm" onClick={reload}>
                    Try again
                </button>
            </div>
        )
    } else {
        body = <PreviewBody result={data} />
    }

    return (
        <section className="card preview" aria-labelledby="preview-title">
            <div className="card-header">
                <h2 id="preview-title" className="card-title">
                    Recommendation preview
                </h2>
                <Badge tone="info">Demo profile</Badge>
            </div>
            {body}
        </section>
    )
}

function LandingPage() {
    useDocumentTitle()

    return (
        <>
            <section className="hero" aria-labelledby="hero-title">
                <div className="container hero-inner">
                    <div className="hero-copy">
                        <p className="hero-eyebrow">College DSA project &middot; demonstration</p>
                        <h1 id="hero-title" className="hero-title">
                            Find internships that fit your skills, CGPA and goals
                        </h1>
                        <p className="hero-text">
                            PathFinder compares your profile with internship requirements, checks your eligibility, and
                            explains every match, so you know where to apply and which skills to build next.
                        </p>
                        <div className="hero-actions">
                            <Link to="/internships" className="btn btn-primary btn-lg">
                                Explore Opportunities
                                <ArrowRight size={18} aria-hidden="true" />
                            </Link>
                            <Link to="/recommendations" className="btn btn-secondary btn-lg">
                                View Recommendations
                            </Link>
                        </div>
                        <p className="hero-note text-sm text-muted">
                            No sign-up needed. You will see a demonstration profile and fictional listings.
                        </p>
                    </div>

                    <RecommendationPreview />
                </div>
            </section>

            <div className="container landing-notice">
                <DemoDataNotice />
            </div>

            <section id="features" className="landing-section" aria-labelledby="features-title">
                <div className="container">
                    <div className="section-heading">
                        <h2 id="features-title">What PathFinder does</h2>
                        <p className="text-muted">
                            Everything below works in this demo. The listings and scoring are placeholders until the
                            backend is connected.
                        </p>
                    </div>
                    <ul className="feature-grid">
                        {FEATURES.map(({ icon: Icon, title, text }) => (
                            <li key={title} className="card feature-card">
                <span className="feature-icon">
                  <Icon size={20} aria-hidden="true" />
                </span>
                                <h3 className="feature-title">{title}</h3>
                                <p className="text-sm text-muted">{text}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            <section id="how-it-works" className="landing-section" aria-labelledby="how-title">
                <div className="container">
                    <div className="section-heading">
                        <h2 id="how-title">How it works</h2>
                        <p className="text-muted">Four steps from profile to tracked applications.</p>
                    </div>
                    <ol className="step-grid">
                        {STEPS.map((step, index) => (
                            <li key={step.title} className="card step-card">
                <span className="step-number" aria-hidden="true">
                  {index + 1}
                </span>
                                <h3 className="feature-title">
                                    <span className="sr-only">Step {index + 1}: </span>
                                    {step.title}
                                </h3>
                                <p className="text-sm text-muted">{step.text}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            <section className="landing-section" aria-labelledby="cta-title">
                <div className="container">
                    <div className="cta-band">
                        <div className="cta-copy">
                            <h2 id="cta-title">Take a look around the demo</h2>
                            <p>
                                Browse the fictional listings, review your matches and try tracking an application. Nothing
                                is sent to any employer.
                            </p>
                        </div>
                        <div className="cta-actions">
                            <Link to="/internships" className="btn btn-primary btn-lg">
                                Explore Opportunities
                            </Link>
                            <Link to="/recommendations" className="btn btn-secondary btn-lg">
                                View Recommendations
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}

export default LandingPage