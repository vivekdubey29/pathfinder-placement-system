// ---------- Shared constants (used by services, validators and UI) ----------

export const APPLICATION_STATUSES = ['SAVED', 'APPLIED', 'INTERVIEW', 'OFFERED', 'REJECTED']

export const STATUS_LABELS = {
    SAVED: 'Saved',
    APPLIED: 'Applied',
    INTERVIEW: 'Interview',
    OFFERED: 'Offered',
    REJECTED: 'Rejected',
}

export const WORK_MODES = ['REMOTE', 'HYBRID', 'ONSITE']

export const WORK_MODE_PREFERENCES = ['ANY', ...WORK_MODES]

export const WORK_MODE_LABELS = {
    ANY: 'No preference',
    REMOTE: 'Remote',
    HYBRID: 'Hybrid',
    ONSITE: 'On-site',
}

export const DEGREE_OPTIONS = ['B.Tech', 'B.E.', 'BCA', 'B.Sc', 'B.Des', 'M.Tech', 'MCA', 'M.Sc']

export const ROLE_CATEGORIES = [
    'Backend Development',
    'Frontend Development',
    'Full Stack Development',
    'Mobile Development',
    'Data Science',
    'Machine Learning',
    'Data Engineering',
    'DevOps & Cloud',
    'Cybersecurity',
    'Quality Assurance',
    'UI/UX Design',
]

export const LOCATION_OPTIONS = [
    'Bengaluru',
    'Hyderabad',
    'Pune',
    'Chennai',
    'Mumbai',
    'Delhi NCR',
    'Kolkata',
    'Ahmedabad',
]

// ---------- Labels ----------

export function getStatusLabel(status) {
    return STATUS_LABELS[status] ?? status
}

export function getWorkModeLabel(mode) {
    return WORK_MODE_LABELS[mode] ?? mode
}

// ---------- Dates (all dates are 'YYYY-MM-DD' strings) ----------

function pad2(value) {
    return String(value).padStart(2, '0')
}

// Local-time ISO date, so late-evening users do not get tomorrow's UTC date.
export function toIsoDate(date) {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

export function isoDateFromToday(offsetDays = 0) {
    const date = new Date()
    date.setDate(date.getDate() + offsetDays)
    return toIsoDate(date)
}

export function parseIsoDate(iso) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso ?? ''))
    if (!match) return null
    const [, year, month, day] = match
    const date = new Date(Number(year), Number(month) - 1, Number(day))
    return Number.isNaN(date.getTime()) ? null : date
}

export function formatDate(iso, fallback = '-') {
    const date = parseIsoDate(iso)
    if (!date) return fallback
    return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

// Whole days from today until the given date (negative if in the past).
export function daysUntil(iso) {
    const target = parseIsoDate(iso)
    if (!target) return null
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    return Math.round((target.getTime() - today.getTime()) / 86400000)
}

// tone is 'danger' (closed), 'warning' (7 days or fewer) or 'neutral'.
export function getDeadlineInfo(iso) {
    const daysLeft = daysUntil(iso)
    if (daysLeft === null) return { daysLeft: null, label: 'No deadline', tone: 'neutral' }
    if (daysLeft < 0) return { daysLeft, label: 'Closed', tone: 'danger' }
    if (daysLeft === 0) return { daysLeft, label: 'Closes today', tone: 'warning' }
    if (daysLeft === 1) return { daysLeft, label: '1 day left', tone: 'warning' }
    return { daysLeft, label: `${daysLeft} days left`, tone: daysLeft <= 7 ? 'warning' : 'neutral' }
}

export function formatPostedDate(iso) {
    const daysAgo = daysUntil(iso)
    if (daysAgo === null) return 'Posting date unknown'
    if (daysAgo > 0) return `Opens ${formatDate(iso)}`
    if (daysAgo === 0) return 'Posted today'
    if (daysAgo === -1) return 'Posted yesterday'
    return `Posted ${Math.abs(daysAgo)} days ago`
}

// ---------- Numbers and money ----------

export function formatStipend(amountPerMonth) {
    const amount = Number(amountPerMonth)
    if (!Number.isFinite(amount) || amount <= 0) return 'Unpaid'
    return `\u20B9${new Intl.NumberFormat('en-IN').format(amount)} / month`
}

export function formatCgpa(value) {
    const number = Number(value)
    return Number.isFinite(number) ? number.toFixed(1) : '-'
}

export function formatDuration(months) {
    const count = Number(months)
    if (!Number.isFinite(count) || count <= 0) return '-'
    return count === 1 ? '1 month' : `${count} months`
}