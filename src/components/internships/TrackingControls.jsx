import { useState } from 'react'
import { Bookmark, BookmarkCheck, ClipboardCheck, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '../common/ConfirmDialog.jsx'
import { FormField } from '../common/FormField.jsx'
import { StatusBadge } from '../common/Indicators.jsx'
import { useAppState } from '../../context/AppStateContext.jsx'
import { APPLICATION_STATUSES, formatDate, getStatusLabel } from '../../utils/formatters.js'

// Bookmark toggle. Creates or removes a SAVED record only.
// If the internship is already tracked beyond SAVED, it shows that status instead,
// so a click can never delete application history.
export function SaveButton({ internshipId, internshipTitle = 'this internship', size = 'sm' }) {
    const { applicationsStatus, getApplicationForInternship, isBusy, toggleSaved } = useAppState()
    const record = getApplicationForInternship(internshipId)

    if (record && record.status !== 'SAVED') {
        return (
            <span className="tracked-note">
        <span className="text-xs text-subtle">Tracked as</span>
        <StatusBadge status={record.status} />
      </span>
        )
    }

    const isSaved = record?.status === 'SAVED'
    const disabled = isBusy(internshipId) || applicationsStatus !== 'ready'
    const Icon = isSaved ? BookmarkCheck : Bookmark

    return (
        <button
            type="button"
            className={`btn btn-secondary${size === 'sm' ? ' btn-sm' : ''}`}
            aria-pressed={isSaved}
            aria-label={`Save ${internshipTitle} to your tracker`}
            disabled={disabled}
            onClick={() => toggleSaved(internshipId)}
        >
            <Icon size={16} aria-hidden="true" />
            {isSaved ? 'Saved' : 'Save'}
        </button>
    )
}

// Details-page controls. `internship` is a full Internship object.
// Recording a status only updates the student's own tracker; nothing is sent to a company.
export function TrackingControls({ internship }) {
    const {
        applicationsStatus,
        getApplicationForInternship,
        isBusy,
        trackInternship,
        updateApplicationRecord,
        removeApplication,
    } = useAppState()
    const [confirmOpen, setConfirmOpen] = useState(false)

    if (applicationsStatus === 'loading') {
        return <p className="text-sm text-muted">Loading your tracker&hellip;</p>
    }
    if (applicationsStatus === 'error') {
        return (
            <p className="text-sm text-muted">
                Your tracker is unavailable right now, so saving and tracking are disabled. Use the retry button
                at the top of the page.
            </p>
        )
    }

    const record = getApplicationForInternship(internship.id)
    const busy = isBusy(internship.id) || (record ? isBusy(record.id) : false)
    const canMarkApplied = !record || record.status === 'SAVED'

    function handleStatusChange(event) {
        updateApplicationRecord(record.id, { status: event.target.value })
    }

    async function handleRemove() {
        await removeApplication(record.id)
        setConfirmOpen(false)
    }

    return (
        <div className="stack">
            <div className="row row-wrap">
                <SaveButton internshipId={internship.id} internshipTitle={internship.title} size="md" />
                {canMarkApplied && (
                    <button
                        type="button"
                        className="btn btn-primary"
                        disabled={busy}
                        onClick={() => trackInternship(internship.id, 'APPLIED')}
                    >
                        <ClipboardCheck size={16} aria-hidden="true" />
                        Mark as applied
                    </button>
                )}
            </div>

            {record && (
                <div className="tracking-panel stack stack-sm">
                    <div className="row row-wrap">
                        <span className="text-sm text-strong">Current status</span>
                        <StatusBadge status={record.status} />
                    </div>
                    <p className="text-xs text-subtle">
                        {record.status === 'SAVED'
                            ? `Saved on ${formatDate(record.trackedAt)}. This is a bookmark, not an application.`
                            : `Recorded as applied on ${formatDate(record.appliedAt)}.`}
                    </p>

                    {record.status !== 'SAVED' && (
                        <>
                            <FormField id="tracking-status" label="Update status">
                                <select
                                    className="select"
                                    value={record.status}
                                    disabled={busy}
                                    onChange={handleStatusChange}
                                >
                                    {APPLICATION_STATUSES.map((status) => (
                                        <option key={status} value={status}>
                                            {getStatusLabel(status)}
                                        </option>
                                    ))}
                                </select>
                            </FormField>
                            <div>
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    disabled={busy}
                                    onClick={() => setConfirmOpen(true)}
                                >
                                    <Trash2 size={14} aria-hidden="true" />
                                    Remove from tracker
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            <p className="text-xs text-subtle">
                Recording a status only updates your own tracker. PathFinder does not send applications to
                companies.
            </p>

            <ConfirmDialog
                open={confirmOpen}
                title="Remove from your tracker?"
                description={`This deletes your tracking record for ${internship.title} at ${internship.company?.name ?? 'this company'}, including its status history. It does not affect any company.`}
                confirmLabel="Remove"
                tone="danger"
                isBusy={busy}
                onConfirm={handleRemove}
                onCancel={() => setConfirmOpen(false)}
            />
        </div>
    )
}