// =====================================================================
// MOCK RECOMMENDATION ENGINE - PLACEHOLDER ONLY
// A deterministic weighted formula so the frontend works without a backend.
// It is NOT an AI model and NOT the final DSA recommendation engine.
// The real scores will come from the Spring Boot REST API
// (GET /api/recommendations/{studentId}). Delete this folder when that exists.
// =====================================================================

import { checkEligibility, compareSkills } from '../../utils/matchingUtils.js'
import { getWorkModeLabel } from '../../utils/formatters.js'

// Maximum points per factor. They add up to 100.
export const MATCH_WEIGHTS = {
    requiredSkills: 50,
    preferredSkills: 10,
    role: 15,
    location: 10,
    workMode: 10,
    cgpa: 5,
}

const FACTOR_LABELS = {
    requiredSkills: 'Required skills',
    preferredSkills: 'Preferred skills',
    role: 'Role preference',
    location: 'Location',
    workMode: 'Work mode',
    cgpa: 'CGPA headroom',
}

export const MOCK_ENGINE_INFO = {
    name: 'Mock placeholder scorer',
    version: 'mock-1.0',
    isPlaceholder: true,
    description:
        'A deterministic weighted formula used only until the Spring Boot DSA recommendation engine is connected. It is not an AI model.',
    weights: MATCH_WEIGHTS,
}

// ---------- Factor scoring: each returns a ratio from 0 to 1 ----------

function skillRatio(matchedCount, totalCount) {
    return totalCount === 0 ? 1 : matchedCount / totalCount
}

function scoreRole(student, internship) {
    const preferred = student.preferredRoles ?? []
    if (preferred.length === 0) return { ratio: 0.5, aligned: null }
    const aligned = preferred.some((role) => role.toLowerCase() === String(internship.roleCategory).toLowerCase())
    return { ratio: aligned ? 1 : 0, aligned }
}

function scoreLocation(student, internship) {
    if (internship.workMode === 'REMOTE') return { ratio: 1, status: 'remote' }
    const preferred = student.preferredLocations ?? []
    if (preferred.length === 0) return { ratio: 0.5, status: 'unspecified' }
    const inPreferred = preferred.some((city) => city.toLowerCase() === String(internship.location).toLowerCase())
    return { ratio: inPreferred ? 1 : 0, status: inPreferred ? 'preferred' : 'other' }
}

function scoreWorkMode(student, internship) {
    const preference = student.workModePreference || 'ANY'
    const fits = preference === 'ANY' || preference === internship.workMode
    return { ratio: fits ? 1 : 0, fits, preference }
}

function scoreCgpaHeadroom(student, internship) {
    const minimum = Number(internship.eligibility?.minCgpa ?? 0)
    const cgpa = Number(student.cgpa)
    if (!Number.isFinite(cgpa) || cgpa < minimum) return 0
    return Math.min(1, (cgpa - minimum) / 1.5)
}

// ---------- Text helpers ----------

function summarizeList(items, max) {
    if (items.length <= max) return items.join(', ')
    return `${items.slice(0, max).join(', ')} +${items.length - max} more`
}

