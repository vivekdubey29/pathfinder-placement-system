# PathFinder — Smart Placement & Internship System

PathFinder is a full-stack placement and internship recommendation system built as a college DSA project. A student profile is compared with 24 internship listings. The app checks eligibility, ranks the listings by a weighted score, and explains each match with matched and missing skills.

> **Everything in this repository is demonstration data.** All companies and listings are fictional. They are not live vacancies, and no application is ever submitted to an employer.

---

## Contents

1. [Overview](#1-overview)
2. [Implemented features](#2-implemented-features)
3. [Installation and running (Windows)](#3-installation-and-running-windows)
4. [Project architecture](#4-project-architecture)
5. [How the recommendation engine works](#5-how-the-recommendation-engine-works)
6. [API reference](#6-api-reference)
7. [Testing and verification](#7-testing-and-verification)
8. [Limitations and known issues](#8-limitations-and-known-issues)
9. [Deployment notes](#9-deployment-notes)
10. [Portfolio summary](#10-portfolio-summary)

---

## 1. Overview

### Status: what is implemented

| Area | Status |
|---|---|
| React user interface, routing, forms, validation | **Implemented** |
| Search, filters, sorting, application tracker | **Implemented** |
| Internship API (GET list + GET by id) | **Implemented** — Spring Boot, 24 real listings, YYYY-MM-DD dates |
| Student profile API (GET + PUT with validation) | **Implemented** — in-memory, 422 field errors |
| Application Tracker API (CRUD + duplicate protection) | **Implemented** — in-memory, seeded with 8 records |
| Recommendation engine | **Implemented** — Java weighted-scoring engine with alias normalisation, eligibility, score breakdown, explanations |
| Spring Boot backend | **Implemented** — `backend/` directory, Maven, port 8080 |
| Authentication, database, resume upload | **Not implemented** |
| Mock mode (offline demo without backend) | **Retained** — set `VITE_USE_MOCK_API=true` |

### Technology stack

**Frontend**

| Technology | Version | Role |
|---|---|---|
| React | ^18.3.1 | UI components |
| React Router DOM | ^6.26.2 | Client-side routing |
| Lucide React | ^0.451.0 | Icons |
| Vite | ^5.4.8 | Dev server and bundler |

**Backend**

| Technology | Version | Role |
|---|---|---|
| Java | 21 | Language |
| Spring Boot | 3.3.5 | Framework |
| Spring MVC + Jackson | (via Boot) | REST + JSON serialisation |
| Jakarta Bean Validation | (via Boot) | Request validation |
| Maven Wrapper | (mvnw.cmd) | Build tool |

---

## 2. Implemented features

### Frontend pages

| Route | Page | What it does |
|---|---|---|
| `/` | Landing | Hero, top-3 recommendation preview, feature highlights |
| `/dashboard` | Dashboard | Summary cards, top recommendations, recent activity, profile summary |
| `/internships` | Explorer | Search, filters, sort, 24 cards with match score and save |
| `/internships/:id` | Details | Full listing, skill breakdown, eligibility table, match panel |
| `/recommendations` | Recommendations | Ranked list with scores, explanations, suggested skills |
| `/applications` | Tracker | CRUD table with status, dates, notes, confirm-delete |
| `/profile` | Profile | Editable form with validation, unsaved-change detection |
| `*` | Not Found | |

### Backend endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/internships` | All 24 listings (dates as YYYY-MM-DD) |
| GET | `/api/internships/{id}` | Single listing, 404 if unknown |
| GET | `/api/students/{id}` | Student profile |
| PUT | `/api/students/{id}` | Update profile, 422 + field errors on validation failure |
| GET | `/api/recommendations/{studentId}?limit=N` | Ranked recommendations from the Java engine |
| GET | `/api/applications/{studentId}` | All tracker records for a student |
| POST | `/api/applications` | Create record, 404 unknown internship, 409 duplicate |
| PUT | `/api/applications/{id}` | Update status and/or notes |
| DELETE | `/api/applications/{id}` | Remove record, 204 No Content |

---

## 3. Installation and running (Windows)

### Prerequisites

- **Node.js** current LTS (22 or 24). Download from <https://nodejs.org>.
- **JDK 21 or later** (JDK 26 confirmed to work). The Maven Wrapper downloads Maven automatically.

### Run the backend

```powershell
# From the project root
Set-Location backend
.\mvnw.cmd spring-boot:run
```

The backend starts on **http://localhost:8080**. Verify:

```
GET http://localhost:8080/api/health
```

### Run the frontend

```powershell
# From the project root
npm.cmd install       # first time only
npm.cmd run dev
```

Open the URL Vite prints, usually **http://localhost:5173** or **5174**.

### Switch between mock mode and real API mode

| File | Setting | Effect |
|---|---|---|
| `.env` | `VITE_USE_MOCK_API=false` | Uses the Spring Boot backend |
| `.env` | `VITE_USE_MOCK_API=true` | Uses built-in mock data (no backend needed) |

The `.env` file was created with `VITE_USE_MOCK_API=false` so the frontend connects to the real backend by default. Copy `.env.example` to `.env` and edit to switch modes. **Restart `npm.cmd run dev` after any change.**

### Build for production

```powershell
# Backend (from backend/)
.\mvnw.cmd clean package

# Frontend (from project root)
npm.cmd run build
```

---

## 4. Project architecture

### Backend package structure (`backend/src/main/java/com/pathfinder/backend/`)

```
com.pathfinder.backend
├── BackendApplication.java
├── config/
│   ├── CorsConfig.java          (allows localhost:5173 and :5174)
│   └── JacksonConfig.java       (LocalDate → "YYYY-MM-DD" strings)
├── controller/
│   ├── HealthController.java
│   ├── InternshipController.java
│   ├── StudentController.java
│   ├── ApplicationController.java
│   └── RecommendationController.java
├── dto/
│   ├── ProfileUpdateRequest.java
│   ├── CreateApplicationRequest.java
│   └── UpdateApplicationRequest.java
├── exception/
│   ├── ResourceNotFoundException.java  (→ 404)
│   ├── ConflictException.java          (→ 409)
│   ├── ValidationException.java        (→ 422)
│   └── GlobalExceptionHandler.java     (@RestControllerAdvice)
├── model/
│   ├── Company.java
│   ├── Eligibility.java
│   ├── Internship.java
│   ├── InternshipSeed.java    (raw JSON shape with day-offset fields)
│   ├── Student.java
│   └── ApplicationRecord.java
└── service/
    ├── InternshipService.java       (loads JSON, resolves dates, HashMap look-up)
    ├── StudentService.java          (ConcurrentHashMap, seeded demo student)
    ├── ApplicationService.java      (ConcurrentHashMap, AtomicLong IDs, 8 seed records)
    └── RecommendationService.java   (HashSet skill matching, alias map, weighted scoring)
```

### Frontend structure (`src/`)

```
src/
├── services/
│   ├── apiClient.js              (fetch, ApiError, USE_MOCK_API switch)
│   ├── internshipService.js      (GET /api/internships)
│   ├── profileService.js         (GET/PUT /api/students/{id})
│   ├── applicationService.js     (CRUD /api/applications)
│   ├── recommendationService.js  (GET /api/recommendations/{id})
│   └── mock/
│       └── mockRecommendationEngine.js  (mock mode only)
├── data/                         (seed data, used in mock mode)
├── utils/                        (formatters, validators, matchingUtils, storage)
├── hooks/                        (useAsync, useDocumentTitle, useInternshipFilters)
├── context/AppStateContext.jsx   (profile, tracker, toasts, actions)
├── components/                   (common, layout, internships, dashboard)
└── pages/                        (one component per route)
```

---

## 5. How the recommendation engine works

The Java engine (`RecommendationService.java`) mirrors the logic in the frontend's `mockRecommendationEngine.js` exactly, so switching from mock mode to API mode produces consistent results.

### Data structures used and why

| Structure | Where | Purpose |
|---|---|---|
| `HashSet<String>` | `buildOwnedSkillSet()` | O(1) membership test for skill matching across all 24 internships |
| `HashMap<String,String>` | `SKILL_ALIASES` | O(1) alias look-up during normalisation (js→javascript, dsa→data structures, …) |
| `ConcurrentHashMap` | `StudentService`, `ApplicationService` | Thread-safe in-memory store without explicit locking |
| `AtomicLong` | `ApplicationService.generateId()` | Monotonic counter for collision-free ID generation |
| `List.sort()` + `Comparator` | `RecommendationService.generate()` | Stable sort of ≤ 24 items; simpler and equally fast as a heap for this size |

### Scoring weights

| Factor | Max points | How the ratio is computed |
|---|---|---|
| Required skills | 50 | matched ÷ total (1.0 if none named) |
| Preferred skills | 10 | matched ÷ total (1.0 if none named) |
| Role preference | 15 | 1.0 if role in preferred roles, 0.5 if no preferences, 0.0 otherwise |
| Location | 10 | 1.0 if remote or preferred city, 0.5 if no preferences, 0.0 otherwise |
| Work mode | 10 | 1.0 if ANY or matching mode, 0.0 otherwise |
| CGPA headroom | 5 | 0 if below minimum; grows to 1.0 at 1.5 above minimum |

### Ranking

Eligible listings rank first → descending score → internship id (stable tie-break).

### Skill normalisation and aliases

Skill strings are trimmed and lowercased. An alias map resolves common abbreviations:
`js→javascript`, `dsa→data structures`, `oop→object-oriented programming`,
`postgres/mysql→sql`, `reactjs→react`, `spring→spring boot`, `ml→machine learning`, and more.

---

## 6. API reference

### Error format

All error responses follow:

```json
{ "message": "Internship \"int-999\" was not found." }
```

Validation errors additionally include a field error map:

```json
{
  "message": "Profile validation failed.",
  "errors": {
    "cgpa": "CGPA must be a number between 0 and 10.",
    "skills": "Add at least one technical skill."
  }
}
```

The frontend reads `payload.message` for the user-visible message, and `payload.errors` for field-level highlighting on the profile page (only on 422 responses).

### Key response shapes

**Internship** (dates are always `YYYY-MM-DD` strings, never timestamps):

```json
{
  "id": "int-001",
  "title": "Backend Engineering Intern",
  "roleCategory": "Backend Development",
  "company": { "id": "cmp-nexora", "name": "Nexora Systems", "industry": "Enterprise Software", "size": "1,000-5,000 employees", "headquarters": "Bengaluru", "about": "..." },
  "location": "Bengaluru",
  "workMode": "HYBRID",
  "stipendMonthly": 40000,
  "durationMonths": 6,
  "postedDate": "2026-10-17",
  "applicationDeadline": "2026-11-10",
  "description": "...",
  "responsibilities": ["..."],
  "requiredSkills": ["Java", "Data Structures", "SQL", "Spring Boot", "REST APIs"],
  "preferredSkills": ["Docker", "Git", "JUnit"],
  "eligibility": { "minCgpa": 7.5, "degrees": ["B.Tech", "B.E.", "M.Tech", "MCA"], "graduationYears": [2027, 2028] }
}
```

**Recommendation response** (`GET /api/recommendations/{studentId}`):

```json
{
  "studentId": "stu-001",
  "engine": {
    "name": "PathFinder DSA Engine",
    "version": "java-1.0",
    "isPlaceholder": false,
    "description": "Weighted skill-matching and eligibility engine implemented in Java.",
    "weights": { "requiredSkills": 50, "preferredSkills": 10, "role": 15, "location": 10, "workMode": 10, "cgpa": 5 }
  },
  "recommendations": [
    {
      "rank": 1,
      "matchScore": 87,
      "internship": { "...": "full Internship object" },
      "matchedSkills": ["Java", "SQL"],
      "missingSkills": ["Spring Boot", "REST APIs"],
      "matchedPreferredSkills": ["Git"],
      "missingPreferredSkills": ["Docker", "JUnit"],
      "eligibility": {
        "eligible": true,
        "reasons": [],
        "checks": [
          { "key": "cgpa", "label": "CGPA", "passed": true, "requirement": "Minimum 7.5", "detail": "Your CGPA 8.2 meets the minimum of 7.5." },
          { "key": "degree", "label": "Degree", "passed": true, "requirement": "B.Tech, B.E., M.Tech, MCA", "detail": "B.Tech is an accepted degree." },
          { "key": "graduationYear", "label": "Graduation year", "passed": true, "requirement": "2027, 2028", "detail": "Graduating in 2027 is accepted." }
        ]
      },
      "scoreBreakdown": [
        { "key": "requiredSkills", "label": "Required skills", "weight": 50, "earned": 30.0 }
      ],
      "explanation": "You match 2 of 5 required skills (Java, SQL) and are missing Spring Boot, REST APIs, Data Structures. ...",
      "suggestedSkills": ["Spring Boot", "REST APIs", "Data Structures", "Docker"]
    }
  ]
}
```

---

## 7. Testing and verification

### Backend automated tests (31 tests)

Run from the `backend/` directory:

```powershell
.\mvnw.cmd clean test
```

| Test class | Tests | What it covers |
|---|---|---|
| `BackendApplicationTests` | 1 | Spring context loads, seed JSON parsed |
| `InternshipControllerTest` | 6 | List (24 items), single look-up, date format, 404, no offset fields |
| `StudentControllerTest` | 6 | GET profile, 404, PUT valid, PUT invalid fields, PUT CGPA out of range |
| `ApplicationControllerTest` | 12 | List, list unknown student, POST create, POST APPLIED, POST 404, POST 409, POST invalid status, PUT status, PUT 404, DELETE 204, DELETE 404 |
| `RecommendationControllerTest` | 6 | Full shape, limit param, recommendation fields, rank order, 404, eligibility checks |

### Frontend build

```powershell
npm.cmd run build   # from project root
```

Should end with `✓ built in …`.

### Manual integration checks (with backend running)

| Check | Expected |
|---|---|
| `/internships` loads | 24 cards, match scores, eligibility badges |
| `/internships/int-001` | Full listing, required and preferred skills, eligibility table, score breakdown |
| `/internships/int-999` | "Internship not found" state |
| `/recommendations` | 24 ranked items, `isPlaceholder: false` (no placeholder banner) |
| `/profile` save valid | Success toast, profile updated |
| `/profile` save invalid | Field-level error messages under each failing field |
| `/applications` | 8 seed records, status changes persist, remove works |
| Save + unsave | Tracker badge updates, persists after refresh |
| CORS | No blocked requests in DevTools Network tab |
| Backend down | Error state with retry button — no mock data fallback |

---

## 8. Limitations and known issues

- **In-memory persistence.** All student, application and seed data is held in JVM memory. It resets on backend restart. A database (JPA/H2 or PostgreSQL) would be the next step.
- **Single demo user, no authentication.** The demo student id is always `stu-001`. There is no login, no per-user separation and no security.
- **Mock mode** uses `localStorage` for tracker and profile changes; real API mode does not. Switching between modes does not migrate data.
- **No resume upload.** The profile stores only the chosen file name.
- **Tracking is local.** Recording a status never contacts a company.
- **No server-side rendering or SEO work.**
- **Frontend minor cosmetic notes (from original README):** In `AppShell.jsx` the loading label may render a literal `\u2026`; in `InternshipExplorerPage.jsx` the loading label should use plain `…`. Neither affects functionality.

---

## 9. Deployment notes

The project has not been deployed to a production host. To deploy:

- Build the frontend (`npm.cmd run build`) and serve `dist/` from a static host or from the Spring Boot `static/` folder.
- Package the backend (`.\mvnw.cmd clean package`) and run the resulting JAR.
- Set `VITE_API_BASE_URL` to the deployed backend URL at frontend build time.
- Update `CorsConfig.java` to allow the production frontend origin.

---

## 10. Portfolio summary

PathFinder demonstrates:

- A complete React SPA (routing, forms, state management, loading/error states).
- A Spring Boot REST backend serving real computed responses.
- A Java recommendation engine using `HashSet` for O(1) skill matching, `HashMap` for alias normalisation, and a stable `Comparator`-based sort.
- API integration with proper error propagation (`ApiError`, 404/409/422 status codes, field-level validation messages).
- In-memory CRUD with duplicate protection, seeded demo data, and consistent date semantics.
- A toggle between mock mode (offline demo) and real API mode.
- 31 automated backend tests covering all endpoints and error cases.
