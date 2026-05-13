# 📚 Employee Digital Library

A centralized, role-based knowledge management platform for companies. Feed-based mobile UI (React Native Expo) backed by a Spring Boot REST API and PostgreSQL.

---

## 🏗 Project Structure

```
employee-digital-library/
├── docker-compose.yml          ← Postgres (port 5433) + Spring Boot (port 8080)
├── db/
│   └── init.sql                ← Full schema: tables, enums, indexes, FTS triggers, seed data
├── backend/                    ← Spring Boot 3.2 / Java 21
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/java/com/edl/
│       ├── entity/             ← JPA entities (User, ContentItem, Notification, etc.)
│       ├── repository/         ← Spring Data JPA + native SQL for fuzzy search & feed
│       ├── service/            ← AuthService, ContentService, NotificationService
│       ├── controller/         ← REST controllers (Auth, Feed, Content, Notif, Admin)
│       ├── security/           ← JWT filter + util
│       ├── config/             ← SecurityConfig, WebConfig (static files)
│       └── exception/          ← GlobalExceptionHandler
└── frontend/                   ← Expo / React Native
    ├── app.json
    ├── package.json
    ├── app/
    │   ├── _layout.tsx         ← Root layout with auth guard
    │   ├── (auth)/             ← login.tsx, register.tsx
    │   ├── (tabs)/             ← feed, search, notifications, admin, profile
    │   └── content/[id].tsx    ← Content detail (document / video / quiz)
    └── src/
        ├── api/index.ts        ← Axios client + typed API helpers
        ├── store/authStore.ts  ← Zustand auth with SecureStore persistence
        ├── utils/theme.ts      ← Dark theme colors, spacing, radii
        └── components/
            └── ContentCard.tsx ← Feed card component
```

---

## 🚀 Running the App

### Prerequisites
- Docker & Docker Compose
- **JDK 21** (`openjdk-21-jdk`) + Maven — the JRE alone is not enough, the compiler requires the full JDK
  - Ubuntu/Debian: `sudo apt install openjdk-21-jdk`
  - macOS (Homebrew): `brew install openjdk@21`
- Node.js 18+ and npm
- Expo Go app on your phone (SDK 54) or an emulator

---

### Step 1 — Start the database

Your existing Postgres runs on port **5432** and is **untouched**.
This project's Postgres runs on port **5433**.

```bash
cd employee-digital-library
docker compose up postgres -d
```

Wait for the health check to pass (about 10 seconds).
The `db/init.sql` runs automatically on first start, creating all tables and seeding departments/categories.

**Default admin account created:**
- Email: `admin@edl.com`
- Password: `Admin@123`

---

### Step 2 — Start the backend

**Option A — Maven directly (fastest for development):**
```bash
cd backend
mvn spring-boot:run
```
The app connects to `localhost:5433` by default.

**Option B — Full Docker:**
```bash
cd employee-digital-library
docker compose up backend -d
```

**Option C — Build JAR and run:**
```bash
cd backend
mvn package -DskipTests
java -jar target/employee-digital-library-1.0.0-SNAPSHOT.jar
```

API is available at: `http://localhost:8080`
Swagger UI: `http://localhost:8080/swagger-ui.html`

---

### Step 3 — Start the frontend

```bash
cd frontend
cp .env.example .env          # then edit .env with your machine's local IP
npm install
npx expo start
```

- Press `a` → Android emulator
- Press `i` → iOS simulator
- Scan QR code → Expo Go on your phone

> ⚠️ **Physical device:** Set `EXPO_PUBLIC_API_URL` in `frontend/.env` to your machine's local network IP, e.g. `http://192.168.1.100:8080`. The default `10.0.2.2` only works on Android emulators.

---

## 🔌 API Overview

All endpoints require `Authorization: Bearer <token>` except auth routes.

