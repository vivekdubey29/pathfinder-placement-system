// Safe localStorage helpers. All keys are namespaced so PathFinder never
// touches other apps' data on the same origin.

const PREFIX = 'pathfinder.v1.'

export const storageKeys = {
    profile: (studentId) => `profile.${studentId}`,
    applications: 'applications',
}

function getStore() {
    try {
        return globalThis.localStorage ?? null
    } catch {
        return null
    }
}

// Returns the stored value, or `fallback` if it is missing, unreadable or corrupt.
export function readStorage(key, fallback = null) {
    const store = getStore()
    if (!store) return fallback
    try {
        const raw = store.getItem(PREFIX + key)
        return raw === null ? fallback : JSON.parse(raw)
    } catch {
        return fallback
    }
}

// Returns true if the value was saved, false if the browser refused.
export function writeStorage(key, value) {
    const store = getStore()
    if (!store) return false
    try {
        store.setItem(PREFIX + key, JSON.stringify(value))
        return true
    } catch {
        return false
    }
}

export function removeStorage(key) {
    const store = getStore()
    if (!store) return
    try {
        store.removeItem(PREFIX + key)
    } catch {
        // Nothing useful to do if removal fails.
    }
}

// Removes every PathFinder key (used by "Reset demo data").
export function clearPathfinderStorage() {
    const store = getStore()
    if (!store) return
    try {
        const keysToRemove = []
        for (let index = 0; index < store.length; index += 1) {
            const key = store.key(index)
            if (key && key.startsWith(PREFIX)) keysToRemove.push(key)
        }
        keysToRemove.forEach((key) => store.removeItem(key))
    } catch {
        // Ignore: storage is unavailable.
    }
}