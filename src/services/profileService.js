import {
    ApiError,
    USE_MOCK_API,
    apiRequest,
    cloneData,
    ensureObject,
    mockDelay,
} from './apiClient.js'
import { mockStudents } from '../data/mockStudents.js'
import { clearPathfinderStorage, readStorage, storageKeys, writeStorage } from '../utils/storage.js'
import { hasErrors, normalizeProfile, validateProfile } from '../utils/validators.js'
import { isoDateFromToday } from '../utils/formatters.js'

// Components import the demo id from here, never from the data folder.
export { DEMO_STUDENT_ID } from '../data/mockStudents.js'

function findSeedStudent(studentId) {
    const student = mockStudents.find((item) => item.id === studentId)
    if (!student) {
        throw new ApiError(`Student "${studentId}" was not found.`, { status: 404 })
    }
    return student
}

// Seed data overlaid with any edits saved in this browser.
function readMockProfile(studentId) {
    const seed = findSeedStudent(studentId)
    const stored = readStorage(storageKeys.profile(studentId), null)
    const hasStoredProfile = stored !== null && typeof stored === 'object' && !Array.isArray(stored)
    return cloneData(hasStoredProfile ? { ...seed, ...stored, id: seed.id } : seed)
}

// GET /api/students/{id}  ->  Student
export async function getStudentProfile(studentId) {
    if (USE_MOCK_API) {
        await mockDelay()
        return readMockProfile(studentId)
    }
    const payload = await apiRequest(`/api/students/${encodeURIComponent(studentId)}`)
    return ensureObject(payload, 'the student profile')
}

// PUT /api/students/{id}  (body: editable profile fields)  ->  Student
// Mock mode: 422 ApiError with field messages in `details` if validation fails.
export async function updateStudentProfile(studentId, values) {
    if (USE_MOCK_API) {
        await mockDelay()
        const errors = validateProfile(values)
        if (hasErrors(errors)) {
            throw new ApiError('Profile validation failed.', { status: 422, details: errors })
        }
        const current = readMockProfile(studentId)
        const saved = { ...current, ...normalizeProfile(values), id: studentId, updatedAt: isoDateFromToday(0) }
        if (!writeStorage(storageKeys.profile(studentId), saved)) {
            throw new ApiError('Your browser would not save the profile. Check that site data is not blocked.', { status: 0 })
        }
        return cloneData(saved)
    }
    const payload = await apiRequest(`/api/students/${encodeURIComponent(studentId)}`, {
        method: 'PUT',
        body: normalizeProfile(values),
    })
    return ensureObject(payload, 'the saved profile')
}

// Mock mode only: clears the saved profile AND tracker data in this browser.
export async function resetDemoData() {
    if (!USE_MOCK_API) {
        throw new Error('Reset demo data is only available in mock mode.')
    }
    await mockDelay()
    clearPathfinderStorage()
}