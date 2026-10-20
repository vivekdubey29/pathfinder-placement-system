import { AlertCircle, Inbox, Info } from 'lucide-react'
import { useAppState } from '../../context/AppStateContext.jsx'

// icon: a Lucide icon component. action: any node (usually a button or link).
export function EmptyState({ icon: Icon = Inbox, title, description, action }) {
    return (
        <div className="state-view">
      <span className="state-icon">
        <Icon size={24} aria-hidden="true" />
      </span>
            <h2 className="state-title">{title}</h2>
            {description && <p className="state-text">{description}</p>}
            {action}
        </div>
    )
}

// Pass `error` (any thrown value) or `message`. onRetry adds a retry button.
export function ErrorState({
                               title = 'Something went wrong',
                               error,
                               message,
                               onRetry,
                               retryLabel = 'Try again',
                           }) {
    const text =
        message ??
        (error instanceof Error && error.message
            ? error.message
            : 'An unexpected error occurred. Please try again.')

    return (
        <div className="state-view state-view-error" role="alert">
      <span className="state-icon">
        <AlertCircle size={24} aria-hidden="true" />
      </span>
            <h2 className="state-title">{title}</h2>
            <p className="state-text">{text}</p>
            {onRetry && (
                <button type="button" className="btn btn-secondary" onClick={onRetry}>
                    {retryLabel}
                </button>
            )}
        </div>
    )
}

export function LoadingState({ label = 'Loading\u2026' }) {
    return (
        <div className="state-view state-view-loading" role="status" aria-live="polite">
            <span className="spinner" aria-hidden="true" />
            <p className="state-text">{label}</p>
        </div>
    )
}

// Shown wherever listings appear, so nobody mistakes demo data for real vacancies.
export function DemoDataNotice({ className = '' }) {
    const { isMockMode } = useAppState()

    return (
        <div className={`alert alert-info ${className}`.trim()} role="note">
            <Info size={18} aria-hidden="true" />
            <p>
                {isMockMode ? (
                    <>
                        <strong>Demonstration data.</strong> Every company and listing is fictional and is not a
                        verified live vacancy. Your profile and tracker changes are stored only in this browser.
                    </>
                ) : (
                    <>
                        <strong>Demonstration project.</strong> Listings come from the connected backend and
                        should not be treated as verified live vacancies. PathFinder does not submit applications
                        to companies.
                    </>
                )}
            </p>
        </div>
    )
}