import { useCallback, useEffect, useState } from 'react'

const DEFAULT_TITLE = 'PathFinder \u2014 Smart Placement & Internship System'

// Runs `asyncFn` when the component mounts and again whenever a value in `deps`
// changes. Pass every value the function uses as a dependency, for example
//   useAsync(() => getInternshipById(internshipId), [internshipId])
//
// Returns { data, error, isLoading, reload }.
// data is null while loading and after a failure. error is whatever was thrown
// (an ApiError for service failures), so the UI never shows stale data as if it were current.
export function useAsync(asyncFn, deps = []) {
    const [state, setState] = useState({ data: null, error: null, isLoading: true })
    const [reloadCount, setReloadCount] = useState(0)

    useEffect(() => {
        let cancelled = false
        setState({ data: null, error: null, isLoading: true })

        asyncFn().then(
            (data) => {
                if (!cancelled) setState({ data, error: null, isLoading: false })
            },
            (error) => {
                if (!cancelled) setState({ data: null, error, isLoading: false })
            },
        )

        // The cleanup ignores results from a superseded or unmounted run.
        return () => {
            cancelled = true
        }
        // `deps` is supplied by the caller and must keep the same length on every render.
    }, [...deps, reloadCount])

    const reload = useCallback(() => setReloadCount((count) => count + 1), [])

    return { data: state.data, error: state.error, isLoading: state.isLoading, reload }
}

// useDocumentTitle('Dashboard') sets the tab title to "Dashboard | PathFinder".
// Passing nothing restores the default product title.
export function useDocumentTitle(title) {
    useEffect(() => {
        document.title = title ? `${title} | PathFinder` : DEFAULT_TITLE
    }, [title])
}