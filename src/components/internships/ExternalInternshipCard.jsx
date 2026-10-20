import { ExternalLink, MapPin, Briefcase, DollarSign, Tag, Building2 } from 'lucide-react'

/**
 * Card component for a single listing from the Himalayas Remote Jobs API.
 *
 * Intentionally distinct from InternshipCard:
 *  - No match score or PathFinder eligibility badge
 *  - "Apply on Himalayas" external link
 *  - Himalayas source attribution
 *  - Handles missing optional fields gracefully (salary, locations, tags)
 */
export function ExternalInternshipCard({ listing }) {
    const {
        title,
        companyName,
        companyLogo,
        locations = [],
        employmentType,
        salaryMin,
        salaryMax,
        salaryCurrency,
        tags = [],
        postedAt,
        applicationLink,
    } = listing

    const hasSalary = salaryMin != null || salaryMax != null

    function formatSalary() {
        const currency = salaryCurrency ?? 'USD'
        const fmt = (n) =>
            new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency,
                maximumFractionDigits: 0,
            }).format(n)
        if (salaryMin != null && salaryMax != null) {
            return `${fmt(salaryMin)} – ${fmt(salaryMax)} / yr`
        }
        if (salaryMin != null) return `From ${fmt(salaryMin)} / yr`
        return `Up to ${fmt(salaryMax)} / yr`
    }

    // Show at most 5 readable tag labels (slugs → display text)
    const visibleTags = tags
        .slice(0, 5)
        .map((slug) => slug.replace(/-/g, ' '))

    const locationLabel =
        locations.length > 0 ? locations.join(', ') : 'Remote / Unspecified'

    return (
        <article className="internship-card external-internship-card">
            {/* Header */}
            <div className="card-header">
                <div className="company-info">
                    {companyLogo ? (
                        <img
                            src={companyLogo}
                            alt={companyName ? `${companyName} logo` : 'Company logo'}
                            className="company-logo"
                            width={40}
                            height={40}
                            onError={(e) => {
                                e.currentTarget.style.display = 'none'
                            }}
                        />
                    ) : (
                        <span className="company-logo-placeholder" aria-hidden="true">
                            <Building2 size={20} />
                        </span>
                    )}
                    <div>
                        <h3 className="card-title">{title}</h3>
                        {companyName && (
                            <p className="company-name">{companyName}</p>
                        )}
                    </div>
                </div>

                {/* Source badge */}
                <span className="badge badge-external" title="Live listing from Himalayas">
                    Live · Himalayas
                </span>
            </div>

            {/* Meta */}
            <ul className="card-meta" aria-label="Job details">
                <li>
                    <MapPin size={14} aria-hidden="true" />
                    <span>{locationLabel}</span>
                </li>
                {employmentType && (
                    <li>
                        <Briefcase size={14} aria-hidden="true" />
                        <span>{employmentType}</span>
                    </li>
                )}
                {hasSalary && (
                    <li>
                        <DollarSign size={14} aria-hidden="true" />
                        <span>{formatSalary()}</span>
                    </li>
                )}
                {postedAt && (
                    <li>
                        <span className="text-subtle">
                            Posted{' '}
                            {new Date(postedAt).toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                            })}
                        </span>
                    </li>
                )}
            </ul>

            {/* Tags / Skills */}
            {visibleTags.length > 0 && (
                <div className="card-tags" aria-label="Categories">
                    <Tag size={12} aria-hidden="true" />
                    {visibleTags.map((tag) => (
                        <span key={tag} className="tag">
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Eligibility disclaimer */}
            <p className="eligibility-unknown text-subtle text-xs">
                PathFinder eligibility: not available for external listings.
            </p>

            {/* Action */}
            <div className="card-actions">
                <a
                    href={applicationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    aria-label={`Apply for ${title} on Himalayas (opens in new tab)`}
                >
                    Apply on Himalayas
                    <ExternalLink size={14} aria-hidden="true" />
                </a>
            </div>
        </article>
    )
}