function buildExplanation({ student, internship, matched, missing, matchedPreferred, role, location, workMode, eligibility }) {
    const parts = []
    const total = matched.length + missing.length

    if (total === 0) {
        parts.push('This listing does not name any required skills.')
    } else if (missing.length === 0) {
        parts.push(`You cover all ${total} required skills (${summarizeList(matched, 4)}).`)
    } else if (matched.length === 0) {
        parts.push(`You do not match any of the ${total} required skills yet.`)
    } else {
        parts.push(
            `You match ${matched.length} of ${total} required skills (${summarizeList(matched, 4)}) and are missing ${summarizeList(missing, 3)}.`,
        )
    }

    if (matchedPreferred.length > 0) {
        parts.push(`You also have preferred skills: ${summarizeList(matchedPreferred, 3)}.`)
    }

    if (role.aligned === true) parts.push(`${internship.roleCategory} is one of your preferred roles.`)
    if (role.aligned === false) parts.push(`${internship.roleCategory} is outside your preferred roles.`)

    if (location.status === 'remote') parts.push('The role is remote, so location does not count against it.')
    if (location.status === 'preferred') parts.push(`${internship.location} is one of your preferred locations.`)
    if (location.status === 'other') parts.push(`${internship.location} is not among your preferred locations.`)

    if (!workMode.fits) {
        parts.push(
            `It is ${getWorkModeLabel(internship.workMode).toLowerCase()} while you prefer ${getWorkModeLabel(workMode.preference).toLowerCase()}.`,
        )
    } else if (workMode.preference !== 'ANY') {
        parts.push(`${getWorkModeLabel(internship.workMode)} work matches your preference.`)
    }

    if (eligibility.eligible) {
        const minimum = Number(internship.eligibility?.minCgpa ?? 0).toFixed(1)
        parts.push(`You meet the eligibility criteria (CGPA ${Number(student.cgpa).toFixed(1)} against a minimum of ${minimum}).`)
    } else {
        parts.push(`Not eligible: ${eligibility.reasons.join(' ')}`)
    }

    return parts.join(' ')
}

// ---------- Scoring and ranking ----------

// Scores one internship for one student. Returns a Recommendation without `rank`.
export function scoreInternship(student, internship) {
    const required = compareSkills(student.skills, internship.requiredSkills)
    const preferred = compareSkills(student.skills, internship.preferredSkills)
    const role = scoreRole(student, internship)
    const location = scoreLocation(student, internship)
    const workMode = scoreWorkMode(student, internship)
    const eligibility = checkEligibility(student, internship)

    const ratios = {
        requiredSkills: skillRatio(required.matched.length, required.matched.length + required.missing.length),
        preferredSkills: skillRatio(preferred.matched.length, preferred.matched.length + preferred.missing.length),
        role: role.ratio,
        location: location.ratio,
        workMode: workMode.ratio,
        cgpa: scoreCgpaHeadroom(student, internship),
    }

    const scoreBreakdown = Object.keys(MATCH_WEIGHTS).map((key) => ({
        key,
        label: FACTOR_LABELS[key],
        weight: MATCH_WEIGHTS[key],
        earned: Math.round(MATCH_WEIGHTS[key] * ratios[key] * 10) / 10,
    }))

    const rawScore = Object.keys(MATCH_WEIGHTS).reduce((sum, key) => sum + MATCH_WEIGHTS[key] * ratios[key], 0)

    return {
        matchScore: Math.round(rawScore),
        internship,
        matchedSkills: required.matched,
        missingSkills: required.missing,
        matchedPreferredSkills: preferred.matched,
        missingPreferredSkills: preferred.missing,
        eligibility,
        scoreBreakdown,
        explanation: buildExplanation({
            student,
            internship,
            matched: required.matched,
            missing: required.missing,
            matchedPreferred: preferred.matched,
            role,
            location,
            workMode,
            eligibility,
        }),
        // Missing required skills first, then missing preferred ones (at most 4).
        suggestedSkills: [...required.missing, ...preferred.missing].slice(0, 4),
    }
}

// Eligible listings rank first, then higher score, then internship id (stable tie-break).
function compareRecommendations(a, b) {
    if (a.eligibility.eligible !== b.eligibility.eligible) return a.eligibility.eligible ? -1 : 1
    if (a.matchScore !== b.matchScore) return b.matchScore - a.matchScore
    return a.internship.id.localeCompare(b.internship.id)
}

export function rankInternships(student, internships) {
    return internships
        .filter((internship) => internship && internship.id)
        .map((internship) => scoreInternship(student, internship))
        .sort(compareRecommendations)
        .map((recommendation, index) => ({ rank: index + 1, ...recommendation }))
}

// Builds the same response shape the Spring Boot API is expected to return.
export function generateMockRecommendations(student, internships) {
    return {
        studentId: student.id,
        engine: MOCK_ENGINE_INFO,
        recommendations: rankInternships(student, internships),
    }
}