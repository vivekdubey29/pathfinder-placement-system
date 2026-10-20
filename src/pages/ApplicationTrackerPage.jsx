import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, Info, Search, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '../components/common/ConfirmDialog.jsx'
import { StatCard, StatusBadge } from '../components/common/Indicators.jsx'
import { PageHeader } from '../components/common/PageHeader.jsx'
import { DemoDataNotice, EmptyState, ErrorState, LoadingState } from '../components/common/StateViews.jsx'
import { useAppState } from '../context/AppStateContext.jsx'
import { useAsync, useDocumentTitle } from '../hooks/commonHooks.js'
import { getInternships } from '../services/internshipService.js'
import {
    APPLICATION_STATUSES,
    formatDate,
    getStatusLabel,
    getWorkModeLabel,
} from '../utils/formatters.js'

// One table row. The record comes from shared state; `internship` may be undefined if the
// listing lookup failed or the listing no longer exists.
function TrackerRow({ record, internship, onRemove }) {
    const { isBusy, updateApplicationRecord } = useAppState()
    const busy = isBusy(record.id) || isBusy(record.internshipId)
    const title = internship?.title ?? `Internship ${record.internshipId}`

    return (
        <tr>
            <td>
                {internship ? (
                    <Link className="tracker-title" to={`/internships/${internship.id}`}>
                        {internship.title}
                    </Link>
                ) : (
                    <span className="tracker-title">{title}</span>
                )}
                <span className="tracker-sub">
          {internship
              ? `${internship.company?.name ?? 'Company'} · ${internship.location} · ${getWorkModeLabel(internship.workMode)}`
              : 'Listing details are not available.'}
        </span>
                {record.notes && <span className="tracker-notes">Note: {record.notes}</span>}
            </td>
            <td>
                <div className="tracker-status-cell">
                    <StatusBadge status={record.status} />
                    <select
                        className="select"
                        aria-label={`Change status for ${title}`}
                        value={record.status}
                        disabled={busy}
                        onChange={(event) => updateApplicationRecord(record.id, { status: event.target.value })}
                    >
                        {APPLICATION_STATUSES.map((status) => (
                            <option key={status} value={status}>
                                {getStatusLabel(status)}
                            </option>
                        ))}
                    </select>
                </div>
            </td>
            <td>{formatDate(record.trackedAt)}</td>
            <td>{record.appliedAt ? formatDate(record.appliedAt) : 'Not applied'}</td>
            <td>{formatDate(record.updatedAt)}</td>
            <td>
                <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    aria-label={`Remove ${title} from tracker`}
                    disabled={busy}
                    onClick={() => onRemove(record.id)}
                >
                    <Trash2 size={14} aria-hidden="true" />
                    Remove
                </button>
            </td>
        </tr>
    )
}

