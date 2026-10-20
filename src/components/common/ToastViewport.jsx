import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { useAppState } from '../../context/AppStateContext.jsx'

const TOAST_ICONS = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
}

export function ToastViewport() {
    const { toasts, dismissToast } = useAppState()

    return (
        <div className="toast-viewport" aria-live="polite" aria-relevant="additions">
            {toasts.map((toast) => {
                const Icon = TOAST_ICONS[toast.type] ?? Info
                return (
                    <div key={toast.id} className={`toast toast-${toast.type}`}>
                        <Icon className="toast-icon" size={18} aria-hidden="true" />
                        <span className="toast-message">{toast.message}</span>
                        <button
                            type="button"
                            className="toast-close"
                            aria-label="Dismiss notification"
                            onClick={() => dismissToast(toast.id)}
                        >
                            <X size={14} aria-hidden="true" />
                        </button>
                    </div>
                )
            })}
        </div>
    )
}