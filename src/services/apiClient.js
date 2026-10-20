// The ONLY file that reads environment settings and calls fetch().
// Mock mode is the default: it is switched off only when VITE_USE_MOCK_API is
// exactly the text "false". Restart `npm run dev` after editing .env.

const env = import.meta.env ?? {}

export const USE_MOCK_API = String(env.VITE_USE_MOCK_API ?? 'true').trim().toLowerCase() !== 'false'

export const API_BASE_URL = String(env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '')

// Simulated network delay for mock mode, in milliseconds. Set to 0 to disable.
export const MOCK_LATENCY_MS = 150

// Error type used in BOTH modes, so UI code handles failures one way.
// status: HTTP status code (0 = request never reached a server).
// details: optional extra data, e.g. field errors from a 422 response.
export class ApiError extends Error {
    constructor(message, { status = 0, details = null } = {}) {
        super(message)
        this.name = 'ApiError'
        this.status = status
        this.details = details
    }
}

export function isNotFoundError(error) {
    return error instanceof ApiError && error.status === 404
}

export function mockDelay() {
    return new Promise((resolve) => {
        setTimeout(resolve, MOCK_LATENCY_MS)
    })
}

// Mock services return copies so UI code can never mutate the seed data.
export function cloneData(value) {
    return structuredClone(value)
}

export function ensureArray(value, description) {
    if (!Array.isArray(value)) {
        throw new ApiError(`The backend returned an unexpected response for ${description} (expected a list).`, {
            status: 502,
        })
    }
    return value
}

export function ensureObject(value, description) {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        throw new ApiError(`The backend returned an unexpected response for ${description} (expected an object).`, {
            status: 502,
        })
    }
    return value
}

// Real HTTP call. Failures are thrown as ApiError, never hidden.
export async function apiRequest(path, { method = 'GET', body, signal } = {}) {
    const hasBody = body !== undefined
    let response

    try {
        response = await fetch(`${API_BASE_URL}${path}`, {
            method,
            headers: {
                Accept: 'application/json',
                ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
            },
            body: hasBody ? JSON.stringify(body) : undefined,
            signal,
        })
    } catch (error) {
        if (error?.name === 'AbortError') throw error
        throw new ApiError(
            `Could not reach the backend at ${API_BASE_URL}. Check that the server is running and that CORS allows this origin.`,
            { status: 0 },
        )
    }

    if (response.status === 204) return null

    let payload = null
    const text = await response.text()
    if (text) {
        try {
            payload = JSON.parse(text)
        } catch {
            if (response.ok) {
                throw new ApiError('The backend returned a response that is not valid JSON.', { status: response.status })
            }
        }
    }

    if (!response.ok) {
        throw new ApiError(payload?.message || `The request failed with status ${response.status}.`, {
            status: response.status,
            details: payload?.errors ?? payload,
        })
    }

    return payload
}