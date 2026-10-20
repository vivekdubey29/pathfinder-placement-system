import {
    ApiError,
    USE_MOCK_API,
    apiRequest,
    cloneData,
    ensureArray,
    ensureObject,
    mockDelay,
} from './apiClient.js'
import { mockApplications } from '../data/mockApplications.js'
import { mockInternships } from '../data/mockInternships.js'
import { readStorage, storageKeys, writeStorage } from '../utils/storage.js'
import { isoDateFromToday } from '../utils/formatters.js'
import { isValidStatus } from '../utils/validators.js'

// ---------- Mock-mode persistence (all students in one list) ----------

function isValidRecord(record) {
    return (
        record !== null &&
        typeof record === 'object' &&
        typeof record.id === 'string' &&
        typeof record.studentId === 'string' &&
        typeof record.internshipId === 'string' &&
        isValidStatus(record.status)
    )
}

function readAllRecords() {
    const stored = readStorage(storageKeys.applications, null)
    const records = Array.isArray(stored) ? stored.filter(isValidRecord) : cloneData(mockApplications)
    return records
}

function saveAllRecords(records) {
    if (!writeStorage(storageKeys.applications, records)) {
        throw new ApiError('Your browser would not save tracker changes. Check that site data is not blocked.', {
            status: 0,
        })
    }
}

function createRecordId(existingRecords) {
    const usedIds = new Set(existingRecords.map((record) => record.id))
    let id
    do {
        id = `app-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
    } while (usedIds.has(id))
    return id
}

function requireStatus(status) {
    if (!isValidStatus(status)) {
        throw new ApiError(`"${status}" is not a valid application status.`, { status: 422 })
    }
}

// Newest activity first; id as a tie-breaker so the order is stable.
function byLatestUpdate(a, b) {
    return b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id)
}

// ---------- Public service API ----------

// GET /api/applications/{studentId}  ->  ApplicationRecord[]
export async function getApplications(studentId) {
    if (USE_MOCK_API) {
        await mockDelay()
        const records = readAllRecords().filter((record) => record.studentId === studentId)
        return cloneData(records.sort(byLatestUpdate))
    }
    const payload = await apiRequest(`/api/applications/${encodeURIComponent(studentId)}`)
    return ensureArray(payload, 'the application list')
}

// POST /api/applications  (body: { studentId, internshipId, status })  ->  ApplicationRecord
// Mock mode: 404 if the internship is unknown, 409 if it is already tracked.
export async function createApplication({ studentId, internshipId, status = 'SAVED', notes = '' }) {
    if (USE_MOCK_API) {
        await mockDelay()
        requireStatus(status)
        if (!mockInternships.some((item) => item.id === internshipId)) {
            throw new ApiError(`Internship "${internshipId}" was not found.`, { status: 404 })
        }
        const records = readAllRecords()
        if (records.some((record) => record.studentId === studentId && record.internshipId === internshipId)) {
            throw new ApiError('This internship is already in your tracker.', { status: 409 })
        }
        const today = isoDateFromToday(0)
        const record = {
            id: createRecordId(records),
            studentId,
            internshipId,
            status,
            trackedAt: today,
            appliedAt: status === 'SAVED' ? null : today,
            updatedAt: today,
            notes,
        }
        saveAllRecords([...records, record])
        return cloneData(record)
    }
    const payload = await apiRequest('/api/applications', {
        method: 'POST',
        body: { studentId, internshipId, status, notes },
    })
    return ensureObject(payload, 'the new application')
}

// PUT /api/applications/{applicationId}  (body: { status?, notes? })  ->  ApplicationRecord
export async function updateApplication(applicationId, changes) {
    if (USE_MOCK_API) {
        await mockDelay()
        if (changes.status !== undefined) requireStatus(changes.status)
        const records = readAllRecords()
        const index = records.findIndex((record) => record.id === applicationId)
        if (index === -1) {
            throw new ApiError(`Application "${applicationId}" was not found.`, { status: 404 })
        }
        const today = isoDateFromToday(0)
        const current = records[index]
        const next = { ...current, updatedAt: today }
        if (changes.notes !== undefined) next.notes = String(changes.notes)
        if (changes.status !== undefined) {
            next.status = changes.status
            next.appliedAt = changes.status === 'SAVED' ? null : current.appliedAt ?? today
        }
        const updated = records.map((record, position) => (position === index ? next : record))
        saveAllRecords(updated)
        return cloneData(next)
    }
    const payload = await apiRequest(`/api/applications/${encodeURIComponent(applicationId)}`, {
        method: 'PUT',
        body: changes,
    })
    return ensureObject(payload, 'the updated application')
}

// DELETE /api/applications/{applicationId}  ->  204 No Content (returns null)
// Proposed extra endpoint, needed so a saved internship can be un-saved.
export async function deleteApplication(applicationId) {
    if (USE_MOCK_API) {
        await mockDelay()
        const records = readAllRecords()
        if (!records.some((record) => record.id === applicationId)) {
            throw new ApiError(`Application "${applicationId}" was not found.`, { status: 404 })
        }
        saveAllRecords(records.filter((record) => record.id !== applicationId))
        return null
    }
    await apiRequest(`/api/applications/${encodeURIComponent(applicationId)}`, { method: 'DELETE' })
    return null
}