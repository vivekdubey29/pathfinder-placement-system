package com.pathfinder.backend.model;

import java.util.List;

/**
 * Lightweight view of a job listing fetched from the Himalayas Remote Jobs API.
 *
 * Field names intentionally differ from {@link Internship} to make it clear these
 * are external, unverified records that cannot have PathFinder eligibility calculated.
 *
 * Actual Himalayas API field names confirmed from a live probe (2026-10-20):
 *   guid, title, companyName, companyLogo, locationRestrictions, employmentType,
 *   minSalary, maxSalary, currency, categories, applicationLink, pubDate (Unix epoch).
 */
public record ExternalInternship(
        /** Himalayas canonical URL used as a stable unique identifier (guid field). */
        String id,
        String title,
        String companyName,
        /** Absolute CDN URL for the company logo, or null when unavailable. */
        String companyLogo,
        /** Geographic / remote restriction strings, e.g. ["Worldwide"], ["United States"]. */
        List<String> locations,
        /** e.g. "Intern", "Full-Time", "Part-Time". */
        String employmentType,
        /** Minimum salary figure in {@code salaryCurrency}, or null. */
        Integer salaryMin,
        /** Maximum salary figure in {@code salaryCurrency}, or null. */
        Integer salaryMax,
        /** ISO 4217 currency code, e.g. "USD". Null when salary is absent. */
        String salaryCurrency,
        /** Himalayas category slugs, e.g. ["Software-Engineer-Intern", "Backend-Development"]. */
        List<String> tags,
        /** ISO-8601 date string derived from the pubDate Unix epoch, e.g. "2026-10-01". */
        String postedAt,
        /** Direct application / listing URL on himalayas.app (includes utm_source=api). */
        String applicationLink,
        /** Always "himalayas" — used by the frontend to render correct attribution. */
        String source
) {}
