import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { USE_MOCK_API } from '../services/apiClient.js'
import {
    DEMO_STUDENT_ID,
    getStudentProfile,
    resetDemoData,
    updateStudentProfile,
} from '../services/profileService.js'
import {
    createApplication,
    deleteApplication,
    getApplications,
    updateApplication,
} from '../services/applicationService.js'
import { APPLICATION_STATUSES, getStatusLabel } from '../utils/formatters.js'

// Shared state for the whole app: the demo student's profile, their application
// records, and toast notifications. All data access goes through the services,
// so switching to the Spring Boot API later does not change this file.
//
// There is no login. STUDENT_ID is a fixed demonstration identity.

const AppStateContext = createContext(null)

const STUDENT_ID = DEMO_STUDENT_ID
const TOAST_LIMIT = 4
const TOAST_DURATION_MS = 5000
const ERROR_TOAST_DURATION_MS = 8000

function describeError(error, fallback) {
    return error instanceof Error && error.message ? error.message : fallback
}

// Newest activity first; id as a tie-breaker (same order the service uses).
function sortByLatestUpdate(records) {
    return [...records].sort(
        (a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)) || a.id.localeCompare(b.id),
    )
}

function replaceRecord(records, record) {
    return sortByLatestUpdate([...records.filter((item) => item.id !== record.id), record])
}

function statusMessage(status) {
    if (status === 'SAVED') return 'Saved to your tracker.'
    if (status === 'APPLIED') {
        return 'Marked as applied in your tracker. PathFinder does not submit applications to companies.'
    }
    return `Status updated to ${getStatusLabel(status)}.`
}