function ApplicationTrackerPage() {
    useDocumentTitle('Application tracker')
    const {
        applications,
        applicationsStatus,
        applicationsError,
        reloadApplications,
        applicationCounts,
        removeApplication,
        isBusy,
        isMockMode,
    } = useAppState()

    // The tracker records live in shared state. The listings are only needed for titles.
    const listingsQuery = useAsync(() => getInternships(), [])
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [pendingRemovalId, setPendingRemovalId] = useState(null)

    const internshipsById = useMemo(
        () => new Map((listingsQuery.data ?? []).map((internship) => [internship.id, internship])),
        [listingsQuery.data],
    )

    const pendingRecord = applications.find((record) => record.id === pendingRemovalId) ?? null
    const pendingInternship = pendingRecord ? internshipsById.get(pendingRecord.internshipId) : null
    const pendingBusy = pendingRecord ? isBusy(pendingRecord.id) || isBusy(pendingRecord.internshipId) : false

    async function handleConfirmRemoval() {
        if (!pendingRecord) return
        const removed = await removeApplication(pendingRecord.id)
        if (removed) setPendingRemovalId(null)
    }

    const visibleRecords =
        statusFilter === 'ALL' ? applications : applications.filter((record) => record.status === statusFilter)

    let content
    if (applicationsStatus === 'loading') {
        content = <LoadingState label="Loading your tracker…" />
    } else if (applicationsStatus === 'error') {
        content = (
            <ErrorState
                title="Could not load your tracker"
                error={applicationsError}
                onRetry={reloadApplications}
            />
        )
    } else if (applications.length === 0) {
        content = (
            <EmptyState
                icon={ClipboardList}
                title="Nothing in your tracker yet"
                description="Save an internship to bookmark it, or record an application status from an internship's details page."
                action={
                    <div className="row row-wrap">
                        <Link to="/internships" className="btn btn-primary">
                            Explore internships
                        </Link>
                        <Link to="/recommendations" className="btn btn-secondary">
                            View recommendations
                        </Link>
                    </div>
                }
            />
        )
    } else if (listingsQuery.isLoading) {
        content = <LoadingState label="Loading internship details…" />
    } else {
        content = (
            <div className="stack stack-lg">
                {listingsQuery.error && (
                    <div className="alert alert-warning" role="alert">
                        <div className="grow stack stack-sm">
              <span>
                Internship titles could not be loaded
                  {listingsQuery.error instanceof Error ? `: ${listingsQuery.error.message}` : '.'} Your
                records are still shown below.
              </span>
                            <div>
                                <button type="button" className="btn btn-secondary btn-sm" onClick={listingsQuery.reload}>
                                    Retry
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="tracker-stats">
                    <StatCard
                        label="Tracked in total"
                        value={applicationCounts.total}
                        help="Saved bookmarks plus recorded applications"
                    />
                    <StatCard
                        label="Saved (not applied)"
                        value={applicationCounts.saved}
                        help="Bookmarks only"
                    />
                    <StatCard
                        label="Applications recorded"
                        value={applicationCounts.trackedApplications}
                        help="Applied, Interview, Offered or Rejected"
                    />
                </div>

                <div className="status-filter" role="group" aria-label="Filter by status">
                    <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        aria-pressed={statusFilter === 'ALL'}
                        onClick={() => setStatusFilter('ALL')}
                    >
                        All ({applicationCounts.total})
                    </button>
                    {APPLICATION_STATUSES.map((status) => (
                        <button
                            key={status}
                            type="button"
                            className="btn btn-secondary btn-sm"
                            aria-pressed={statusFilter === status}
                            onClick={() => setStatusFilter(status)}
                        >
                            {getStatusLabel(status)} ({applicationCounts.byStatus[status] ?? 0})
                        </button>
                    ))}
                </div>

                <p role="status" aria-live="polite" className="text-sm text-muted">
                    Showing {visibleRecords.length} of {applications.length} tracked internships
                    {statusFilter !== 'ALL' ? ` with status ${getStatusLabel(statusFilter)}` : ''}.
                </p>

                {visibleRecords.length === 0 ? (
                    <EmptyState
                        icon={Search}
                        title={`No ${getStatusLabel(statusFilter).toLowerCase()} internships`}
                        description="Nothing in your tracker has this status right now."
                        action={
                            <button type="button" className="btn btn-primary" onClick={() => setStatusFilter('ALL')}>
                                Show all
                            </button>
                        }
                    />
                ) : (
                    <div className="table-wrap">
                        <table className="table tracker-table">
                            <caption className="sr-only">Internships in your application tracker</caption>
                            <thead>
                            <tr>
                                <th scope="col">Internship</th>
                                <th scope="col">Status</th>
                                <th scope="col">Added to tracker</th>
                                <th scope="col">Applied on</th>
                                <th scope="col">Last updated</th>
                                <th scope="col">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                            </thead>
                            <tbody>
                            {visibleRecords.map((record) => (
                                <TrackerRow
                                    key={record.id}
                                    record={record}
                                    internship={internshipsById.get(record.internshipId)}
                                    onRemove={setPendingRemovalId}
                                />
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="stack stack-lg">
            <PageHeader
                title="Application tracker"
                description="Keep track of the internships you have saved and the application statuses you have recorded."
                actions={
                    <Link to="/internships" className="btn btn-secondary">
                        Explore internships
                    </Link>
                }
            />
            <DemoDataNotice />

            <div className="alert alert-info" role="note">
                <Info size={18} aria-hidden="true" />
                <p>
                    <strong>Saved</strong> means bookmarked only. <strong>Applied</strong> and later statuses are
                    ones you recorded yourself. Changing a status only updates your own tracker
                    {isMockMode ? ', which is stored in this browser' : ''}; PathFinder never submits an
                    application to any company. Choosing Saved turns a record back into a bookmark and clears its
                    applied date.
                </p>
            </div>

            {content}

            <ConfirmDialog
                open={pendingRecord !== null}
                title="Remove from your tracker?"
                description={
                    pendingRecord
                        ? `This deletes your tracking record for ${pendingInternship?.title ?? pendingRecord.internshipId}${
                            pendingInternship?.company?.name ? ` at ${pendingInternship.company.name}` : ''
                        }, including its status. It does not affect any company.`
                        : ''
                }
                confirmLabel="Remove"
                tone="danger"
                isBusy={pendingBusy}
                onConfirm={handleConfirmRemoval}
                onCancel={() => setPendingRemovalId(null)}
            />
        </div>
    )
}

export default ApplicationTrackerPage