# Database Setup & Seed Commands

All commands are run from the **`employee-digital-library/`** directory (the folder containing `docker-compose.yml`).

---

## Step 1 — Start the database

```bash
docker compose up postgres -d
```

Wait ~10 seconds for the health check to pass before running any commands below.

---

## Step 2 — Apply schema (creates all tables)

```bash
docker exec -i edl_postgres psql -U edl_user -d employee_digital_library < db/init.sql
```

> **Note:** When running via `docker compose up`, this runs automatically as `01_schema.sql`. Only run manually if you started Postgres without Docker Compose.

---

## Step 3 — Apply migrations (sections, gamification tables)

```bash
docker exec -i edl_postgres psql -U edl_user -d employee_digital_library < db/002_sections_gamification.sql
```

> **Auto-run** as `02_migrations.sql` on first Docker volume init.

---

## Step 4 — Seed mock accounts + base training content

```bash
docker exec -i edl_postgres psql -U edl_user -d employee_digital_library < db/seed.sql
```

Creates:
| Role | Email | Password |
|------|-------|----------|
| `HR_ADMIN` | `admin@mail.com` | `admin123` |
| `MASTER_MENTOR` | `mentor@mail.com` | `mentor123` |
| `EMPLOYEE` | `user@mail.com` | `user123` |

Also creates departments, categories, sections, and 5 TRAINING content items.

> **Auto-run** as `03_seed.sql` on first Docker volume init.

---

## Step 5 — Seed post-type content (NEWS, EVENT, CHANGE, CAREER, REGULATION)

```bash
docker exec -i edl_postgres psql -U edl_user -d employee_digital_library < db/003_posttype_seed.sql
```

Creates 10 published content items: NEWS×2, EVENT×2, CHANGE×2 (mandatory), CAREER×2, REGULATION×2 (mandatory).

> **Auto-run** as `04_posttype_seed.sql` on first Docker volume init.

---

## Step 6 — Seed company pages (About, Policies, Contact)

```bash
docker exec -i edl_postgres psql -U edl_user -d employee_digital_library < db/004_company_pages_seed.sql
```

Creates 9 company info pages across 3 sections: About (3), Policies (3), Contact (3).

> **Auto-run** as `05_pages_seed.sql` on first Docker volume init.

---

## Full fresh setup (all-in-one)

Run all seeds sequentially after Postgres is healthy:

```bash
docker compose up postgres -d && \
sleep 12 && \
docker exec -i edl_postgres psql -U edl_user -d employee_digital_library < db/init.sql && \
docker exec -i edl_postgres psql -U edl_user -d employee_digital_library < db/002_sections_gamification.sql && \
docker exec -i edl_postgres psql -U edl_user -d employee_digital_library < db/seed.sql && \
docker exec -i edl_postgres psql -U edl_user -d employee_digital_library < db/003_posttype_seed.sql && \
docker exec -i edl_postgres psql -U edl_user -d employee_digital_library < db/004_company_pages_seed.sql
```

---

## Docker Compose — full stack

Start everything (Postgres + backend) with a single command:

```bash
docker compose up -d
```

On **first run**, Postgres automatically executes all scripts in `db/` in order (01 → 05), so the database is fully seeded before the backend connects.

On **subsequent runs**, the existing `pgdata` volume is reused — the init scripts do **not** re-run.

---

## Useful maintenance commands

### Connect to the database interactively

```bash
docker exec -it edl_postgres psql -U edl_user -d employee_digital_library
```

### Reset the database (wipes all data)

```bash
docker compose down -v
docker compose up postgres -d
```

Then re-run seeds from Step 2 onwards if not using Docker Compose auto-init.

### View backend logs

```bash
docker compose logs -f backend
```

### Rebuild the backend image after code changes

```bash
docker compose build backend
docker compose up -d backend
```

---

## Notes

- All seed scripts are **idempotent** — safe to re-run, they skip existing rows.
- Scripts must be run **in order** (schema → migrations → seed → post-type seed → pages seed) because later scripts depend on rows created by earlier ones.
- The PostgreSQL container is exposed on port **5433** to avoid conflict with a local Postgres on 5432. Connect with: `psql -h localhost -p 5433 -U edl_user -d employee_digital_library`
