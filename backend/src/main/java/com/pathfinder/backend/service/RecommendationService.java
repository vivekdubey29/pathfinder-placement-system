package com.pathfinder.backend.service;

import com.pathfinder.backend.model.Eligibility;
import com.pathfinder.backend.model.Internship;
import com.pathfinder.backend.model.Student;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Java recommendation engine — Phase 4.
 *
 * <p>Reproduces the same weighted-scoring algorithm used by the frontend's
 * {@code mockRecommendationEngine.js} so the transition from mock to real API
 * mode produces identical rankings and explanations.
 *
 * <h2>Algorithm summary</h2>
 * <ol>
 *   <li>Normalise skill strings (alias expansion, lower-case).</li>
 *   <li>Score each internship across 6 factors (see {@code WEIGHTS}).</li>
 *   <li>Sort: eligible listings first, then descending score, then internship ID
 *       for a stable tie-break.</li>
 *   <li>Assign 1-based ranks.</li>
 * </ol>
 *
 * <h2>Data structures</h2>
 * <ul>
 *   <li>{@code HashSet<String>} — O(1) membership tests for the student's
 *       normalised skills (used in {@link #compareSkills}).</li>
 *   <li>{@code HashMap<String,String>} — O(1) alias look-up during normalisation.</li>
 *   <li>{@code PriorityQueue} is NOT used here because we sort a small fixed list
 *       (≤ 24 items) once; {@link List#sort} with a {@link Comparator} is cleaner
 *       and equally fast for this size.</li>
 * </ul>
 */
@Service
public class RecommendationService {

    // ---- Weights (must sum to 100) ----

    private static final double W_REQUIRED_SKILLS  = 50;
    private static final double W_PREFERRED_SKILLS = 10;
    private static final double W_ROLE             = 15;
    private static final double W_LOCATION         = 10;
    private static final double W_WORK_MODE        = 10;
    private static final double W_CGPA             =  5;

    // ---- Skill alias map ---- (mirrors matchingUtils.js SKILL_ALIASES)
    // HashMap: O(1) look-up.

    private static final Map<String, String> SKILL_ALIASES = new HashMap<>();
    static {
        SKILL_ALIASES.put("js",                   "javascript");
        SKILL_ALIASES.put("reactjs",              "react");
        SKILL_ALIASES.put("react.js",             "react");
        SKILL_ALIASES.put("node",                 "node.js");
        SKILL_ALIASES.put("nodejs",               "node.js");
        SKILL_ALIASES.put("py",                   "python");
        SKILL_ALIASES.put("postgres",             "sql");
        SKILL_ALIASES.put("postgresql",           "sql");
        SKILL_ALIASES.put("mysql",                "sql");
        SKILL_ALIASES.put("dsa",                  "data structures");
        SKILL_ALIASES.put("oop",                  "object-oriented programming");
        SKILL_ALIASES.put("oops",                 "object-oriented programming");
        SKILL_ALIASES.put("springboot",           "spring boot");
        SKILL_ALIASES.put("spring",               "spring boot");
        SKILL_ALIASES.put("ml",                   "machine learning");
        SKILL_ALIASES.put("k8s",                  "kubernetes");
        SKILL_ALIASES.put("mongo",                "mongodb");
        SKILL_ALIASES.put("rest api",             "rest apis");
        SKILL_ALIASES.put("rest",                 "rest apis");
        SKILL_ALIASES.put("ui design",            "figma");
    }

    // ---- Engine metadata ----

    public static final String ENGINE_NAME        = "PathFinder DSA Engine";
    public static final String ENGINE_VERSION     = "java-1.0";
    public static final boolean IS_PLACEHOLDER    = false;
    public static final String ENGINE_DESCRIPTION =
            "Weighted skill-matching and eligibility engine implemented in Java. " +
            "Uses HashSet for O(1) skill look-up, alias normalisation, " +
            "and a stable comparator for deterministic ranking.";

    // ---- Public API ----

    /**
     * Generates ranked recommendations for a student against all internships.
     *
     * @param student      the student profile
     * @param internships  all available internships
     * @param limit        maximum number of results (0 = no limit)
     * @return             the recommendation response object
     */
    public RecommendationResponse generate(Student student,
                                           List<Internship> internships,
                                           int limit) {
        // Build a HashSet of the student's normalised skills once — reused for every internship.
        Set<String> ownedSkills = buildOwnedSkillSet(student.skills());

        List<Recommendation> ranked = internships.stream()
                .filter(i -> i != null && i.id() != null)
                .map(i -> scoreInternship(student, i, ownedSkills))
                .sorted(RecommendationService::compareRecommendations)
                .collect(Collectors.toCollection(ArrayList::new));

        // Assign 1-based ranks.
        for (int i = 0; i < ranked.size(); i++) {
            ranked.set(i, ranked.get(i).withRank(i + 1));
        }

        List<Recommendation> result = (limit > 0 && limit < ranked.size())
                ? ranked.subList(0, limit)
                : ranked;

        EngineInfo engine = new EngineInfo(ENGINE_NAME, ENGINE_VERSION, IS_PLACEHOLDER,
                ENGINE_DESCRIPTION, buildWeightsMap());

        return new RecommendationResponse(student.id(), engine, List.copyOf(result));
    }

    // ---- Private scoring ----

    private Recommendation scoreInternship(Student student, Internship internship,
                                           Set<String> ownedSkills) {
        SkillComparison required  = compareSkills(ownedSkills, internship.requiredSkills());
        SkillComparison preferred = compareSkills(ownedSkills, internship.preferredSkills());
        RoleScore    roleScore    = scoreRole(student, internship);
        LocationScore locScore   = scoreLocation(student, internship);
        WorkModeScore wmScore    = scoreWorkMode(student, internship);
        EligibilityResult elig   = checkEligibility(student, internship);
        double cgpaRatio         = scoreCgpaHeadroom(student, internship);

        double reqRatio  = ratio(required.matched().size(),
                                 required.matched().size() + required.missing().size());
        double prefRatio = ratio(preferred.matched().size(),
                                 preferred.matched().size() + preferred.missing().size());

        // Weighted raw score.
        double raw = W_REQUIRED_SKILLS  * reqRatio
                   + W_PREFERRED_SKILLS * prefRatio
                   + W_ROLE             * roleScore.ratio()
                   + W_LOCATION         * locScore.ratio()
                   + W_WORK_MODE        * wmScore.ratio()
                   + W_CGPA             * cgpaRatio;

        int matchScore = (int) Math.round(raw);

        List<ScoreBreakdownItem> breakdown = List.of(
                new ScoreBreakdownItem("requiredSkills",  "Required skills",  (int) W_REQUIRED_SKILLS,
                        round1dp(W_REQUIRED_SKILLS  * reqRatio)),
                new ScoreBreakdownItem("preferredSkills", "Preferred skills", (int) W_PREFERRED_SKILLS,
                        round1dp(W_PREFERRED_SKILLS * prefRatio)),
                new ScoreBreakdownItem("role",            "Role preference",  (int) W_ROLE,
                        round1dp(W_ROLE             * roleScore.ratio())),
                new ScoreBreakdownItem("location",        "Location",         (int) W_LOCATION,
                        round1dp(W_LOCATION         * locScore.ratio())),
                new ScoreBreakdownItem("workMode",        "Work mode",        (int) W_WORK_MODE,
                        round1dp(W_WORK_MODE        * wmScore.ratio())),
                new ScoreBreakdownItem("cgpa",            "CGPA headroom",    (int) W_CGPA,
                        round1dp(W_CGPA             * cgpaRatio))
        );

        // Suggested skills: missing required first, then missing preferred, max 4.
        List<String> suggested = new ArrayList<>(required.missing());
        suggested.addAll(preferred.missing());
        List<String> suggestedSkills = suggested.stream().limit(4).collect(Collectors.toList());

        String explanation = buildExplanation(student, internship,
                required.matched(), required.missing(), preferred.matched(),
                roleScore, locScore, wmScore, elig);

        return new Recommendation(
                0,   // rank assigned after sorting
                matchScore,
                internship,
                required.matched(),
                required.missing(),
                preferred.matched(),
                preferred.missing(),
                elig,
                breakdown,
                explanation,
                suggestedSkills
        );
    }

    // ---- Skill helpers ----

    /** Builds a HashSet of lowercase-normalised skill tokens from the student's skills list. */
    private Set<String> buildOwnedSkillSet(List<String> skills) {
        // HashSet gives O(1) contains(); normalisation applied once here.
        Set<String> set = new HashSet<>();
        if (skills != null) {
            for (String s : skills) {
                set.add(normalizeSkill(s));
            }
        }
        return set;
    }

    /** Normalises a skill string: trim, lowercase, apply alias map. */
    static String normalizeSkill(String skill) {
        if (skill == null) return "";
        String key = skill.trim().toLowerCase();
        return SKILL_ALIASES.getOrDefault(key, key);
    }

    /**
     * Splits {@code requiredList} into matched/missing against the owned set.
     * Original casing from requiredList is preserved for display.
     */
    private SkillComparison compareSkills(Set<String> ownedNormalised,
                                          List<String> requiredList) {
        List<String> matched = new ArrayList<>();
        List<String> missing = new ArrayList<>();
        if (requiredList != null) {
            for (String skill : requiredList) {
                if (ownedNormalised.contains(normalizeSkill(skill))) {
                    matched.add(skill);
                } else {
                    missing.add(skill);
                }
            }
        }
        return new SkillComparison(matched, missing);
    }

    // ---- Factor scorers ----

    private RoleScore scoreRole(Student student, Internship internship) {
        List<String> preferred = student.preferredRoles();
        if (preferred == null || preferred.isEmpty()) return new RoleScore(0.5, null);
        boolean aligned = preferred.stream()
                .anyMatch(r -> r.equalsIgnoreCase(internship.roleCategory()));
        return new RoleScore(aligned ? 1.0 : 0.0, aligned);
    }

    private LocationScore scoreLocation(Student student, Internship internship) {
        if ("REMOTE".equals(internship.workMode())) return new LocationScore(1.0, "remote");
        List<String> preferred = student.preferredLocations();
        if (preferred == null || preferred.isEmpty()) return new LocationScore(0.5, "unspecified");
        boolean inPreferred = preferred.stream()
                .anyMatch(city -> city.equalsIgnoreCase(internship.location()));
        return new LocationScore(inPreferred ? 1.0 : 0.0, inPreferred ? "preferred" : "other");
    }

    private WorkModeScore scoreWorkMode(Student student, Internship internship) {
        String pref = student.workModePreference();
        if (pref == null || pref.isEmpty()) pref = "ANY";
        boolean fits = "ANY".equals(pref) || pref.equals(internship.workMode());
        return new WorkModeScore(fits ? 1.0 : 0.0, fits, pref);
    }

    private double scoreCgpaHeadroom(Student student, Internship internship) {
        Eligibility e = internship.eligibility();
        double minimum = (e != null) ? e.minCgpa() : 0.0;
        double cgpa = student.cgpa();
        if (cgpa < minimum) return 0.0;
        return Math.min(1.0, (cgpa - minimum) / 1.5);
    }

    /**
     * Checks CGPA, degree and graduation year eligibility.
     * Missing rules mean "no restriction".
     */
    private EligibilityResult checkEligibility(Student student, Internship internship) {
        Eligibility rules = internship.eligibility();
        double minCgpa = (rules != null) ? rules.minCgpa() : 0.0;
        List<String> degrees = (rules != null && rules.degrees() != null) ? rules.degrees() : List.of();
        List<Integer> years  = (rules != null && rules.graduationYears() != null)
                               ? rules.graduationYears() : List.of();

        boolean cgpaPassed   = student.cgpa() >= minCgpa;
        boolean degreePassed = degrees.isEmpty() || degrees.contains(student.degree());
        boolean yearPassed   = years.isEmpty()   || years.contains(student.graduationYear());

        List<EligibilityCheck> checks = new ArrayList<>();

        checks.add(new EligibilityCheck("cgpa", "CGPA",
                cgpaPassed,
                String.format("Minimum %.1f", minCgpa),
                cgpaPassed
                    ? String.format("Your CGPA %.1f meets the minimum of %.1f.", student.cgpa(), minCgpa)
                    : String.format("Your CGPA %.1f is below the minimum of %.1f.", student.cgpa(), minCgpa)
        ));

        checks.add(new EligibilityCheck("degree", "Degree",
                degreePassed,
                degrees.isEmpty() ? "Any degree" : String.join(", ", degrees),
                degreePassed
                    ? student.degree() + " is an accepted degree."
                    : student.degree() + " is not accepted (accepted: " + String.join(", ", degrees) + ")."
        ));

        String yearReq = years.isEmpty() ? "Any year"
                : years.stream().map(String::valueOf).collect(Collectors.joining(", "));
        checks.add(new EligibilityCheck("graduationYear", "Graduation year",
                yearPassed,
                yearReq,
                yearPassed
                    ? "Graduating in " + student.graduationYear() + " is accepted."
                    : "Graduating in " + student.graduationYear() + " is not accepted (accepted: " + yearReq + ")."
        ));

        boolean eligible = checks.stream().allMatch(EligibilityCheck::passed);
        List<String> reasons = checks.stream()
                .filter(c -> !c.passed())
                .map(EligibilityCheck::detail)
                .collect(Collectors.toList());

        return new EligibilityResult(eligible, reasons, checks);
    }

    // ---- Explanation builder ----

    private String buildExplanation(Student student, Internship internship,
                                    List<String> matched, List<String> missing,
                                    List<String> matchedPreferred,
                                    RoleScore role, LocationScore loc,
                                    WorkModeScore wm, EligibilityResult elig) {
        StringBuilder sb = new StringBuilder();
        int total = matched.size() + missing.size();

        if (total == 0) {
            sb.append("This listing does not name any required skills.");
        } else if (missing.isEmpty()) {
            sb.append("You cover all ").append(total)
              .append(" required skills (").append(summarize(matched, 4)).append(").");
        } else if (matched.isEmpty()) {
            sb.append("You do not match any of the ").append(total).append(" required skills yet.");
        } else {
            sb.append("You match ").append(matched.size()).append(" of ").append(total)
              .append(" required skills (").append(summarize(matched, 4))
              .append(") and are missing ").append(summarize(missing, 3)).append(".");
        }

        if (!matchedPreferred.isEmpty()) {
            sb.append(" You also have preferred skills: ").append(summarize(matchedPreferred, 3)).append(".");
        }

        if (Boolean.TRUE.equals(role.aligned())) {
            sb.append(" ").append(internship.roleCategory()).append(" is one of your preferred roles.");
        } else if (Boolean.FALSE.equals(role.aligned())) {
            sb.append(" ").append(internship.roleCategory()).append(" is outside your preferred roles.");
        }

        switch (loc.status()) {
            case "remote"      -> sb.append(" The role is remote, so location does not count against it.");
            case "preferred"   -> sb.append(" ").append(internship.location()).append(" is one of your preferred locations.");
            case "other"       -> sb.append(" ").append(internship.location()).append(" is not among your preferred locations.");
        }

        if (!wm.fits()) {
            sb.append(" It is ").append(workModeLabel(internship.workMode()).toLowerCase())
              .append(" while you prefer ").append(workModeLabel(wm.preference()).toLowerCase()).append(".");
        } else if (!"ANY".equals(wm.preference())) {
            sb.append(" ").append(workModeLabel(internship.workMode())).append(" work matches your preference.");
        }

        if (elig.eligible()) {
            Eligibility e = internship.eligibility();
            double min = (e != null) ? e.minCgpa() : 0.0;
            sb.append(String.format(" You meet the eligibility criteria (CGPA %.1f against a minimum of %.1f).",
                    student.cgpa(), min));
        } else {
            sb.append(" Not eligible: ").append(String.join(" ", elig.reasons()));
        }

        return sb.toString();
    }

    // ---- Ranking comparator ----

    /**
     * Eligible first → higher score → lexicographic internship ID (stable tie-break).
     */
    private static int compareRecommendations(Recommendation a, Recommendation b) {
        boolean ae = a.eligibility().eligible();
        boolean be = b.eligibility().eligible();
        if (ae != be) return ae ? -1 : 1;
        if (a.matchScore() != b.matchScore()) return b.matchScore() - a.matchScore();
        return a.internship().id().compareTo(b.internship().id());
    }

    // ---- Utility helpers ----

    private static double ratio(int matched, int total) {
        return total == 0 ? 1.0 : (double) matched / total;
    }

    private static double round1dp(double v) {
        return Math.round(v * 10.0) / 10.0;
    }

    private static String summarize(List<String> items, int max) {
        if (items.size() <= max) return String.join(", ", items);
        List<String> shown = items.subList(0, max);
        return String.join(", ", shown) + " +" + (items.size() - max) + " more";
    }

    private static String workModeLabel(String mode) {
        return switch (mode == null ? "" : mode) {
            case "REMOTE" -> "Remote";
            case "HYBRID" -> "Hybrid";
            case "ONSITE" -> "On-site";
            default       -> mode != null ? mode : "";
        };
    }

    private static Map<String, Object> buildWeightsMap() {
        // LinkedHashMap preserves insertion order for consistent JSON output.
        Map<String, Object> weights = new LinkedHashMap<>();
        weights.put("requiredSkills",  (int) W_REQUIRED_SKILLS);
        weights.put("preferredSkills", (int) W_PREFERRED_SKILLS);
        weights.put("role",            (int) W_ROLE);
        weights.put("location",        (int) W_LOCATION);
        weights.put("workMode",        (int) W_WORK_MODE);
        weights.put("cgpa",            (int) W_CGPA);
        return Map.copyOf(weights);
    }

    // ---- Value types (records) ----

    public record RecommendationResponse(
            String studentId,
            EngineInfo engine,
            List<Recommendation> recommendations
    ) {}

    public record EngineInfo(
            String name,
            String version,
            boolean isPlaceholder,
            String description,
            Map<String, Object> weights
    ) {}

    public record Recommendation(
            int rank,
            int matchScore,
            Internship internship,
            List<String> matchedSkills,
            List<String> missingSkills,
            List<String> matchedPreferredSkills,
            List<String> missingPreferredSkills,
            EligibilityResult eligibility,
            List<ScoreBreakdownItem> scoreBreakdown,
            String explanation,
            List<String> suggestedSkills
    ) {
        /** Returns a copy with the rank field updated. */
        Recommendation withRank(int newRank) {
            return new Recommendation(newRank, matchScore, internship,
                    matchedSkills, missingSkills, matchedPreferredSkills,
                    missingPreferredSkills, eligibility, scoreBreakdown,
                    explanation, suggestedSkills);
        }
    }

    public record ScoreBreakdownItem(
            String key,
            String label,
            int weight,
            double earned
    ) {}

    public record EligibilityResult(
            boolean eligible,
            List<String> reasons,
            List<EligibilityCheck> checks
    ) {}

    public record EligibilityCheck(
            String key,
            String label,
            boolean passed,
            String requirement,
            String detail
    ) {}

    // Internal scoring intermediates (not serialised).
    private record SkillComparison(List<String> matched, List<String> missing) {}
    private record RoleScore(double ratio, Boolean aligned) {}
    private record LocationScore(double ratio, String status) {}
    private record WorkModeScore(double ratio, boolean fits, String preference) {}
}
