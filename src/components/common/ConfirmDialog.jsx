import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'

// Controlled by the parent:
//   <ConfirmDialog open={pendingRecord !== null} title="Remove from tracker?"
//     description="..." confirmLabel="Remove" tone="danger"
//     onConfirm={handleConfirm} onCancel={() => setPendingRecord(null)} />
// tone: 'primary' | 'danger'. isBusy disables both buttons while an action runs.
export function ConfirmDialog({
                                  open,
                                  title,
                                  description,
                                  confirmLabel = 'Confirm',
                                  cancelLabel = 'Cancel',
                                  tone = 'primary',
                                  isBusy = false,
                                  onConfirm,
                                  onCancel,
                              }) {
    const titleId = useId()
    const descriptionId = useId()
    const dialogRef = useRef(null)
    const cancelRef = useRef(null)

    useEffect(() => {
        if (!open) return undefined

        const previouslyFocused = document.activeElement
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        cancelRef.current?.focus() // the safe choice gets focus first

        return () => {
            document.body.style.overflow = previousOverflow
            if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus()
        }
    }, [open])

    if (!open) return null

    function handleKeyDown(event) {
        if (event.key === 'Escape') {
            event.stopPropagation()
            if (!isBusy) onCancel()
            return
        }
        if (event.key !== 'Tab') return

        const focusable = dialogRef.current?.querySelectorAll('button:not(:disabled)') ?? []
        if (focusable.length === 0) {
            event.preventDefault()
            return
        }
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault()
            last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault()
            first.focus()
        }
    }

    function handleBackdropMouseDown(event) {
        if (event.target === event.currentTarget && !isBusy) onCancel()
    }

    return createPortal(
        <div className="dialog-backdrop" onMouseDown={handleBackdropMouseDown} onKeyDown={handleKeyDown}>
            <div
                ref={dialogRef}
                className="dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={description ? descriptionId : undefined}
            >
                <h2 id={titleId} className="dialog-title">
                    {title}
                </h2>
                {description && (
                    <p id={descriptionId} className="dialog-text">
                        {description}
                    </p>
                )}
                <div className="dialog-actions">
                    <button
                        ref={cancelRef}
                        type="button"
                        className="btn btn-secondary"
                        onClick={onCancel}
                        disabled={isBusy}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        className={tone === 'danger' ? 'btn btn-danger' : 'btn btn-primary'}
                        onClick={onConfirm}
                        disabled={isBusy}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    )
}