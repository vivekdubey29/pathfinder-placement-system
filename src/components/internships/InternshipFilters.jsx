import { RotateCcw } from 'lucide-react'
import { FormField } from '../common/FormField.jsx'
import { ELIGIBILITY_OPTIONS, SORT_OPTIONS, STIPEND_OPTIONS } from '../../hooks/useInternshipFilters.js'
import { WORK_MODES, getWorkModeLabel } from '../../utils/formatters.js'

// filters, setFilter, sort, setSort, options, activeFilterCount: straight from useInternshipFilters.
export function InternshipFilters({ filters, setFilter, sort, setSort, options, activeFilterCount, onReset }) {
    return (
        <form
            className="card card-body filter-card"
            role="search"
            aria-label="Search and filter internships"
            onSubmit={(event) => event.preventDefault()}
        >
            <div className="filter-search">
                <FormField
                    id="filter-query"
                    label="Search"
                    hint="Matches title, company or skill. Short forms such as js or dsa work for skills."
                >
                    <input
                        className="input"
                        type="search"
                        value={filters.query}
                        placeholder="e.g. backend, Nexora, React"
                        onChange={(event) => setFilter('query', event.target.value)}
                    />
                </FormField>
            </div>

            <div className="filter-grid">
                <FormField id="filter-location" label="Location">
                    <select
                        className="select"
                        value={filters.location}
                        onChange={(event) => setFilter('location', event.target.value)}
                    >
                        <option value="ALL">All locations</option>
                        {options.locations.map((location) => (
                            <option key={location} value={location}>
                                {location}
                            </option>
                        ))}
                    </select>
                </FormField>

                <FormField id="filter-work-mode" label="Work mode">
                    <select
                        className="select"
                        value={filters.workMode}
                        onChange={(event) => setFilter('workMode', event.target.value)}
                    >
                        <option value="ALL">All work modes</option>
                        {WORK_MODES.map((mode) => (
                            <option key={mode} value={mode}>
                                {getWorkModeLabel(mode)}
                            </option>
                        ))}
                    </select>
                </FormField>

                <FormField id="filter-role" label="Role">
                    <select
                        className="select"
                        value={filters.role}
                        onChange={(event) => setFilter('role', event.target.value)}
                    >
                        <option value="ALL">All roles</option>
                        {options.roles.map((role) => (
                            <option key={role} value={role}>
                                {role}
                            </option>
                        ))}
                    </select>
                </FormField>

                <FormField id="filter-stipend" label="Minimum stipend">
                    <select
                        className="select"
                        value={filters.minStipend}
                        onChange={(event) => setFilter('minStipend', event.target.value)}
                    >
                        {STIPEND_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </FormField>

                <FormField id="filter-eligibility" label="Eligibility">
                    <select
                        className="select"
                        value={filters.eligibility}
                        onChange={(event) => setFilter('eligibility', event.target.value)}
                    >
                        {ELIGIBILITY_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </FormField>

                <FormField id="filter-sort" label="Sort by">
                    <select className="select" value={sort} onChange={(event) => setSort(event.target.value)}>
                        {SORT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </FormField>
            </div>

            <div className="filter-actions">
                <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={activeFilterCount === 0}
                    onClick={onReset}
                >
                    <RotateCcw size={14} aria-hidden="true" />
                    Clear filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                </button>
            </div>
        </form>
    )
}