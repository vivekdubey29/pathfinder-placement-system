import { useState } from 'react'
import { Search, ExternalLink } from 'lucide-react'
import { ExternalInternshipCard } from '../components/internships/ExternalInternshipCard.jsx'
import { InternshipCard } from '../components/internships/InternshipCard.jsx'
import { InternshipFilters } from '../components/internships/InternshipFilters.jsx'
import { PageHeader } from '../components/common/PageHeader.jsx'
import { DemoDataNotice, EmptyState, ErrorState, LoadingState } from '../components/common/StateViews.jsx'
import { useAppState } from '../context/AppStateContext.jsx'
import { useAsync, useDocumentTitle } from '../hooks/commonHooks.js'
import { useInternshipFilters } from '../hooks/useInternshipFilters.js'
import { getRecommendations } from '../services/recommendationService.js'
import { getExternalInternships } from '../services/internshipService.js'

// ---------------------------------------------------------------------------
// PathFinder tab (existing filtered/sorted list with match scores)
// ---------------------------------------------------------------------------

// Inner component so the filter hook is always called (hooks cannot sit below early returns).
function ExplorerContent({ items, engine }) {
    const {
        filters,
        setFilter,
        resetFilters,
        sort,
        setSort,
        results,
        totalCount,
        options,
        activeFilterCount,
        hasActiveFilters,
    } = useInternshipFilters(items)

    if (totalCount === 0) {
        return (
            <EmptyState
                title="No internships available"
                description="The data source returned no listings."
            />
        )
    }

    return (
        <div className="stack stack-lg">
            <InternshipFilters
                filters={filters}
                setFilter={setFilter}
                sort={sort}
                setSort={setSort}
                options={options}
                activeFilterCount={activeFilterCount}
                onReset={resetFilters}
            />

            <div className="results-bar">
                <p role="status" aria-live="polite">
                    Showing <strong>{results.length}</strong> of {totalCount} internships
                    {hasActiveFilters ? ' (filters applied)' : ''}
                </p>
                {engine?.isPlaceholder && (
                    <p className="text-xs text-subtle">
                        Match scores come from {engine.name}, which is placeholder scoring and not the final
                        recommendation engine.
                    </p>
                )}
            </div>

            {results.length === 0 ? (
                <EmptyState
                    icon={Search}
                    title="No internships match your filters"
                    description="Try a different search term, or remove some filters to see more listings."
                    action={
                        <button type="button" className="btn btn-primary" onClick={resetFilters}>
                            Clear filters
                        </button>
                    }
                />
            ) : (
                <ul className="internship-list">
                    {results.map((item) => (
                        <li key={item.internship.id}>
                            <InternshipCard item={item} />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

// ---------------------------------------------------------------------------
// Himalayas tab (live external listings)
// ---------------------------------------------------------------------------

function ExternalListingsTab() {
    const { data, error, isLoading, reload } = useAsync(() => getExternalInternships(), [])

    if (isLoading) {
        return <LoadingState label="Fetching live listings from Himalayas…" />
    }

    if (error) {
        return (
            <ErrorState
                title="Could not load live listings"
                error={error}
                onRetry={reload}
            />
        )
    }

    if (!data || data.length === 0) {
        return (
            <EmptyState
                title="No live listings available"
                description="Himalayas returned no matching internship listings at this time. Try again later."
                action={
                    <button type="button" className="btn btn-primary" onClick={reload}>
                        Retry
                    </button>
                }
            />
        )
    }

    return (
        <div className="stack stack-lg">
            {/* Disclaimer */}
            <div className="external-listings-notice">
                <p>
                    These are real, live job listings sourced from{' '}
                    <a
                        href="https://himalayas.app"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-inline"
                    >
                        Himalayas
                        <ExternalLink size={12} aria-hidden="true" style={{ display: 'inline', marginLeft: 2 }} />
                    </a>
                    . PathFinder is not affiliated with any listed employer. Eligibility is not
                    calculated for external listings.
                </p>
            </div>

            <div className="results-bar">
                <p role="status" aria-live="polite">
                    Showing <strong>{data.length}</strong> live listing{data.length !== 1 ? 's' : ''}
                </p>
            </div>

            <ul className="internship-list">
                {data.map((listing) => (
                    <li key={listing.id}>
                        <ExternalInternshipCard listing={listing} />
                    </li>
                ))}
            </ul>
        </div>
    )
}

// ---------------------------------------------------------------------------
// Page root
// ---------------------------------------------------------------------------

function InternshipExplorerPage() {
    useDocumentTitle('Explore internships')
    const { studentId } = useAppState()
    const [activeTab, setActiveTab] = useState('pathfinder')

    const { data, error, isLoading, reload } = useAsync(() => getRecommendations(studentId), [studentId])

    let pathfinderContent
    if (isLoading) {
        pathfinderContent = <LoadingState label="Loading internships…" />
    } else if (error) {
        pathfinderContent = <ErrorState title="Could not load internships" error={error} onRetry={reload} />
    } else {
        pathfinderContent = <ExplorerContent items={data.recommendations} engine={data.engine} />
    }

    return (
        <div className="stack stack-lg">
            <PageHeader
                title="Explore internships"
                description="Search and filter the listings. Match scores and eligibility are calculated for the demo profile."
            />
            <DemoDataNotice />

            {/* Tab bar */}
            <div className="explorer-tabs" role="tablist" aria-label="Internship listing source">
                <button
                    role="tab"
                    aria-selected={activeTab === 'pathfinder'}
                    aria-controls="tab-panel-pathfinder"
                    id="tab-pathfinder"
                    className={`explorer-tab${activeTab === 'pathfinder' ? ' explorer-tab--active' : ''}`}
                    onClick={() => setActiveTab('pathfinder')}
                    type="button"
                >
                    PathFinder Listings
                </button>
                <button
                    role="tab"
                    aria-selected={activeTab === 'himalayas'}
                    aria-controls="tab-panel-himalayas"
                    id="tab-himalayas"
                    className={`explorer-tab${activeTab === 'himalayas' ? ' explorer-tab--active' : ''}`}
                    onClick={() => setActiveTab('himalayas')}
                    type="button"
                >
                    Live Listings · Himalayas
                </button>
            </div>

            {/* Tab panels */}
            <div
                role="tabpanel"
                id="tab-panel-pathfinder"
                aria-labelledby="tab-pathfinder"
                hidden={activeTab !== 'pathfinder'}
            >
                {pathfinderContent}
            </div>

            <div
                role="tabpanel"
                id="tab-panel-himalayas"
                aria-labelledby="tab-himalayas"
                hidden={activeTab !== 'himalayas'}
            >
                {activeTab === 'himalayas' && <ExternalListingsTab />}
            </div>
        </div>
    )
}

export default InternshipExplorerPage
