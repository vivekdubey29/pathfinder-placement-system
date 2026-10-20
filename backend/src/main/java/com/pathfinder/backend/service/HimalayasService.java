package com.pathfinder.backend.service;

import com.pathfinder.backend.exception.ExternalServiceException;
import com.pathfinder.backend.model.ExternalInternship;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Fetches internship / job listings from the public Himalayas Remote Jobs API
 * (https://himalayas.app/docs/remote-jobs-api).
 *
 * <p>The external API requires no authentication key. To avoid hitting rate limits
 * and to keep response times fast, results are cached in memory for
 * {@value #CACHE_TTL_MS} ms (15 minutes).  A single cache entry is shared across
 * all concurrent requests; a {@code synchronized} guard ensures only one thread
 * performs a refresh at a time.
 *
 * <p>Actual field names were confirmed from a live API probe:
 * <pre>
 *   guid              — canonical listing URL used as stable ID
 *   title             — job title
 *   companyName       — employer name
 *   companyLogo       — CDN logo URL (may be null)
 *   locationRestrictions — List&lt;String&gt; of geographic restrictions
 *   employmentType    — "Intern", "Full-Time", etc.
 *   minSalary / maxSalary — integers (may be null)
 *   currency          — ISO 4217 code (may be null)
 *   categories        — List&lt;String&gt; of category slugs
 *   applicationLink   — direct apply URL
 *   pubDate           — Unix epoch seconds
 * </pre>
 */
@Service
public class HimalayasService {

    // ---------- configuration ---------------------------------------------------

    private static final String SEARCH_URL =
            "https://himalayas.app/jobs/api/search?q=software+intern&limit=20";

    /** Cache lives for 15 minutes. */
    private static final long CACHE_TTL_MS = 15L * 60 * 1000;

    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd").withZone(ZoneOffset.UTC);

    // ---------- state ------------------------------------------------------------

    private final RestTemplate restTemplate;

    /** Cached listing payload. {@code null} means the cache has not been populated yet. */
    private volatile List<ExternalInternship> cache = null;
    /** Epoch millis when {@link #cache} was last populated. */
    private volatile long cacheTime = 0L;

    // ---------- constructor ------------------------------------------------------

    public HimalayasService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5_000);  // 5 s
        factory.setReadTimeout(10_000);    // 10 s
        this.restTemplate = new RestTemplate(factory);
    }

    // ---------- public API -------------------------------------------------------

    /**
     * Returns the cached list of external internship listings, refreshing the cache
     * if it is absent or stale.
     *
     * @throws ExternalServiceException if the upstream API call fails.
     */
    public List<ExternalInternship> fetchInternships() {
        refreshIfNeeded();
        return cache;
    }

    // ---------- cache management -------------------------------------------------

    private synchronized void refreshIfNeeded() {
        long now = System.currentTimeMillis();
        if (cache != null && (now - cacheTime) < CACHE_TTL_MS) {
            return; // Cache is still fresh.
        }
        cache = callHimalayasApi();
        cacheTime = System.currentTimeMillis();
    }

    // ---------- HTTP + mapping ---------------------------------------------------

    @SuppressWarnings("unchecked")
    private List<ExternalInternship> callHimalayasApi() {
        ResponseEntity<Map> response;
        try {
            response = restTemplate.getForEntity(SEARCH_URL, Map.class);
        } catch (RestClientException ex) {
            throw new ExternalServiceException(
                    "Unable to reach the Himalayas job listings service. Please try again later.", ex);
        }

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new ExternalServiceException(
                    "Himalayas API returned an unexpected response. Please try again later.");
        }

        Object jobsObj = response.getBody().get("jobs");
        if (!(jobsObj instanceof List<?> rawJobs)) {
            throw new ExternalServiceException(
                    "Himalayas API response did not contain a jobs list.");
        }

        List<ExternalInternship> results = new ArrayList<>();
        for (Object entry : rawJobs) {
            if (entry instanceof Map<?, ?> job) {
                ExternalInternship listing = mapJob((Map<String, Object>) job);
                if (listing != null) {
                    results.add(listing);
                }
            }
        }
        return results;
    }

    /**
     * Maps a single Himalayas job object to {@link ExternalInternship}.
     * Returns {@code null} if the minimum required fields (title, applicationLink) are absent.
     */
    @SuppressWarnings("unchecked")
    private ExternalInternship mapJob(Map<String, Object> job) {
        String title = stringOrNull(job, "title");
        String applicationLink = stringOrNull(job, "applicationLink");
        if (title == null || applicationLink == null) {
            return null; // Skip malformed entries.
        }

        // Stable ID: use the canonical guid URL.
        String id = stringOrNull(job, "guid");
        if (id == null) id = applicationLink;

        // Salary (integers in the JSON — Jackson deserializes them as Integer or Long).
        Integer salaryMin = intOrNull(job, "minSalary");
        Integer salaryMax = intOrNull(job, "maxSalary");
        String currency   = stringOrNull(job, "currency");

        // pubDate is a Unix epoch in seconds.
        String postedAt = null;
        Object pubDateObj = job.get("pubDate");
        if (pubDateObj instanceof Number num) {
            postedAt = DATE_FMT.format(Instant.ofEpochSecond(num.longValue()));
        }

        // locationRestrictions is a List<String> (may be null or absent).
        List<String> locations = listOrEmpty(job, "locationRestrictions");

        // categories is a List<String> of slug strings.
        List<String> tags = listOrEmpty(job, "categories");

        return new ExternalInternship(
                id,
                title,
                stringOrNull(job, "companyName"),
                stringOrNull(job, "companyLogo"),
                locations,
                stringOrNull(job, "employmentType"),
                salaryMin,
                salaryMax,
                (salaryMin != null || salaryMax != null) ? currency : null,
                tags,
                postedAt,
                applicationLink,
                "himalayas"
        );
    }

    // ---------- helpers ----------------------------------------------------------

    private static String stringOrNull(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return (val instanceof String s && !s.isBlank()) ? s : null;
    }

    private static Integer intOrNull(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val instanceof Number n) {
            int i = n.intValue();
            return i > 0 ? i : null;
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private static List<String> listOrEmpty(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val instanceof List<?> raw) {
            List<String> out = new ArrayList<>();
            for (Object item : raw) {
                if (item instanceof String s && !s.isBlank()) {
                    out.add(s);
                }
            }
            return out;
        }
        return List.of();
    }
}
