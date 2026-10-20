import { useState } from 'react'
import { Info, Sparkles } from 'lucide-react'
import { PageHeader } from '../components/common/PageHeader.jsx'
import { DemoDataNotice, EmptyState, ErrorState, LoadingState } from '../components/common/StateViews.jsx'
import { RecommendationItem } from '../components/internships/RecommendationItem.jsx'
import { useAppState } from '../context/AppStateContext.jsx'
import { useAsync, useDocumentTitle } from '../hooks/commonHooks.js'
import { getRecommendations } from '../services/recommendationService.js'

const PAGE_SIZE = 10

function isEligible(item) {
    return item.eligibility?.eligible === true
}

// Inner component so its hooks always run (the page returns early while loading).
function RecommendationsContent({ result }) {
    const [onlyEligible, setOnlyEligible] = useState(false)
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

    const all = Array.isArray(result.recommendations) ? result.recommendations : []
    const engine = result.engine

    if (all.length === 0) {
        return (
            <EmptyState
                icon={Sparkles}
                title="No recommendations yet"
                description="The recommendation source returned no results for this profile."
            />
        )
    }

    const eligibleCount = all.filter(isEligible).length
    const list = onlyEligible ? all.filter(isEligible) : all
    const visible = list.slice(0, visibleCount)
    const remaining = list.length - visible.length

    function handleToggleEligible(event) {
        setOnlyEligible(event.target.checked)
        setVisibleCount(PAGE_SIZE)
    }

    return (
        <div className="stack stack-lg">
            {engine?.isPlaceholder && (
                <div className="alert alert-info" role="note">
                    <Info size={18} aria-hidden="true" />
                    <p>
                        <strong>Placeholder scoring.</strong> These matches come from {engine.name}, a fixed
                        weighted formula used until the Spring Boot recommendation engine is connected. It is not
                        an AI model and not the final DSA engine. It ranks eligible listings first, then by match
                        score.
                    </p>
                </div>
            )}

            <div className="recommendation-controls">
                <p role="status" aria-live="polite">
                    Showing <strong>{visible.length}</strong> of {list.length} ranked internships &middot;{' '}
                    {eligibleCount} eligible
                </p>
                <label className="check-row">
                    <input type="checkbox" checked={onlyEligible} onChange={handleToggleEligible} />
                    Show only internships I am eligible for
                </label>
            </div>

            {list.length === 0 ? (
                <EmptyState
                    title="No eligible internships"
                    description="None of the listings currently meet the eligibility criteria for this profile."
                    action={
                        <button type="button" className="btn btn-primary" onClick={() => setOnlyEligible(false)}>
                            Show all recommendations
                        </button>
                    }
                />
            ) : (
                <ol className="recommendation-list">
                    {visible.map((item) => (
                        <li key={item.internship.id}>
                            <RecommendationItem item={item} />
                        </li>
                    ))}
                </ol>
            )}

            {remaining > 0 && (
                <div className="show-more">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                    >
                        Show {Math.min(PAGE_SIZE, remaining)} more
                    </button>
                </div>
            )}
        </div>
    )
}

function RecommendationsPage() {
    useDocumentTitle('Recommendations')
    const { studentId } = useAppState()
    const { data, error, isLoading, reload } = useAsync(() => getRecommendations(studentId), [studentId])

    let content
    if (isLoading) {
        content = <LoadingState label="Calculating your recommendations…" />
    } else if (error) {
        content = <ErrorState title="Could not load recommendations" error={error} onRetry={reload} />
    } else {
        content = <RecommendationsContent result={data} />
    }

    return (
        <div className="stack stack-lg">
            <PageHeader
                title="Recommendations"
                description="Internships ranked for the demo profile, with matched and missing skills and the reason behind each match."
            />
            <DemoDataNotice />
            {content}
        </div>
    )
}

export default RecommendationsPage