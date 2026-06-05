# Agenda Feature Design

Complete design specification for the **Agenda** feature of the my-calendar application.

## Documents

### 1. [`overview.md`](./overview.md) — Start Here

**Purpose**: High-level feature summary and requirements

Contains:
- Feature summary and problem being solved
- Core user flows
- Acceptance criteria
- In/out of scope
- Dependencies on existing modules
- Data model overview
- Technical constraints and assumptions

**Who should read**: Product managers, architects, everyone getting started

---

### 2. [`database.md`](./database.md) — Database & Schema

**Purpose**: Complete database design with migrations

Contains:
- SQL table definitions (agendas, agenda_events)
- Column definitions, constraints, indexes
- TypeORM entity mappings
- Flyway migration file names (V9, V10, V11)
- Query patterns for high-volume operations
- Soft-delete strategy
- Future schema considerations

**Who should read**: Backend engineers, database engineers

**Key takeaways**:
- Two new tables: `agendas` and `agenda_events`
- One column addition: `is_cancelled` to `events`
- All UUIDs, timestamptz columns, soft deletes with `deleted_at`
- Composite index on `(start_at, id)` for pagination

---

### 3. [`api.yml`](./api.yml) — API Specification

**Purpose**: OpenAPI 3.0 specification for all agenda endpoints

Contains:
- RESTful endpoint definitions (GET, POST, PATCH, DELETE)
- Request/response schemas with examples
- Error codes and messages
- Pagination strategy (offset-based with direction parameter)
- Authentication & authorization notes
- Pagination metadata in responses

**Key endpoints**:
- `GET /api/agendas` — List agendas (future by default, paginated)
- `POST /api/agendas` — Create agenda
- `GET /api/agendas/{id}` — Fetch single agenda
- `PATCH /api/agendas/{id}` — Update agenda
- `DELETE /api/agendas/{id}` — Delete agenda (soft or hard)
- `GET /api/agendas/{id}/events` — List events in agenda (future by default, paginated)
- `POST /api/agendas/{id}/events` — Add event to agenda
- `DELETE /api/agendas/{agendaId}/events/{eventId}` — Remove event from agenda
- `PATCH /api/events/{id}/status` — Update event status (completed/cancelled)

**Who should read**: Backend engineers, frontend engineers, API consumers

**How to use**: Import into Swagger/Postman for interactive documentation

---

### 4. [`ui-ux.md`](./ui-ux.md) — User Interface & Experience

**Purpose**: Complete UI/UX design for both mobile and desktop

Contains:
- Screen-by-screen layouts (Agenda List, Agenda Detail)
- Interaction patterns (scroll, tap, gestures, keyboard)
- Component structure and content hierarchy
- Loading, empty, and error states
- Accessibility requirements (WCAG AA, keyboard navigation, ARIA labels)
- Cross-platform differences (mobile vs. desktop)
- Real-time and polling considerations
- User flow diagrams
- Testing scenarios

**Key screens**:
1. **Agenda List Screen**: Chronological list, future by default, scroll down for more, scroll/tap up for past
2. **Agenda Detail Screen**: Full agenda metadata + paginated event list, edit modal, status management

**Accessibility**:
- WCAG AA color contrast (4.5:1 minimum)
- 44x44 pt touch targets (mobile), 48x48 dp (Android)
- Keyboard navigation (Tab, Enter, Escape)
- Screen reader support (ARIA labels, semantic HTML)
- Reduced motion variants

**Who should read**: Frontend engineers, designers, UX researchers, QA

---

### 5. [`IMPLEMENTATION_ROADMAP.md`](./IMPLEMENTATION_ROADMAP.md) — Dev Plan

**Purpose**: Phased implementation plan with effort estimates and risks

Contains:
- Phase 1 (MVP): Core feature tasks with hour estimates
  - Backend: ~29–39 hours (migrations, service, controller, tests)
  - Mobile: ~38–47 hours (screens, API client, hooks)
  - Desktop: ~38–47 hours (pages, API client, hooks)
  - QA: ~12–17 hours (tests, manual QA, accessibility)
  - **Total: ~130–150 hours (~3.5–4.5 weeks for 3-person team)**
- Phase 2 (Polish): Search, filtering, real-time, performance
- Phase 3 (Advanced): Recurring agendas, collaboration, integrations
- Risk mitigation and dependency management
- Branching strategy
- Testing strategy
- Success metrics
- Timeline summary

**Who should read**: Engineering managers, tech leads, backend/mobile/desktop leads

---

## Quick Reference

### For Backend Engineers

1. Read `overview.md` (requirements overview)
2. Read `database.md` (migrations, entities, queries)
3. Read `api.yml` (endpoint specs)
4. Implement in order: migrations → entities → service → controller → tests

### For Mobile Engineers (Expo)

1. Read `overview.md` (requirements overview)
2. Read `api.yml` (API contracts)
3. Read `ui-ux.md` (screens, interactions, accessibility)
4. Implement in order: API client → hooks → list screen → detail screen → tests

