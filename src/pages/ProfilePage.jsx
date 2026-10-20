import { useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react'
import { ConfirmDialog } from '../components/common/ConfirmDialog.jsx'
import { FormField, TagInput } from '../components/common/FormField.jsx'
import { PageHeader } from '../components/common/PageHeader.jsx'
import { DemoDataNotice } from '../components/common/StateViews.jsx'
import { PanelCard, ProfileCompleteness } from '../components/dashboard/ProfilePanels.jsx'
import { useAppState } from '../context/AppStateContext.jsx'
import { useDocumentTitle } from '../hooks/commonHooks.js'
import {
    DEGREE_OPTIONS,
    LOCATION_OPTIONS,
    ROLE_CATEGORIES,
    WORK_MODE_LABELS,
    WORK_MODE_PREFERENCES,
    formatDate,
} from '../utils/formatters.js'
import { SKILL_SUGGESTIONS } from '../utils/matchingUtils.js'
import { hasErrors, validateProfile } from '../utils/validators.js'

const FIELD_ORDER = [
    'fullName',
    'email',
    'college',
    'degree',
    'graduationYear',
    'cgpa',
    'skills',
    'preferredRoles',
    'preferredLocations',
    'workModePreference',
]

// Form state uses strings for the numeric inputs; the validators and service accept that.
function toDraft(student) {
    return {
        fullName: student.fullName ?? '',
        email: student.email ?? '',
        college: student.college ?? '',
        degree: student.degree ?? '',
        graduationYear: String(student.graduationYear ?? ''),
        cgpa: String(student.cgpa ?? ''),
        skills: [...(student.skills ?? [])],
        preferredRoles: [...(student.preferredRoles ?? [])],
        preferredLocations: [...(student.preferredLocations ?? [])],
        workModePreference: student.workModePreference ?? 'ANY',
        resumeFileName: student.resumeFileName ?? '',
    }
}

// Role and location order does not matter, so sort those before comparing.
function signature(draft) {
    return JSON.stringify({
        ...draft,
        preferredRoles: [...draft.preferredRoles].sort(),
        preferredLocations: [...draft.preferredLocations].sort(),
    })
}

function CheckboxGroup({ id, legend, options, selected, onChange, error, hint, required = false }) {
    const hintId = hint ? `${id}-hint` : undefined
    const errorId = error ? `${id}-error` : undefined
    const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined
    // Keep any saved value that is not in the standard list so it is never silently dropped.
    const allOptions = [...options, ...selected.filter((item) => !options.includes(item))]

    function toggle(option) {
        const next = new Set(selected)
        if (next.has(option)) next.delete(option)
        else next.add(option)
        onChange(allOptions.filter((item) => next.has(item)))
    }

    return (
        <fieldset id={id} className="fieldset" tabIndex={-1} aria-describedby={describedBy}>
            <legend className="field-label">
                {legend}
                {required && (
                    <span className="field-required" aria-hidden="true">
            *
          </span>
                )}
            </legend>
            {hint && (
                <p id={hintId} className="field-hint">
                    {hint}
                </p>
            )}
            <div className="check-grid">
                {allOptions.map((option) => (
                    <label key={option} className="check-row">
                        <input type="checkbox" checked={selected.includes(option)} onChange={() => toggle(option)} />
                        {option}
                    </label>
                ))}
            </div>
            {error && (
                <span id={errorId} className="field-error">
          {error}
        </span>
            )}
        </fieldset>
    )
}

function ProfileForm({ student }) {
    const { saveProfile, showToast, isMockMode, resetDemo } = useAppState()

    const baseline = useMemo(() => toDraft(student), [student])
    const [draft, setDraft] = useState(baseline)
    const [errors, setErrors] = useState({})
    const [formError, setFormError] = useState('')
    const [savedMessage, setSavedMessage] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [resetOpen, setResetOpen] = useState(false)
    const [isResetting, setIsResetting] = useState(false)

    const isDirty = signature(draft) !== signature(baseline)

    function setField(name, value) {
        setDraft((current) => ({ ...current, [name]: value }))
        setSavedMessage('')
        if (errors[name]) {
            setErrors((current) => {
                const next = { ...current }
                delete next[name]
                return next
            })
        }
    }

    function focusFirstError(validation) {
        const first = FIELD_ORDER.find((key) => validation[key])
        if (first) document.getElementById(`profile-${first}`)?.focus()
    }

    function handleDiscard() {
        setDraft(baseline)
        setErrors({})
        setFormError('')
        setSavedMessage('')
    }

    async function handleSubmit(event) {
        event.preventDefault()
        if (isSaving) return
        setFormError('')
        setSavedMessage('')

        const validation = validateProfile(draft)
        if (hasErrors(validation)) {
            setErrors(validation)
            setFormError('Please fix the highlighted fields and try again.')
            focusFirstError(validation)
            return
        }

        setIsSaving(true)
        try {
            const saved = await saveProfile(draft)
            setDraft(toDraft(saved))
            setErrors({})
            setSavedMessage('Profile saved. Your recommendations will use these details.')
            showToast('Profile saved.', 'success')
        } catch (error) {
            if (error?.status === 422 && error.details && typeof error.details === 'object') {
                setErrors(error.details)
                setFormError('Please fix the highlighted fields and try again.')
                focusFirstError(error.details)
            } else {
                setFormError(error instanceof Error ? error.message : 'Your profile could not be saved.')
            }
        } finally {
            setIsSaving(false)
        }
    }

    function handleResumeChange(event) {
        const file = event.target.files?.[0]
        if (file) setField('resumeFileName', file.name)
        event.target.value = '' // lets the same file be chosen again later
    }

    async function handleReset() {
        setIsResetting(true)
        const ok = await resetDemo()
        // On success the shell reloads the profile and remounts this page with fresh values.
        setIsResetting(false)
        if (ok) setResetOpen(false)
    }

    return (
        <div className="profile-layout">
            <form className="profile-form" onSubmit={handleSubmit} noValidate>
                <section className="card" aria-labelledby="personal-title">
                    <div className="card-header">
                        <h2 id="personal-title" className="card-title">
                            Personal details
                        </h2>
                    </div>
                    <div className="card-body form-grid">
                        <FormField id="profile-fullName" label="Full name" error={errors.fullName} required>
                            <input
                                className="input"
                                type="text"
                                autoComplete="name"
                                value={draft.fullName}
                                onChange={(event) => setField('fullName', event.target.value)}
                            />
                        </FormField>
                        <FormField id="profile-email" label="Email" error={errors.email} required>
                            <input
                                className="input"
                                type="email"
                                autoComplete="email"
                                value={draft.email}
                                onChange={(event) => setField('email', event.target.value)}
                            />
                        </FormField>
                    </div>
                </section>

                <section className="card" aria-labelledby="academic-title">
                    <div className="card-header">
                        <h2 id="academic-title" className="card-title">
                            Academic details
                        </h2>
                    </div>
                    <div className="card-body form-grid">
                        <div className="span-2">
                            <FormField id="profile-college" label="College or university" error={errors.college} required>
                                <input
                                    className="input"
                                    type="text"
                                    value={draft.college}
                                    onChange={(event) => setField('college', event.target.value)}
                                />
                            </FormField>
                        </div>
                        <FormField id="profile-degree" label="Degree" error={errors.degree} required>
                            <select
                                className="select"
                                value={draft.degree}
                                onChange={(event) => setField('degree', event.target.value)}
                            >
                                <option value="">Select degree</option>
                                {DEGREE_OPTIONS.map((degree) => (
                                    <option key={degree} value={degree}>
                                        {degree}
                                    </option>
                                ))}
                            </select>
                        </FormField>
                        <FormField id="profile-graduationYear" label="Graduation year" error={errors.graduationYear} required>
                            <input
                                className="input"
                                type="number"
                                inputMode="numeric"
                                step="1"
                                value={draft.graduationYear}
                                onChange={(event) => setField('graduationYear', event.target.value)}
                            />
                        </FormField>
                        <FormField
                            id="profile-cgpa"
                            label="CGPA (out of 10)"
                            hint="Used for eligibility checks. Listings with a higher minimum CGPA are marked Not eligible."
                            error={errors.cgpa}
                            required
                        >
                            <input
                                className="input"
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                min="0"
                                max="10"
                                value={draft.cgpa}
                                onChange={(event) => setField('cgpa', event.target.value)}
                            />
                        </FormField>
                    </div>
                </section>

                <section className="card" aria-labelledby="skills-prefs-title">
                    <div className="card-header">
                        <h2 id="skills-prefs-title" className="card-title">
                            Skills and preferences
                        </h2>
                    </div>
                    <div className="card-body stack stack-lg">
                        <FormField
                            id="profile-skills"
                            label="Technical skills"
                            hint="Press Enter or comma to add a skill. Short forms such as js or dsa are recognised when matching."
                            error={errors.skills}
                            required
                        >
                            <TagInput
                                value={draft.skills}
                                onChange={(next) => setField('skills', next)}
                                suggestions={SKILL_SUGGESTIONS}
                            />
                        </FormField>

                        <CheckboxGroup
                            id="profile-preferredRoles"
                            legend="Preferred roles"
                            options={ROLE_CATEGORIES}
                            selected={draft.preferredRoles}
                            onChange={(next) => setField('preferredRoles', next)}
                            error={errors.preferredRoles}
                            required
                        />

                        <CheckboxGroup
                            id="profile-preferredLocations"
                            legend="Preferred locations"
                            hint="Optional if your work mode preference is Remote."
                            options={LOCATION_OPTIONS}
                            selected={draft.preferredLocations}
                            onChange={(next) => setField('preferredLocations', next)}
                            error={errors.preferredLocations}
                        />

                        <FormField
                            id="profile-workModePreference"
                            label="Work mode preference"
                            error={errors.workModePreference}
                            required
                        >
                            <select
                                className="select"
                                value={draft.workModePreference}
                                onChange={(event) => setField('workModePreference', event.target.value)}
                            >
                                {WORK_MODE_PREFERENCES.map((mode) => (
                                    <option key={mode} value={mode}>
                                        {WORK_MODE_LABELS[mode]}
                                    </option>
                                ))}
                            </select>
                        </FormField>
                    </div>
                </section>

                <section className="card" aria-labelledby="resume-title">
                    <div className="card-header">
                        <h2 id="resume-title" className="card-title">
                            Resume
                        </h2>
                    </div>
                    <div className="card-body stack">
                        <FormField
                            id="profile-resumeFileName"
                            label="Choose a resume file"
                            hint="Only the file name is recorded, to show your profile as complete. The file itself is never uploaded or stored, and no employer receives it."
                        >
                            <input className="input" type="file" accept=".pdf,.doc,.docx" onChange={handleResumeChange} />
                        </FormField>
                        <div className="resume-current">
                            {draft.resumeFileName ? (
                                <>
                  <span className="text-sm">
                    Recorded file name: <strong>{draft.resumeFileName}</strong>
                  </span>
                                    <button
                                        type="button"
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => setField('resumeFileName', '')}
                                    >
                                        Remove file name
                                    </button>
                                </>
                            ) : (
                                <span className="text-sm text-muted">No resume file name recorded.</span>
                            )}
                        </div>
                    </div>
                </section>

                <div className="form-footer">
                    {formError && (
                        <div className="alert alert-danger" role="alert">
                            <AlertCircle size={18} aria-hidden="true" />
                            <p>{formError}</p>
                        </div>
                    )}
                    {savedMessage && !formError && (
                        <div className="alert alert-success" role="status">
                            <CheckCircle2 size={18} aria-hidden="true" />
                            <p>{savedMessage}</p>
                        </div>
                    )}
                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary" disabled={!isDirty || isSaving}>
                            {isSaving ? 'Saving…' : 'Save changes'}
                        </button>
                        <button type="button" className="btn btn-secondary" disabled={!isDirty || isSaving} onClick={handleDiscard}>
                            Discard changes
                        </button>
                        {isDirty && !isSaving && <span className="text-sm text-muted">You have unsaved changes.</span>}
                    </div>
                </div>
            </form>

            <aside className="profile-aside" aria-label="Profile status">
                <ProfileCompleteness student={student} showLink={false} />

                <PanelCard id="profile-use-title" title="How this profile is used">
                    <div className="card-body stack stack-sm">
                        <p className="text-sm">
                            {isMockMode
                                ? 'Your details are saved in this browser only and are used by the placeholder scorer to rank the demonstration listings.'
                                : 'Your details are sent to the connected backend, which produces your recommendations.'}
                        </p>
                        <p className="text-sm text-muted">
                            This is a demonstration. Your profile is not shared with any employer. Last saved:{' '}
                            {formatDate(student.updatedAt)}.
                        </p>
                        {isMockMode && (
                            <div>
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setResetOpen(true)}>
                                    <RotateCcw size={14} aria-hidden="true" />
                                    Reset demo data
                                </button>
                            </div>
                        )}
                    </div>
                </PanelCard>
            </aside>

            <ConfirmDialog
                open={resetOpen}
                title="Reset demo data?"
                description="This restores the original demo profile and tracker records in this browser. Any profile edits, bookmarks and status changes you made will be lost."
                confirmLabel="Reset demo data"
                tone="danger"
                isBusy={isResetting}
                onConfirm={handleReset}
                onCancel={() => setResetOpen(false)}
            />
        </div>
    )
}

function ProfilePage() {
    useDocumentTitle('My profile')
    const { student } = useAppState()

    return (
        <div className="stack stack-lg">
            <PageHeader
                title="My profile"
                description="Your academic details, skills and preferences drive eligibility checks and recommendations."
            />
            <DemoDataNotice />
            <ProfileForm student={student} />
        </div>
    )
}

export default ProfilePage