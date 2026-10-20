// Pure helpers shared by the mock recommendation engine and the UI.
// A real backend would do the equivalent work in Java; these exist so the
// frontend can run on its own.

import { formatCgpa } from './formatters.js'

// Suggestions for the skills input on the profile page.
export const SKILL_SUGGESTIONS = [
    'Algorithms', 'Android', 'Apache Spark', 'Airflow', 'AWS', 'C++', 'CI/CD', 'Cryptography',
    'CSS', 'Data Modeling', 'Data Structures', 'Design Systems', 'Docker', 'ETL', 'Excel',
    'Figma', 'Firebase', 'Git', 'HTML', 'Java', 'JavaScript', 'Jest', 'JUnit', 'Kotlin',
    'Kubernetes', 'Linux', 'Machine Learning', 'Messaging Queues', 'MongoDB', 'Networking',
    'Node.js', 'NumPy', 'Object-Oriented Programming', 'Optimization', 'Pandas', 'Power BI',
    'Prototyping', 'Python', 'React', 'Redis', 'REST APIs', 'scikit-learn', 'Selenium',
    'Software Testing', 'Spring Boot', 'SQL', 'Statistics', 'System Design', 'TensorFlow',
    'TypeScript', 'User Research', 'Web Accessibility', 'Web Security', 'Wireframing',
]

const SKILL_ALIASES = {
    js: 'javascript',
    reactjs: 'react',
    'react.js': 'react',
    node: 'node.js',
    nodejs: 'node.js',
    py: 'python',
    postgres: 'sql',
    postgresql: 'sql',
    mysql: 'sql',
    dsa: 'data structures',
    oop: 'object-oriented programming',
    oops: 'object-oriented programming',
    springboot: 'spring boot',
    spring: 'spring boot',
    ml: 'machine learning',
    k8s: 'kubernetes',
    mongo: 'mongodb',
    'rest api': 'rest apis',
    rest: 'rest apis',
    'ui design': 'figma',
}

export function normalizeSkill(skill) {
    const key = String(skill ?? '').trim().toLowerCase()
    return SKILL_ALIASES[key] ?? key
}

// Removes duplicates while keeping the first occurrence and original spelling.
export function uniqueBy(list, keyFn) {
    const seen = new Set()
    return list.filter((item) => {
        const key = keyFn(item)
        if (seen.has(key)) return false
        seen.add(key)
        return true
    })
}

// Splits `requiredList` into skills the student has (matched) and lacks (missing).
// Original spelling from `requiredList` is preserved for display.
export function compareSkills(studentSkills, requiredList) {
    const owned = new Set((studentSkills ?? []).map(normalizeSkill))
    const matched = []
    const missing = []
    ;(requiredList ?? []).forEach((skill) => {
        if (owned.has(normalizeSkill(skill))) matched.push(skill)
        else missing.push(skill)
    })
    return { matched, missing }
}

// Checks CGPA, degree and graduation year. Missing rules mean "no restriction".
// Returns { eligible, reasons: string[], checks: [{ key, label, passed, requirement, detail }] }
export function checkEligibility(student, internship) {
    const rules = internship?.eligibility ?? {}
    const minCgpa = Number(rules.minCgpa ?? 0)
    const degrees = Array.isArray(rules.degrees) ? rules.degrees : []
    const years = Array.isArray(rules.graduationYears) ? rules.graduationYears : []

    const cgpa = Number(student?.cgpa)
    const cgpaPassed = Number.isFinite(cgpa) && cgpa >= minCgpa

    const degreePassed = degrees.length === 0 || degrees.includes(student?.degree)

    const year = Number(student?.graduationYear)
    const yearPassed = years.length === 0 || years.includes(year)

    const checks = [
        {
            key: 'cgpa',
            label: 'CGPA',
            passed: cgpaPassed,
            requirement: `Minimum ${formatCgpa(minCgpa)}`,
            detail: cgpaPassed
                ? `Your CGPA ${formatCgpa(cgpa)} meets the minimum of ${formatCgpa(minCgpa)}.`
                : `Your CGPA ${formatCgpa(cgpa)} is below the minimum of ${formatCgpa(minCgpa)}.`,
        },
        {
            key: 'degree',
            label: 'Degree',
            passed: degreePassed,
            requirement: degrees.length ? degrees.join(', ') : 'Any degree',
            detail: degreePassed
                ? `${student?.degree} is an accepted degree.`
                : `${student?.degree || 'Your degree'} is not accepted (accepted: ${degrees.join(', ')}).`,
        },
        {
            key: 'graduationYear',
            label: 'Graduation year',
            passed: yearPassed,
            requirement: years.length ? years.join(', ') : 'Any year',
            detail: yearPassed
                ? `Graduating in ${year} is accepted.`
                : `Graduating in ${Number.isFinite(year) ? year : 'an unknown year'} is not accepted (accepted: ${years.join(', ')}).`,
        },
    ]

    return {
        eligible: checks.every((check) => check.passed),
        reasons: checks.filter((check) => !check.passed).map((check) => check.detail),
        checks,
    }
}

// Used by the dashboard indicator.
// Returns { percent, completed, total, missingItems: [{ key, label }] }
export function getProfileCompleteness(student) {
    const s = student ?? {}
    const text = (value) => String(value ?? '').trim().length > 0
    const items = [
        { key: 'fullName', label: 'Full name', done: text(s.fullName) },
        { key: 'email', label: 'Email', done: text(s.email) },
        { key: 'college', label: 'College', done: text(s.college) },
        { key: 'degree', label: 'Degree', done: text(s.degree) },
        { key: 'graduationYear', label: 'Graduation year', done: Number.isFinite(Number(s.graduationYear)) && Number(s.graduationYear) > 0 },
        { key: 'cgpa', label: 'CGPA', done: s.cgpa !== '' && s.cgpa != null && Number.isFinite(Number(s.cgpa)) },
        { key: 'skills', label: 'At least 3 technical skills', done: Array.isArray(s.skills) && s.skills.length >= 3 },
        { key: 'preferredRoles', label: 'Preferred roles', done: Array.isArray(s.preferredRoles) && s.preferredRoles.length > 0 },
        { key: 'preferredLocations', label: 'Preferred locations', done: Array.isArray(s.preferredLocations) && s.preferredLocations.length > 0 },
        { key: 'workModePreference', label: 'Work mode preference', done: text(s.workModePreference) },
        { key: 'resumeFileName', label: 'Resume file name', done: text(s.resumeFileName) },
    ]
    const completed = items.filter((item) => item.done).length
    return {
        percent: Math.round((completed / items.length) * 100),
        completed,
        total: items.length,
        missingItems: items.filter((item) => !item.done).map(({ key, label }) => ({ key, label })),
    }
}