export function AppStateProvider({ children }) {
    const [student, setStudent] = useState(null)
    const [profileStatus, setProfileStatus] = useState('loading') // 'loading' | 'ready' | 'error'
    const [profileError, setProfileError] = useState(null)

    const [applications, setApplications] = useState([])
    const [applicationsStatus, setApplicationsStatus] = useState('loading')
    const [applicationsError, setApplicationsError] = useState(null)

    const [busyIds, setBusyIds] = useState([])
    const [toasts, setToasts] = useState([])

    const isMounted = useRef(true)
    const toastTimers = useRef(new Map())
    const nextToastId = useRef(1)

    // ---------- Mount tracking and timer cleanup ----------

    useEffect(() => {
        isMounted.current = true
        const timers = toastTimers.current
        return () => {
            isMounted.current = false
            timers.forEach((timer) => clearTimeout(timer))
            timers.clear()
        }
    }, [])

    // ---------- Toasts ----------

    const dismissToast = useCallback((id) => {
        const timer = toastTimers.current.get(id)
        if (timer) {
            clearTimeout(timer)
            toastTimers.current.delete(id)
        }
        setToasts((current) => current.filter((toast) => toast.id !== id))
    }, [])

    // type: 'success' | 'error' | 'info'
    const showToast = useCallback(
        (message, type = 'info') => {
            const id = nextToastId.current
            nextToastId.current += 1
            setToasts((current) => [...current.slice(-(TOAST_LIMIT - 1)), { id, type, message }])
            const duration = type === 'error' ? ERROR_TOAST_DURATION_MS : TOAST_DURATION_MS
            toastTimers.current.set(
                id,
                setTimeout(() => dismissToast(id), duration),
            )
            return id
        },
        [dismissToast],
    )

    // ---------- Loading ----------

    const loadProfile = useCallback(async () => {
        setProfileStatus('loading')
        setProfileError(null)
        try {
            const loaded = await getStudentProfile(STUDENT_ID)
            if (!isMounted.current) return
            setStudent(loaded)
            setProfileStatus('ready')
        } catch (error) {
            if (!isMounted.current) return
            setProfileError(error)
            setProfileStatus('error')
        }
    }, [])

    const loadApplications = useCallback(async () => {
        setApplicationsStatus('loading')
        setApplicationsError(null)
        try {
            const loaded = await getApplications(STUDENT_ID)
            if (!isMounted.current) return
            setApplications(sortByLatestUpdate(loaded))
            setApplicationsStatus('ready')
        } catch (error) {
            if (!isMounted.current) return
            setApplicationsError(error)
            setApplicationsStatus('error')
        }
    }, [])

    useEffect(() => {
        loadProfile()
        loadApplications()
    }, [loadProfile, loadApplications])

    // ---------- Profile ----------

    // Rethrows on failure so the Profile page can show field errors from error.details.
    const saveProfile = useCallback(async (values) => {
        const saved = await updateStudentProfile(STUDENT_ID, values)
        if (isMounted.current) {
            setStudent(saved)
            setProfileStatus('ready')
            setProfileError(null)
        }
        return saved
    }, [])

    // Mock mode only. Clears saved profile edits and tracker changes, then reloads both.
    const resetDemo = useCallback(async () => {
        if (!USE_MOCK_API) {
            showToast('Reset is only available in mock mode.', 'error')
            return false
        }
        try {
            await resetDemoData()
            await Promise.all([loadProfile(), loadApplications()])
            showToast('Demo data restored to its original state.', 'success')
            return true
        } catch (error) {
            showToast(describeError(error, 'Could not reset the demo data.'), 'error')
            return false
        }
    }, [loadApplications, loadProfile, showToast])

    // ---------- Applications: derived data ----------

    const applicationsByInternshipId = useMemo(() => {
        const map = new Map()
        applications.forEach((record) => map.set(record.internshipId, record))
        return map
    }, [applications])

    // saved: records still at SAVED (bookmarks, not applications).
    // trackedApplications: everything else (APPLIED, INTERVIEW, OFFERED, REJECTED).
    const applicationCounts = useMemo(() => {
        const byStatus = {}
        APPLICATION_STATUSES.forEach((status) => {
            byStatus[status] = 0
        })
        applications.forEach((record) => {
            if (byStatus[record.status] !== undefined) byStatus[record.status] += 1
        })
        return {
            total: applications.length,
            saved: byStatus.SAVED,
            trackedApplications: applications.length - byStatus.SAVED,
            byStatus,
        }
    }, [applications])

    const getApplicationForInternship = useCallback(
        (internshipId) => applicationsByInternshipId.get(internshipId) ?? null,
        [applicationsByInternshipId],
    )

    const isBusy = useCallback((id) => busyIds.includes(id), [busyIds])

    // ---------- Applications: actions ----------

    // Marks ids as busy while an async action runs, so buttons can disable themselves.
    const runMutation = useCallback(async (keys, action) => {
        setBusyIds((current) => [...current, ...keys])
        try {
            return await action()
        } finally {
            if (isMounted.current) {
                setBusyIds((current) => {
                    const next = [...current]
                    keys.forEach((key) => {
                        const position = next.indexOf(key)
                        if (position !== -1) next.splice(position, 1)
                    })
                    return next
                })
            }
        }
    }, [])

    // Bookmark button: creates a SAVED record, or removes an existing SAVED record.
    const toggleSaved = useCallback(
        async (internshipId) => {
            if (busyIds.includes(internshipId)) return false
            const existing = applications.find((record) => record.internshipId === internshipId)

            if (existing && existing.status !== 'SAVED') {
                showToast(
                    `This internship is already tracked as "${getStatusLabel(existing.status)}". Change or remove it in the Application Tracker.`,
                    'info',
                )
                return false
            }

            return runMutation([internshipId], async () => {
                try {
                    if (existing) {
                        await deleteApplication(existing.id)
                        setApplications((current) => current.filter((record) => record.id !== existing.id))
                        showToast('Removed from your saved internships.', 'success')
                        return true
                    }
                    const created = await createApplication({
                        studentId: STUDENT_ID,
                        internshipId,
                        status: 'SAVED',
                    })
                    setApplications((current) => replaceRecord(current, created))
                    showToast('Saved. This is a bookmark in your tracker; nothing was sent to the company.', 'success')
                    return true
                } catch (error) {
                    showToast(describeError(error, 'Could not update your saved internships.'), 'error')
                    return false
                }
            })
        },
        [applications, busyIds, runMutation, showToast],
    )

    // Creates a record with the given status, or moves the existing record to it.
    const trackInternship = useCallback(
        async (internshipId, status = 'APPLIED') => {
            if (busyIds.includes(internshipId)) return false
            const existing = applications.find((record) => record.internshipId === internshipId)

            if (existing && existing.status === status) {
                showToast(`Already marked as ${getStatusLabel(status)}.`, 'info')
                return false
            }

            const keys = existing ? [internshipId, existing.id] : [internshipId]
            return runMutation(keys, async () => {
                try {
                    const record = existing
                        ? await updateApplication(existing.id, { status })
                        : await createApplication({ studentId: STUDENT_ID, internshipId, status })
                    setApplications((current) => replaceRecord(current, record))
                    showToast(statusMessage(status), 'success')
                    return true
                } catch (error) {
                    showToast(describeError(error, 'Could not update your tracker.'), 'error')
                    return false
                }
            })
        },
        [applications, busyIds, runMutation, showToast],
    )

    // changes: { status?, notes? }. Used by the tracker's status dropdown and notes field.
    const updateApplicationRecord = useCallback(
        async (applicationId, changes) => {
            const existing = applications.find((record) => record.id === applicationId)
            const keys = existing ? [applicationId, existing.internshipId] : [applicationId]
            if (keys.some((key) => busyIds.includes(key))) return false

            return runMutation(keys, async () => {
                try {
                    const record = await updateApplication(applicationId, changes)
                    setApplications((current) => replaceRecord(current, record))
                    showToast(
                        changes.status !== undefined ? statusMessage(changes.status) : 'Notes saved.',
                        'success',
                    )
                    return true
                } catch (error) {
                    showToast(describeError(error, 'Could not update this record.'), 'error')
                    return false
                }
            })
        },
        [applications, busyIds, runMutation, showToast],
    )

    // Removes any record (saved or applied). Pages should confirm first with ConfirmDialog.
    const removeApplication = useCallback(
        async (applicationId) => {
            const existing = applications.find((record) => record.id === applicationId)
            const keys = existing ? [applicationId, existing.internshipId] : [applicationId]
            if (keys.some((key) => busyIds.includes(key))) return false

            return runMutation(keys, async () => {
                try {
                    await deleteApplication(applicationId)
                    setApplications((current) => current.filter((record) => record.id !== applicationId))
                    showToast('Removed from your tracker.', 'success')
                    return true
                } catch (error) {
                    showToast(describeError(error, 'Could not remove this record.'), 'error')
                    return false
                }
            })
        },
        [applications, busyIds, runMutation, showToast],
    )

    const value = useMemo(
        () => ({
            studentId: STUDENT_ID,
            isMockMode: USE_MOCK_API,

            student,
            profileStatus,
            profileError,
            reloadProfile: loadProfile,
            saveProfile,
            resetDemo,

            applications,
            applicationsStatus,
            applicationsError,
            reloadApplications: loadApplications,
            applicationCounts,
            getApplicationForInternship,
            isBusy,
            toggleSaved,
            trackInternship,
            updateApplicationRecord,
            removeApplication,

            toasts,
            showToast,
            dismissToast,
        }),
        [
            student,
            profileStatus,
            profileError,
            loadProfile,
            saveProfile,
            resetDemo,
            applications,
            applicationsStatus,
            applicationsError,
            loadApplications,
            applicationCounts,
            getApplicationForInternship,
            isBusy,
            toggleSaved,
            trackInternship,
            updateApplicationRecord,
            removeApplication,
            toasts,
            showToast,
            dismissToast,
        ],
    )

    return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState() {
    const value = useContext(AppStateContext)
    if (value === null) {
        throw new Error('useAppState must be used inside <AppStateProvider>.')
    }
    return value
}