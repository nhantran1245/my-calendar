The user has described a feature as follows:

"$ARGUMENTS"

Use the feature-architect agent to analyze this description and produce design documents for this personal calendar application.

First, derive a short `feature_name` slug from the description (lowercase, hyphen-separated, e.g. `recurring-events`). All output files go into `design/<feature_name>/`.

The four required output files are:

1. **`design/<feature_name>/overview.md`** — Feature overview
   - Interpretation of the feature description
   - Problem being solved and why it matters for a personal calendar
   - User stories / acceptance criteria
   - Scope (what's in / out)
   - Dependencies on existing modules (events, reminders, etc.)

2. **`design/<feature_name>/database.md`** — Database design
   - New tables or columns required (with types, constraints, indexes)
   - Changes to existing tables (follow the project's Flyway convention — propose the migration filename `V{n}__{description}.sql`)
   - Entity relationships
   - `id` field should be uuid
   - Always has `created_at`, `updated_at` columns 

3. **`design/<feature_name>/api.yml`** — API design (OpenAPI 3.0 format)
   - All new or modified endpoints under `/api`
   - Request/response schemas
   - HTTP methods, paths, status codes

4. **`design/<feature_name>/ui-ux.md`** — UI/UX behavior
   - Screen-by-screen breakdown for both mobile (Expo) and desktop (Electron)
   - User interactions and flows
   - Edge cases and empty/error states

Before writing, the agent should read the existing codebase context:
- `CLAUDE.md` for architecture and conventions
- `backend/src/events/event.entity.ts` for the current data model
- `db/migrations/` to determine the next Flyway version number
- `.claude/rules/` for coding rules that should be reflected in the design
