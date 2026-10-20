import { cloneElement, isValidElement, useId, useState } from 'react'
import { X } from 'lucide-react'

// Wraps exactly ONE control element (input, select, textarea or TagInput).
// FormField injects id, aria-invalid, aria-describedby and aria-required into it.
//
//   <FormField id="cgpa" label="CGPA" error={errors.cgpa} required>
//     <input className="input" value={...} onChange={...} />
//   </FormField>
export function FormField({ id, label, hint, error, required = false, children }) {
    const hintId = hint ? `${id}-hint` : undefined
    const errorId = error ? `${id}-error` : undefined
    const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

    const control = isValidElement(children)
        ? cloneElement(children, {
            id,
            'aria-invalid': error ? 'true' : undefined,
            'aria-describedby': describedBy,
            'aria-required': required ? 'true' : undefined,
        })
        : children

    return (
        <div className="field">
            <label className="field-label" htmlFor={id}>
                {label}
                {required && (
                    <span className="field-required" aria-hidden="true">
            *
          </span>
                )}
            </label>
            {control}
            {hint && (
                <span id={hintId} className="field-hint">
          {hint}
        </span>
            )}
            {error && (
                <span id={errorId} className="field-error">
          {error}
        </span>
            )}
        </div>
    )
}

const MAX_TAG_LENGTH = 40

// Controlled list-of-strings input.
//   value: string[]    onChange: (nextList) => void
//   suggestions: optional list shown as browser autocomplete; matching input is
//   converted to the suggestion's spelling (typing "java" adds "Java").
// Enter or a comma adds the typed text; Backspace on an empty box removes the last
// item; leaving the box also adds whatever was typed so nothing is lost on Save.
export function TagInput({
                             id,
                             value = [],
                             onChange,
                             suggestions = [],
                             placeholder = 'Type a skill and press Enter',
                             maxItems = 30,
                             itemLabel = 'skill',
                             ...ariaProps
                         }) {
    const generatedId = useId()
    const inputId = id ?? generatedId
    const listId = `${inputId}-suggestions`
    const [draft, setDraft] = useState('')
    const isFull = value.length >= maxItems

    function commitDraft(rawText) {
        const parts = rawText
            .split(',')
            .map((part) => part.trim())
            .filter(Boolean)
        if (parts.length === 0) return

        const next = [...value]
        const knownKeys = new Set(next.map((item) => item.toLowerCase()))

        parts.forEach((part) => {
            if (next.length >= maxItems) return
            const text = part.slice(0, MAX_TAG_LENGTH)
            const canonical = suggestions.find((item) => item.toLowerCase() === text.toLowerCase()) ?? text
            const key = canonical.toLowerCase()
            if (knownKeys.has(key)) return
            knownKeys.add(key)
            next.push(canonical)
        })

        onChange(next)
        setDraft('')
    }

    function removeItem(item) {
        onChange(value.filter((existing) => existing !== item))
    }

    function handleKeyDown(event) {
        if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault() // also stops Enter from submitting the surrounding form
            commitDraft(draft)
        } else if (event.key === 'Backspace' && draft === '' && value.length > 0) {
            onChange(value.slice(0, -1))
        }
    }

    const availableSuggestions = suggestions.filter(
        (item) => !value.some((existing) => existing.toLowerCase() === item.toLowerCase()),
    )

    return (
        <div className="tag-input">
            <div className="tag-input-row">
                <input
                    id={inputId}
                    className="input"
                    type="text"
                    value={draft}
                    placeholder={isFull ? `Maximum of ${maxItems} ${itemLabel}s reached` : placeholder}
                    disabled={isFull}
                    autoComplete="off"
                    list={availableSuggestions.length > 0 ? listId : undefined}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={() => commitDraft(draft)}
                    {...ariaProps}
                />
                <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={isFull || draft.trim() === ''}
                    onClick={() => commitDraft(draft)}
                >
                    Add
                </button>
            </div>

            {availableSuggestions.length > 0 && (
                <datalist id={listId}>
                    {availableSuggestions.map((item) => (
                        <option key={item} value={item} />
                    ))}
                </datalist>
            )}

            {value.length > 0 ? (
                <ul className="chip-list" aria-label={`Selected ${itemLabel}s`}>
                    {value.map((item) => (
                        <li key={item}>
              <span className="chip">
                {item}
                  <button
                      type="button"
                      className="chip-remove"
                      aria-label={`Remove ${item}`}
                      onClick={() => removeItem(item)}
                  >
                  <X size={12} aria-hidden="true" />
                </button>
              </span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="field-hint">No {itemLabel}s added yet.</p>
            )}
        </div>
    )
}