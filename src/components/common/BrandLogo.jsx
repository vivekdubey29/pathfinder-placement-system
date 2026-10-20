import { Link } from 'react-router-dom'

function LogoMark() {
    return (
        <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
            <rect width="32" height="32" rx="8" fill="#0b2a5b" />
            <path d="M9 22 L16 7 L23 22 L16 18 Z" fill="#ffffff" />
        </svg>
    )
}

export function BrandLogo({ to = '/', className = '', onClick }) {
    const classes = `brand ${className}`.trim()

    if (!to) {
        return (
            <span className={classes}>
        <LogoMark />
        <span>PathFinder</span>
      </span>
        )
    }

    return (
        <Link to={to} className={classes} aria-label="PathFinder home" onClick={onClick}>
            <LogoMark />
            <span>PathFinder</span>
        </Link>
    )
}