import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { AlertCircle, ClipboardList, LayoutDashboard, Menu, Search, Sparkles, User, X } from 'lucide-react'
import { BrandLogo } from '../common/BrandLogo.jsx'
import { Badge } from '../common/Indicators.jsx'
import { ErrorState, LoadingState } from '../common/StateViews.jsx'
import { useAppState } from '../../context/AppStateContext.jsx'

const NAV_ITEMS = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/internships', label: 'Explore internships', icon: Search },
    { to: '/recommendations', label: 'Recommendations', icon: Sparkles },
    { to: '/applications', label: 'Application tracker', icon: ClipboardList, showCount: true },
    { to: '/profile', label: 'My profile', icon: User },
]

function getInitials(name) {
    const parts = String(name ?? '').trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return '?'
    const first = parts[0][0]
    const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
    return `${first}${last}`.toUpperCase()
}

function Sidebar({ isOpen, onNavigate, onClose }) {
    const { applicationCounts, applicationsStatus } = useAppState()
    const trackedTotal = applicationsStatus === 'ready' ? applicationCounts.total : 0

    return (
        <aside id="app-sidebar" className={`sidebar${isOpen ? ' is-open' : ''}`}>
            <div className="sidebar-brand">
                <BrandLogo to="/" onClick={onNavigate} />
                <button
                    type="button"
                    className="btn btn-ghost btn-icon btn-sm sidebar-close"
                    aria-label="Close navigation menu"
                    onClick={onClose}
                >
                    <X size={18} aria-hidden="true" />
                </button>
            </div>

            <nav aria-label="Main navigation">
                <ul className="sidebar-nav">
                    {NAV_ITEMS.map(({ to, label, icon: Icon, showCount }) => (
                        <li key={to}>
                            <NavLink
                                to={to}
                                className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}
                                onClick={onNavigate}
                            >
                                <Icon size={18} aria-hidden="true" />
                                <span>{label}</span>
                                {showCount && trackedTotal > 0 && (
                                    <span className="sidebar-count">
                    {trackedTotal}
                                        <span className="sr-only"> tracked internships</span>
                  </span>
                                )}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="sidebar-footer">
                <p className="sidebar-note">
                    Demo workspace. There is no login: the profile shown is a demonstration identity, not an
                    authenticated account.
                </p>
                <Link to="/" className="text-link text-sm" onClick={onNavigate}>
                    Back to home page
                </Link>
            </div>
        </aside>
    )
}

function TopBar({ isNavOpen, onMenuClick }) {
    const { student, isMockMode } = useAppState()

    return (
        <header className="topbar">
            <button
                type="button"
                className="btn btn-secondary btn-icon topbar-menu-button"
                aria-label="Open navigation menu"
                aria-expanded={isNavOpen}
                aria-controls="app-sidebar"
                onClick={onMenuClick}
            >
                <Menu size={20} aria-hidden="true" />
            </button>

            <div className="topbar-spacer" />

            <Badge tone="info" className="mode-pill">
                {isMockMode ? 'Mock data mode' : 'Backend API mode'}
            </Badge>

            <Link to="/profile" className="topbar-user" aria-label="Open your profile">
        <span className="avatar" aria-hidden="true">
          {getInitials(student?.fullName)}
        </span>
                <span className="topbar-user-text">
          <span className="topbar-user-name">{student?.fullName ?? 'Loading\u2026'}</span>
          <span className="topbar-user-meta">Demo profile</span>
        </span>
            </Link>
        </header>
    )
}

export function AppShell() {
    const { pathname } = useLocation()
    const [isNavOpen, setIsNavOpen] = useState(false)
    const {
        profileStatus,
        profileError,
        reloadProfile,
        applicationsStatus,
        applicationsError,
        reloadApplications,
    } = useAppState()

    // Each page starts at the top when you navigate.
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [pathname])

    // Escape closes the mobile menu.
    useEffect(() => {
        if (!isNavOpen) return undefined
        function handleKeyDown(event) {
            if (event.key === 'Escape') setIsNavOpen(false)
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [isNavOpen])

    const closeNav = () => setIsNavOpen(false)

    // Pages inside the shell can assume `student` exists once this renders <Outlet />.
    let content
    if (profileStatus === 'loading') {
        content = <LoadingState label="Loading your profile\u2026" />
    } else if (profileStatus === 'error') {
        content = (
            <ErrorState title="Could not load your profile" error={profileError} onRetry={reloadProfile} />
        )
    } else {
        content = <Outlet />
    }

    const showTrackerWarning = profileStatus === 'ready' && applicationsStatus === 'error'

    return (
        <div className="app-shell">
            <a className="skip-link" href="#main-content">
                Skip to main content
            </a>

            <Sidebar isOpen={isNavOpen} onNavigate={closeNav} onClose={closeNav} />
            {isNavOpen && <div className="sidebar-backdrop" onClick={closeNav} aria-hidden="true" />}

            <div className="app-main">
                <TopBar isNavOpen={isNavOpen} onMenuClick={() => setIsNavOpen(true)} />
                <main id="main-content" className="app-content" tabIndex={-1}>
                    <div className="app-content-inner">
                        {showTrackerWarning && (
                            <div className="alert alert-warning app-notice" role="alert">
                                <AlertCircle size={18} aria-hidden="true" />
                                <div className="grow">
                                    <strong>Your tracker could not be loaded.</strong>{' '}
                                    {applicationsError instanceof Error ? applicationsError.message : 'Please try again.'}
                                </div>
                                <button type="button" className="btn btn-secondary btn-sm" onClick={reloadApplications}>
                                    Retry
                                </button>
                            </div>
                        )}
                        {content}
                    </div>
                </main>
            </div>
        </div>
    )
}