import { ApiError, USE_MOCK_API, apiRequest, ensureArray, ensureObject } from './apiClient.js'
import { getInternships } from './internshipService.js'
import { getStudentProfile } from './profileService.js'
import { generateMockRecommendations } from './mock/mockRecommendationEngine.js'

// GET /api/recommendations/{studentId}?limit=N
// Returns { studentId, engine: { name, version, isPlaceholder, ... }, recommendations: Recommendation[] }
//
// This is the ONE place to swap in the Spring Boot / DSA engine. In API mode the
// backend's response is returned as-is (after shape checks). Nothing falls back to mock data.
export async function getRecommendations(studentId, { limit } = {}) {
    const hasLimit = Number.isInteger(limit) && limit > 0

    if (USE_MOCK_API) {
        const [student, internships] = await Promise.all([getStudentProfile(studentId), getInternships()])
        const result = generateMockRecommendations(student, internships)
        return hasLimit ? { ...result, recommendations: result.recommendations.slice(0, limit) } : result
    }

    const query = hasLimit ? `?limit=${limit}` : ''
    const payload = await apiRequest(`/api/recommendations/${encodeURIComponent(studentId)}${query}`)
    const result = ensureObject(payload, 'the recommendations')
    ensureArray(result.recommendations, 'the recommendations')
    return result
}

// Recommendation for a single internship (used on the details page), or null.
export async function getRecommendationForInternship(studentId, internshipId) {
    const result = await getRecommendations(studentId)
    return result.recommendations.find((item) => item.internship?.id === internshipId) ?? null
}

export { ApiError }