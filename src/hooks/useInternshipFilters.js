import { useCallback, useMemo, useState } from 'react'
import { normalizeSkill } from '../utils/matchingUtils.js'

// ---------- Option lists used by the filter bar ----------

export const DEFAULT_FILTERS = {
    query: '',
    location: 'ALL',
    workMode: 'ALL',
    role: 'ALL',
    minStipend: 0,
    eligibility: 'ALL', // 'ALL' | 'ELIGIBLE' | 'INELIGIBLE'
}

export const SORT_OPTIONS = [
    { value: 'match', label: 'Best match' },
    { value: 'newest', label: 'Newest first' },
    { value: 'stipend', label: 'Highest stipend' },
]

export const STIPEND_OPTIONS = [
    { value: 0, label: 'Any stipend' },
    { value: 20000, label: '\u20B920,000+ / month' },
    { value: 30000, label: '\u20B930,000+ / month' },
    { value: 40000, label: '\u20B940,000+ / month' },
]

export const ELIGIBILITY_OPTIONS = [
    { value: 'ALL', label: 'All listings' },
    { value: 'ELIGIBLE', label: 'Eligible for me' },
    { value: 'INELIGIBLE', label: 'Not eligible' },
]

// ---------- Pure helpers ----------

// Every word of the query must match the title, company name or a skill.
// Skill aliases work too: "js" finds JavaScript, "dsa" finds Data Structures.
function matchesQuery(internship, query) {
    const terms = String(query ?? '')
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
    if (terms.length === 0) return true

    const skills = [...(internship.requiredSkills ?? []), ...(internship.preferredSkills ?? [])]
    const skillKeys = new Set(skills.map(normalizeSkill))
    const haystack = [internship.title, internship.company?.name, ...skills].join(' ').toLowerCase()

    return terms.every((term) => haystack.includes(term) || skillKeys.has(normalizeSkill(term)))
}

function matchesFilters(item, filters) {
    const { internship, eligibility } = item

    if (!matchesQuery(internship, filters.query)) return false
    if (filters.location !== 'ALL' && internship.location !== filters.location) return false
    if (filters.workMode !== 'ALL' && internship.workMode !== filters.workMode) return false
    if (filters.role !== 'ALL' && internship.roleCategory !== filters.role) return false
    if (Number(internship.stipendMonthly ?? 0) < filters.minStipend) return false
    if (filters.eligibility === 'ELIGIBLE' && eligibility?.eligible !== true) return false
    if (filters.eligibility === 'INELIGIBLE' && eligibility?.eligible !== false) return false

    return true
}

function byInternshipId(a, b) {
    return a.internship.id.localeCompare(b.internship.id)
}

const COMPARATORS = {
    match: (a, b) => (b.matchScore ?? -1) - (a.matchScore ?? -1) || byInternshipId(a, b),
    newest: (a, b) =>
        String(b.internship.postedDate ?? '').localeCompare(String(a.internship.postedDate ?? '')) ||
        byInternshipId(a, b),
    stipend: (a, b) =>
        Number(b.internship.stipendMonthly ?? 0) - Number(a.internship.stipendMonthly ?? 0) ||
        byInternshipId(a, b),
}

// Returns a new filtered and sorted array. Unknown sort keys fall back to "match".
export function filterAndSortItems(items, filters, sort) {
    const list = Array.isArray(items) ? items : []
    const compare = COMPARATORS[sort] ?? COMPARATORS.match
    return list.filter((item) => item?.internship && matchesFilters(item, filters)).sort(compare)
}

// Location and role choices actually present in the data.
export function getFilterOptions(items) {
    const list = Array.isArray(items) ? items : []
    const locations = new Set()
    const roles = new Set()
    list.forEach((item) => {
        if (item?.internship?.location) locations.add(item.internship.location)
        if (item?.internship?.roleCategory) roles.add(item.internship.roleCategory)
    })
    return {
        locations: [...locations].sort((a, b) => a.localeCompare(b)),
        roles: [...roles].sort((a, b) => a.localeCompare(b)),
    }
}

// ---------- Hook ----------

// items: Recommendation[] (or any list of { internship, matchScore?, eligibility? }).
export function useInternshipFilters(items) {
    const [filters, setFilters] = useState(DEFAULT_FILTERS)
    const [sort, setSort] = useState('match')

    const setFilter = useCallback((name, value) => {
        setFilters((current) => ({
            ...current,
            [name]: name === 'minStipend' ? Number(value) || 0 : value,
        }))
    }, [])

    const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), [])

    const options = useMemo(() => getFilterOptions(items), [items])
    const results = useMemo(() => filterAndSortItems(items, filters, sort), [items, filters, sort])

    const activeFilterCount = Object.keys(DEFAULT_FILTERS).filter((key) =>
        key === 'query' ? filters.query.trim() !== '' : filters[key] !== DEFAULT_FILTERS[key],
    ).length

    return {
        filters,
        setFilter,
        resetFilters,
        sort,
        setSort,
        results,
        totalCount: Array.isArray(items) ? items.length : 0,
        options,
        activeFilterCount,
        hasActiveFilters: activeFilterCount > 0,
    }
}