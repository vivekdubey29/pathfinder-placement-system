import { Link, useLocation } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { BrandLogo } from '../components/common/BrandLogo.jsx'
import { useDocumentTitle } from '../hooks/commonHooks.js'

function NotFoundPage() {
    const { pathname } = useLocation()
    useDocumentTitle('Page not found')

    return (
        <main id="main-content" className="notfound">
            <div className="notfound-card card">
                <BrandLogo to="/" />
                <span className="state-icon">
          <Compass size={24} aria-hidden="true" />
        </span>
                <h1 className="notfound-title">Page not found</h1>
                <p className="text-muted">
                    There is no page at <code className="notfound-path">{pathname}</code>. The address may be
                    mistyped, or the page may have moved.
                </p>
                <div className="row row-wrap notfound-actions">
                    <Link to="/" className="btn btn-primary">
                        Back to home page
                    </Link>
                    <Link to="/internships" className="btn btn-secondary">
                        Explore internships
                    </Link>
                </div>
            </div>
        </main>
    )
}

export default NotFoundPage