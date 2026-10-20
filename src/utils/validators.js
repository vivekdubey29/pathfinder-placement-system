import {
    APPLICATION_STATUSES,
    DEGREE_OPTIONS,
    WORK_MODE_PREFERENCES,
} from './formatters.js'
import { normalizeSkill, uniqueBy } from './matchingUtils.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_GRADUATION_YEAR = 2024
const MAX_GRADUATION_YEAR = 2032
const MAX_SKILLS = 30

export function hasErrors(errors) {
    return Object.keys(errors).length > 0
}

export function isValidStatus(status) {
    return APPLICATION_STATUSES.includes(status)
}

// Takes raw form values (cgpa and graduationYear may still be strings).
// Returns an object like { cgpa: 'message' }. An empty object means valid.
export function validateProfile(values) {
    const errors = {}

    const fullName = String(values.fullName ?? '').trim()
    if (fullName.length < 2) errors.fullName = 'Enter your full name (at least 2 characters).'
    else if (fullName.length > 80) errors.fullName = 'Full name must be 80 characters or fewer.'

    const email = String(values.email ?? '').trim()
    if (!email) errors.email = 'Enter your email address.'
    else if (!EMAIL_PATTERN.test(email)) errors.email = 'Enter a valid email address, for example name@example.com.'

    const college = String(values.college ?? '').trim()
    if (college.length < 2) errors.college = 'Enter your college or university name.'

    if (!DEGREE_OPTIONS.includes(values.degree)) errors.degree = 'Select your degree.'

    const year = Number(values.graduationYear)
    if (
        values.graduationYear === '' ||
        values.graduationYear == null ||
        !Number.isInteger(year) ||
        year < MIN_GRADUATION_YEAR ||
        year > MAX_GRADUATION_YEAR
    ) {
        errors.graduationYear = `Enter a graduation year between ${MIN_GRADUATION_YEAR} and ${MAX_GRADUATION_YEAR}.`
    }

    if (values.cgpa === '' || values.cgpa == null) {
        errors.cgpa = 'Enter your CGPA.'
    } else {
        const cgpa = Number(values.cgpa)
        if (!Number.isFinite(cgpa) || cgpa < 0 || cgpa > 10) {
            errors.cgpa = 'CGPA must be a number between 0 and 10.'
        }
    }

    const skills = Array.isArray(values.skills) ? values.skills : []
    if (skills.length === 0) errors.skills = 'Add at least one technical skill.'
    else if (skills.length > MAX_SKILLS) errors.skills = `You can list at most ${MAX_SKILLS} skills.`

    const roles = Array.isArray(values.preferredRoles) ? values.preferredRoles : []
    if (roles.length === 0) errors.preferredRoles = 'Select at least one preferred role.'

    if (!WORK_MODE_PREFERENCES.includes(values.workModePreference)) {
        errors.workModePreference = 'Choose a work mode preference.'
    }

    const locations = Array.isArray(values.preferredLocations) ? values.preferredLocations : []
    if (locations.length === 0 && values.workModePreference !== 'REMOTE') {
        errors.preferredLocations = 'Select at least one preferred location, or set work mode to Remote.'
    }

    return errors
}

function cleanList(list) {
    if (!Array.isArray(list)) return []
    return list.map((item) => String(item).trim()).filter(Boolean)
}

// Converts validated form values into the exact types the Student shape uses.
// Only known profile fields are returned.
export function normalizeProfile(values) {
    return {
        fullName: String(values.fullName ?? '').trim(),
        email: String(values.email ?? '').trim().toLowerCase(),
        college: String(values.college ?? '').trim(),
        degree: values.degree,
        graduationYear: Number(values.graduationYear),
        cgpa: Math.round(Number(values.cgpa) * 100) / 100,
        skills: uniqueBy(cleanList(values.skills), normalizeSkill),
        preferredRoles: uniqueBy(cleanList(values.preferredRoles), (item) => item.toLowerCase()),
        preferredLocations: uniqueBy(cleanList(values.preferredLocations), (item) => item.toLowerCase()),
        workModePreference: values.workModePreference,
        resumeFileName: String(values.resumeFileName ?? '').trim(),
    }
}