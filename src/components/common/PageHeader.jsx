import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

// actions: any React node (usually buttons or links) shown on the right.
// backTo: a route path. When set, a "back" link appears above the title.
export function PageHeader({ title, description, actions, backTo, backLabel = 'Back' }) {
    return (
        <header className="page-header">
            <div className="page-header-text">
                {backTo && (
                    <Link to={backTo} className="back-link">
                        <ArrowLeft size={16} aria-hidden="true" />
                        {backLabel}
                    </Link>
                )}
                <h1 className="page-title">{title}</h1>
                {description && <p className="page-description">{description}</p>}
            </div>
            {actions && <div className="page-actions">{actions}</div>}
        </header>
    )
}