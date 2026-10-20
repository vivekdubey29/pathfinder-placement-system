import { Link, Outlet } from 'react-router-dom'
import { BrandLogo } from '../common/BrandLogo.jsx'

function PublicHeader() {
    return (
        <header className="public-header">
            <div className="container public-header-inner">
                <BrandLogo to="/" />
                <nav className="public-nav" aria-label="Primary">
                    <ul className="public-nav-links">
                        <li>
                            <a className="public-nav-link" href="/#features">
                                Features
                            </a>
                        </li>
                        <li>
                            <a className="public-nav-link" href="/#how-it-works">
                                How it works
                            </a>
                        </li>
                        <li>
                            <Link className="public-nav-link" to="/internships">
                                Explore internships
                            </Link>
                        </li>
                    </ul>
                    <Link to="/dashboard" className="btn btn-primary btn-sm">
                        Open dashboard
                    </Link>
                </nav>
            </div>
        </header>
    )
}

function PublicFooter() {
    const year = new Date().getFullYear()

    return (
        <footer className="public-footer">
            <div className="container footer-grid">
                <div className="footer-about stack stack-sm">
                    <BrandLogo to="/" />
                    <p className="text-sm text-muted">
                        PathFinder &mdash; Smart Placement &amp; Internship System helps students find
                        internships that fit their skills, CGPA and career preferences.
                    </p>
                    <p className="text-sm text-muted">
                        This is a college demonstration project. All companies and listings are fictional, and no
                        application is ever sent to a real employer.
                    </p>
                </div>

                <nav aria-label="Product">
                    <h2 className="footer-heading">Product</h2>
                    <ul className="footer-links">
                        <li>
                            <Link to="/internships">Explore internships</Link>
                        </li>
                        <li>
                            <Link to="/recommendations">Recommendations</Link>
                        </li>
                        <li>
                            <Link to="/applications">Application tracker</Link>
                        </li>
                        <li>
                            <Link to="/profile">Student profile</Link>
                        </li>
                    </ul>
                </nav>

                <nav aria-label="About">
                    <h2 className="footer-heading">About</h2>
                    <ul className="footer-links">
                        <li>
                            <a href="/#features">Features</a>
                        </li>
                        <li>
                            <a href="/#how-it-works">How it works</a>
                        </li>
                        <li>
                            <Link to="/dashboard">Dashboard</Link>
                        </li>
                    </ul>
                </nav>
            </div>

            <div className="footer-bottom-wrap">
                <div className="container footer-bottom">
                    <span>&copy; {year} PathFinder. Frontend demonstration for a college DSA project.</span>
                    <span>No login. Demo data only.</span>
                </div>
            </div>
        </footer>
    )
}

export function PublicLayout() {
    return (
        <div className="public-layout">
            <a className="skip-link" href="#main-content">
                Skip to main content
            </a>
            <PublicHeader />
            <main id="main-content" className="public-main" tabIndex={-1}>
                <Outlet />
            </main>
            <PublicFooter />
        </div>
    )
}