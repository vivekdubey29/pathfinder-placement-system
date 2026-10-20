import { useMemo } from 'react'
import { Award, Bookmark, Briefcase, CalendarDays, ClipboardList, ShieldCheck } from 'lucide-react'
import { StatCard } from '../components/common/Indicators.jsx'
import { PageHeader } from '../components/common/PageHeader.jsx'
import { DemoDataNotice } from '../components/common/StateViews.jsx'
import {
    EligibilityCard,
    PanelCard,
    ProfileCompleteness,
    ProfileSummaryCard,
    SkillsOverview,
} from '../components/dashboard/ProfilePanels.jsx'
import {
    QuickLinks,
    RecentActivity,
    RecentOpportunities,
    TopRecommendations,
} from '../components/dashboard/OpportunityPanels.jsx'
import { useAppState } from '../context/AppStateContext.jsx'
import { useAsync, useDocumentTitle } from '../hooks/commonHooks.js'
import { getInternships } from '../services/internshipService.js'
import { getRecommendations } from '../services/recommendationService.js'

function isEligible(item) {
    return item.eligibility?.eligible === true
}

// Tally of the engine's missing required skills across eligible listings.
// It only counts the engine's output; no matching logic is repeated here.
function getSkillGaps(recommendations) {
    const counts = new Map()
    recommendations.filter(isEligible).forEach((item) => {
        ;(item.missingSkills ?? []).forEach((skill) => counts.set(skill, (counts.get(skill) ?? 0) + 1))
    })
    return [...counts.entries()]
        .map(([skill, count]) => ({ skill, count }))
        .sort((a, b) => b.count - a.count || a.skill.localeCompare(b.skill))
        .slice(0, 6)
}

// Compact loading / error message used inside a panel.
function PanelMessage({ isLoading, error, onRetry, label }) {
    if (isLoading) {
        return (
            <div className="preview-message" role="status" aria-live="polite">
                <span className="spinner" aria-hidden="true" />
                <p className="text-sm text-muted">{label}</p>
            </div>
        )
    }
    return (
        <div className="preview-message" role="alert">
            <p className="text-sm text-muted">{error instanceof Error ? error.message : 'Something went wrong.'}</p>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
                Try again
            </button>
        </div>
    )
}