| Method | Path | Description | Role |
|--------|------|-------------|------|
| POST | `/api/auth/login` | Login | Public |
| POST | `/api/auth/register` | Register | Public |
| GET | `/api/feed` | Personalized content feed | All |
| GET | `/api/feed/mandatory-pending` | Unacknowledged mandatory items | All |
| GET | `/api/content/search?q=` | Fuzzy full-text search | All |
| GET | `/api/content/{id}` | Content detail | All |
| POST | `/api/content/{id}/acknowledge` | Acknowledge mandatory content | All |
| POST | `/api/content/{id}/complete` | Mark as completed | All |
| PATCH | `/api/content/{id}/progress` | Update video progress % | All |
| POST | `/api/content` | Create content (multipart) | MENTOR, ADMIN |
| POST | `/api/content/{id}/submit-review` | Submit for review | MENTOR, ADMIN |
| POST | `/api/content/{id}/approve` | Approve & publish | ADMIN |
| GET | `/api/content/pending-review` | List pending submissions | ADMIN |
| POST | `/api/content-requests` | Submit content request | All |
| GET | `/api/content-requests` | List open requests | ADMIN |
| PATCH | `/api/content-requests/{id}/resolve` | Resolve request | ADMIN |
| GET | `/api/notifications` | User notifications | All |
| GET | `/api/notifications/unread-count` | Unread badge count | All |
| POST | `/api/notifications/mark-all-read` | Mark all read | All |
| GET | `/api/departments` | List departments | Public |
| GET | `/api/categories` | List categories | Public |

---

## 🧪 Mock Accounts & Seed Data

Run the seeds **in order** after the database is up:

```bash
# Base seed — mock accounts + 5 Training content items
docker exec -i edl_postgres psql -U edl_user -d employee_digital_library < db/seed.sql

# Post-type seed — NEWS, EVENT, CHANGE, CAREER, REGULATION items
docker exec -i edl_postgres psql -U edl_user -d employee_digital_library < db/003_posttype_seed.sql
```

Both scripts are idempotent — safe to re-run.

### Mock accounts

| Role | Email | Password |
|------|-------|----------|
| `HR_ADMIN` | `admin@mail.com` | `admin123` |
| `MASTER_MENTOR` | `mentor@mail.com` | `mentor123` |
| `EMPLOYEE` | `user@mail.com` | `user123` |

The seeds together create **15 published content items** across all 6 post types (TRAINING ×5, NEWS ×2, EVENT ×2, CHANGE ×2, CAREER ×2, REGULATION ×2) spread across departments, plus a sample content request and quiz with 3 questions.

---

## 👤 User Roles

| Role | Description |
|------|-------------|
| `EMPLOYEE` | Default role. Can browse, search, acknowledge, complete content |
| `MASTER_MENTOR` | Can create and submit content for review |
| `HR_ADMIN` | Full access: approve content, view compliance, manage requests |

Change a user's role directly in the database:
```sql
UPDATE users SET role = 'MASTER_MENTOR' WHERE email = 'user@company.com';
```

---

## ⚙️ Configuration

All settings are in `backend/src/main/resources/application.yml`.

Key settings to change for production:
```yaml
jwt:
  secret: CHANGE-THIS-TO-A-RANDOM-256-BIT-STRING   # ← critical
  expiration-ms: 86400000

spring:
  datasource:
    url: jdbc:postgresql://localhost:5433/employee_digital_library
    username: edl_user
    password: edl_password    # ← change this
```

Also update `docker-compose.yml` if you change the DB password.

---

## 🗄 Database Notes

- PostgreSQL 15 with `uuid-ossp` and `pg_trgm` extensions
- Full-text search uses Romanian (`'romanian'`) text search config — change to `'english'` or `'simple'` in `init.sql` if needed
- Schema is managed by `init.sql` — Hibernate is set to `validate` only (no auto-migration)
- The `mandatory_compliance_view` gives HR a real-time compliance snapshot

---

## 📱 Frontend Notes

- **Feed** is the home tab: mandatory items float to top, infinite scroll
- **Search** debounces 400ms; empty results show a "Request Content" modal that auto-fills the search term
- **Content Request** is submitted to `/api/content-requests` and visible in the Admin tab
- **Admin tab** is only visible to `HR_ADMIN` users (hidden via `href: null` in expo-router)
- **Video player**: the detail screen has a placeholder — replace with `expo-av`'s `Video` component in a native build
- **Quiz questions**: currently uses mock data — wire up a `/api/content/{id}/quiz` endpoint to serve real questions from the `quiz_questions` table

---

## 🔧 Next Steps / Extensions

- [ ] Wire up real quiz questions endpoint from `quiz_questions` / `quiz_answers` tables
- [ ] Add `expo-av` Video component for real video playback
- [ ] Push notifications via Expo Push API (store tokens in `device_tokens` table)
- [ ] Add rich text editor for document body (react-native-editor)
- [ ] Offline support with AsyncStorage caching
- [ ] HR compliance export (PDF report from `mandatory_compliance_view`)
- [ ] Content editing / versioning UI for mentors
- [ ] Active Directory / SSO integration