### For Desktop Engineers (Electron + React)

1. Read `overview.md` (requirements overview)
2. Read `api.yml` (API contracts)
3. Read `ui-ux.md` (screens, interactions, accessibility, keyboard navigation)
4. Implement in order: API client → hooks → list page → detail pane → tests

### For QA

1. Read `ui-ux.md` (user flows, states, edge cases, testing scenarios)
2. Read `IMPLEMENTATION_ROADMAP.md` (testing strategy, success metrics)
3. Write test cases and checklist for all screens
4. Execute manual testing after each phase

### For Product/Design

1. Read `overview.md` (feature summary, scope, user flows)
2. Read `ui-ux.md` (screen layouts, interactions, states)
3. Use as reference for user testing, feedback collection

---

## Key Decisions (Why This Design?)

### Server-Side Pagination Only
- **Why**: Large datasets (1000+ agendas) would bloat memory if fetched in one go
- **How**: Offset-based pagination with `limit` and `offset` parameters
- **Trade-off**: Slightly more complex client state management vs. scalability

### Future Agendas by Default
- **Why**: Most users need to see what's coming up, not what's past
- **How**: `direction=forward` (default) in list queries
- **Trade-off**: Users must explicitly scroll/tap to view past

### Bidirectional Scroll (Up for Past)
- **Why**: Intuitive — scroll "backward in time" to see past items
- **How**: Detect scroll position; on scroll-up past threshold, allow loading past records
- **Trade-off**: Requires explicit user intent to avoid accidental past-data loads

### Embedded Event List in Agenda Detail
- **Why**: Reduces navigation friction; users can manage events without leaving detail view
- **How**: Nested scrolling on mobile (ScrollView wraps event list); careful nesting to avoid UX issues
- **Trade-off**: Slightly more complex mobile implementation

### Status Enum (Active, Completed, Cancelled)
- **Why**: Clear semantic meaning for agenda state; aligns with event status
- **How**: Database enum type; reused across mobile/desktop/backend
- **Trade-off**: Future flexibility if more states needed (may require migration)

### Soft Deletes (`deleted_at`)
- **Why**: Preserves audit trail; users can recover deleted agendas
- **How**: All queries filter `WHERE deleted_at IS NULL`; partial index optimizes queries
- **Trade-off**: Slight storage overhead; requires discipline in queries

---

## Constants & Enums (Per No-Hardcode Rule)

### Backend (`backend/src/constants/`)

```typescript
// Pagination
export const AGENDA_PAGE_SIZE_DEFAULT = 20;
export const AGENDA_PAGE_SIZE_MAX = 100;
export const AGENDA_EVENTS_PAGE_SIZE_DEFAULT = 20;

// Status values (or use enum)
export enum AgendaStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum EventStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// Sort directions
export enum PaginationDirection {
  FORWARD = 'forward',
  BACKWARD = 'backward',
}
```

### Mobile & Desktop (`src/constants/`)

Same constants imported from backend types (shared via SDK or copied)

---

## API Response Format

All responses follow a consistent pattern:

```json
{
  "data": [...] or { ... },
  "meta": {
    "limit": 20,
    "offset": 0,
    "total": 42,
    "hasMore": true
  }
}
```

Error responses:

```json
{
  "error": "validation_error",
  "message": "Title is required",
  "details": [
    { "field": "title", "message": "must not be empty" }
  ]
}
```

---

## Testing Priorities

### Phase 1 MVP

1. **Pagination**: Test future/past loading, offset calculations, hasMore flag
2. **CRUD operations**: Create, read, update, delete agendas
3. **Event association**: Add/remove events from agenda
4. **Event status**: Mark complete/cancel events
5. **Validation**: Invalid inputs (missing fields, bad timestamps)
6. **Error handling**: Network failures, server errors, 404s

### Phase 2+

1. **Search & filter**: Verify query results
2. **Real-time sync**: WebSocket message delivery
3. **Bulk operations**: Multi-select, bulk actions
4. **Accessibility**: WCAG AA compliance, keyboard nav, screen reader

---

## Deployment Checklist

- [ ] All migrations applied and tested (V9, V10, V11)
- [ ] Backend API deployed and Swagger docs published
- [ ] Mobile app built and deployed to TestFlight/Play Store
- [ ] Desktop app built as DMG and distributed
- [ ] Smoke tests passed on all platforms
- [ ] Analytics events instrumented (if applicable)
- [ ] Documentation updated (help docs, FAQs)
- [ ] User onboarding prepared (if new user tutorial needed)
- [ ] Rollback plan in place (in case of critical bugs)

---

## Questions? Clarifications?

Refer to the specific document:

- **What is this feature?** → `overview.md`
- **How do I build the database?** → `database.md`
- **What are the API endpoints?** → `api.yml`
- **How should the UI look/behave?** → `ui-ux.md`
- **What's the implementation plan?** → `IMPLEMENTATION_ROADMAP.md`

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-06-04 | Claude | Initial design complete |

---

## License

Internal design document. Do not distribute outside the organization.