function DashboardPage() {
    useDocumentTitle('Dashboard')
    const {
        student,
        studentId,
        applications,
        applicationsStatus,
        applicationsError,
        reloadApplications,
        applicationCounts,
    } = useAppState()

    const recsQuery = useAsync(() => getRecommendations(studentId), [studentId])
    const listingsQuery = useAsync(() => getInternships(), [])

    const recommendations = useMemo(
        () => (Array.isArray(recsQuery.data?.recommendations) ? recsQuery.data.recommendations : []),
        [recsQuery.data],
    )

    const eligibilityById = useMemo(
        () => new Map(recommendations.map((item) => [item.internship.id, isEligible(item)])),
        [recommendations],
    )

    // Titles for tracker rows: listings first, with the recommendation payload as a fallback.
    const internshipsById = useMemo(() => {
        const map = new Map()
        recommendations.forEach((item) => map.set(item.internship.id, item.internship))
        ;(listingsQuery.data ?? []).forEach((internship) => map.set(internship.id, internship))
        return map
    }, [recommendations, listingsQuery.data])

    const skillGaps = useMemo(() => getSkillGaps(recommendations), [recommendations])

    const recsReady = !recsQuery.isLoading && !recsQuery.error
    const eligibleCount = recommendations.filter(isEligible).length
    const listingTotal = listingsQuery.data
        ? listingsQuery.data.length
        : recsReady
            ? recommendations.length
            : null

    const trackerReady = applicationsStatus === 'ready'
    const trackerValue = (value) => (trackerReady ? value : '\u2013')

    const eligibilitySummary = recsQuery.isLoading
        ? { status: 'loading' }
        : recsQuery.error
            ? { status: 'error' }
            : { status: 'ready', eligible: eligibleCount, total: recommendations.length }

    const gapStatus = recsQuery.isLoading ? 'loading' : recsQuery.error ? 'error' : 'ready'
    const firstName = String(student.fullName ?? '').trim().split(/\s+/)[0] || 'there'

    let topRecommendations
    if (recsReady) {
        topRecommendations = <TopRecommendations items={recommendations} engine={recsQuery.data.engine} />
    } else {
        topRecommendations = (
            <PanelCard id="top-recommendations-title" title="Top recommendations">
                <PanelMessage
                    isLoading={recsQuery.isLoading}
                    error={recsQuery.error}
                    onRetry={recsQuery.reload}
                    label="Calculating recommendations…"
                />
            </PanelCard>
        )
    }

    let recentActivity
    if (applicationsStatus === 'ready') {
        recentActivity = <RecentActivity records={applications} internshipsById={internshipsById} />
    } else {
        recentActivity = (
            <PanelCard id="recent-activity-title" title="Recent tracker activity">
                <PanelMessage
                    isLoading={applicationsStatus === 'loading'}
                    error={applicationsError}
                    onRetry={reloadApplications}
                    label="Loading your tracker…"
                />
            </PanelCard>
        )
    }

    let recentOpportunities
    if (listingsQuery.data) {
        recentOpportunities = (
            <RecentOpportunities internships={listingsQuery.data} eligibilityById={eligibilityById} />
        )
    } else {
        recentOpportunities = (
            <PanelCard id="recent-opportunities-title" title="Recently added opportunities">
                <PanelMessage
                    isLoading={listingsQuery.isLoading}
                    error={listingsQuery.error}
                    onRetry={listingsQuery.reload}
                    label="Loading listings…"
                />
            </PanelCard>
        )
    }

    return (
        <div className="stack stack-lg">
            <PageHeader
                title={`Welcome back, ${firstName}`}
                description="A summary of your internship search: opportunities, eligibility and the application statuses you have recorded."
            />
            <DemoDataNotice />

            <QuickLinks />

            <section aria-label="Summary statistics">
                <div className="dashboard-stats">
                    <StatCard
                        icon={Briefcase}
                        label="Available opportunities"
                        value={listingTotal ?? '\u2013'}
                        help="Demonstration listings"
                        to="/internships"
                    />
                    <StatCard
                        icon={ShieldCheck}
                        label="Eligible for you"
                        value={recsReady ? eligibleCount : '\u2013'}
                        help="Meet CGPA, degree and year rules"
                        to="/recommendations"
                    />
                    <StatCard
                        icon={Bookmark}
                        label="Saved internships"
                        value={trackerValue(applicationCounts.saved)}
                        help="Bookmarks, not applications"
                        to="/applications"
                    />
                    <StatCard
                        icon={ClipboardList}
                        label="Applications recorded"
                        value={trackerValue(applicationCounts.trackedApplications)}
                        help={
                            trackerReady
                                ? `Includes ${applicationCounts.byStatus.REJECTED} rejected`
                                : 'Tracker not loaded'
                        }
                        to="/applications"
                    />
                    <StatCard
                        icon={CalendarDays}
                        label="Interviews"
                        value={trackerValue(applicationCounts.byStatus.INTERVIEW)}
                        help="Status you recorded"
                        to="/applications"
                    />
                    <StatCard
                        icon={Award}
                        label="Offers"
                        value={trackerValue(applicationCounts.byStatus.OFFERED)}
                        help="Status you recorded"
                        to="/applications"
                    />
                </div>
            </section>

            <div className="dashboard-layout">
                <div className="dashboard-main">
                    {topRecommendations}
                    {recentActivity}
                    {recentOpportunities}
                </div>
                <div className="dashboard-aside">
                    <ProfileSummaryCard student={student} />
                    <ProfileCompleteness student={student} />
                    <EligibilityCard student={student} summary={eligibilitySummary} />
                    <SkillsOverview
                        skills={student.skills}
                        gaps={recsReady ? skillGaps : null}
                        gapStatus={gapStatus}
                    />
                </div>
            </div>
        </div>
    )
}

export default DashboardPage