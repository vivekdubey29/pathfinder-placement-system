import {
    ApiError,
    USE_MOCK_API,
    apiRequest,
    cloneData,
    ensureArray,
    ensureObject,
    mockDelay,
} from './apiClient.js'
import { mockInternships } from '../data/mockInternships.js'

// GET /api/internships  ->  Internship[]
export async function getInternships() {
    if (USE_MOCK_API) {
        await mockDelay()
        return cloneData(mockInternships)
    }
    const payload = await apiRequest('/api/internships')
    return ensureArray(payload, 'the internship list')
}

// GET /api/internships/{id}  ->  Internship  (404 if unknown)
export async function getInternshipById(internshipId) {
    if (USE_MOCK_API) {
        await mockDelay()
        const internship = mockInternships.find((item) => item.id === internshipId)
        if (!internship) {
            throw new ApiError(`Internship "${internshipId}" was not found.`, { status: 404 })
        }
        return cloneData(internship)
    }
    const payload = await apiRequest(`/api/internships/${encodeURIComponent(internshipId)}`)
    return ensureObject(payload, 'the internship')
}


// GET /api/external-internships  ->  ExternalInternship[]
// Returns real live listings from the Himalayas Remote Jobs API (server-side proxy).
// In mock mode, returns an empty array because there is no mock dataset for external listings.
export async function getExternalInternships() {
    if (USE_MOCK_API) {
        await mockDelay()
        return []
    }
    const payload = await apiRequest('/api/external-internships')
    return ensureArray(payload, 'external internship listings')
}
