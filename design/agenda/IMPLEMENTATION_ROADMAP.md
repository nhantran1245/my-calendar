# Agenda Feature — Implementation Roadmap

## Overview

This document outlines the phased implementation strategy for the agenda feature. The design is complete and covers database schema, API design, and UI/UX across mobile and desktop platforms.

---

## Phase 1: MVP (Core Agenda Feature)

**Goal**: Ship basic agenda browsing, pagination, event management, and editing.

**Estimated effort**: 4–6 weeks (3 developers: 1 backend, 1 mobile, 1 desktop)

### Backend Tasks

1. **Database migrations** (V9–V11)
   - Create `agendas` table
   - Create `agenda_events` junction table
   - Add `is_cancelled` column to `events`
   - Verify indexes and constraints
   - Time: 3–4 hours

2. **TypeORM entities**
   - Create `Agenda` entity with AgendaStatus enum
   - Create `AgendaEvent` entity
   - Update `Event` entity to add `isCancelled` property
   - Time: 2–3 hours

3. **Agendas service** (`backend/src/agendas/agendas.service.ts`)
   - `findFuture(limit, offset)`: Fetch future agendas with pagination
   - `findPast(limit, offset)`: Fetch past agendas with pagination
   - `findById(id)`: Fetch single agenda
   - `create(dto)`: Create new agenda
   - `update(id, dto)`: Update agenda metadata and status
   - `delete(id, permanent?)`: Soft or hard delete
   - `addEvent(agendaId, eventId)`: Add event to agenda
   - `removeEvent(agendaId, eventId)`: Remove event from agenda
   - Time: 6–8 hours

4. **Agendas controller** (`backend/src/agendas/agendas.controller.ts`)
   - All endpoints from API spec (GET /agendas, POST, PATCH, DELETE, etc.)
   - Query parameter handling (limit, offset, direction, status, includeSoftDeleted)
   - Response wrapping ({ data, meta })
   - Swagger/OpenAPI decorators
   - Time: 4–5 hours

5. **DTOs and validation**
   - `CreateAgendaDto`: title, description, startAt, endAt, eventIds
   - `UpdateAgendaDto`: partial updates
   - Validation rules (required fields, datetime ordering, max lengths)
   - Time: 2–3 hours

6. **Events service extension**
   - `updateEventStatus(id, isCompleted, isCancelled)`: Update event status
   - Ensure backward compatibility with existing `toggleComplete` logic
   - Time: 2 hours

7. **Unit tests**
   - Service unit tests (create, read, update, delete operations)
   - DTO validation tests
   - Pagination logic tests
   - Target: 70%+ coverage
   - Time: 6–8 hours

8. **Integration tests**
   - End-to-end tests for agenda CRUD flows
   - Test pagination (future + past)
   - Test event association
   - Time: 4–5 hours

**Backend subtotal: 29–39 hours**

### Mobile (Expo React Native) Tasks

1. **API client setup** (`mobile/src/api/agendas.ts`)
   - `fetchAgendas(limit, offset, direction, status)`: Get agenda list
   - `fetchAgenda(id)`: Get single agenda
   - `createAgenda(data)`: Create agenda
   - `updateAgenda(id, data)`: Update agenda
   - `deleteAgenda(id)`: Delete agenda
   - `fetchAgendaEvents(agendaId, limit, offset, direction)`: Get events in agenda
   - `updateEventStatus(eventId, isCompleted, isCancelled)`: Update event
   - Time: 3–4 hours

2. **Custom hooks** (`mobile/src/hooks/`)
   - `useAgendas(direction)`: Manage agenda list state, pagination, loading
   - `useAgenda(id)`: Fetch single agenda + metadata
   - `useAgendaEvents(agendaId, direction)`: Manage event list state within agenda
   - Time: 4–5 hours

3. **Agenda List screen** (`mobile/src/screens/AgendaListScreen.tsx`)
   - Expo Router setup (route: `/agenda`)
   - FlatList with pagination (load future, load past)
   - Agenda item component (title, date range, status, event count)
   - Pull-to-refresh (future agendas)
   - "Tap to view past" button (sticky at top when scrolled)
   - Empty and error states
   - Loading skeleton
   - Navigation to detail screen
   - Time: 8–10 hours

4. **Agenda Detail screen** (`mobile/src/screens/AgendaDetailScreen.tsx`)
   - Fetch agenda metadata (title, date, status, description)
   - Edit button → modal
   - Embedded event list (future by default, paginated)
   - Event status change (tappable pills)
   - Remove event from agenda
   - Scroll up to load past events
   - Empty event state
   - Time: 8–10 hours

5. **Edit Agenda modal** (`mobile/src/components/EditAgendaModal.tsx`)
   - Form fields (title, description, startAt, endAt, status)
   - Date/time pickers (native or react-native-community)
   - Validation feedback
   - Save and cancel actions
   - Time: 4–5 hours

6. **Shared components**
   - `AgendaCard`: Reusable agenda item component
   - `EventCard`: Reusable event item component
   - `StatusPill`: Tappable status component
   - Time: 3 hours

7. **Constants and types** (`mobile/src/constants/`, `mobile/src/types/`)
   - Pagination limits, API endpoints, status enums
   - TypeScript interfaces for Agenda, Event, API responses
   - Time: 2 hours

8. **Testing**
   - Component tests (Jest + React Native Testing Library)
   - Hook tests
   - API integration tests
   - Target: 60%+ coverage
   - Time: 6–8 hours

**Mobile subtotal: 38–47 hours**

### Desktop (Electron + React + Vite) Tasks

1. **API client setup** (`desktop/src/renderer/api/agendas.ts`)
   - Same as mobile (reuse pattern)
   - Time: 3–4 hours

2. **Custom hooks** (`desktop/src/renderer/hooks/`)
   - Same as mobile hooks
   - Time: 4–5 hours

3. **Agenda List page** (`desktop/src/renderer/pages/AgendaListPage.tsx`)
   - Two-pane layout: list (left), detail (right)
   - Table or card list of agendas (future by default)
   - Pagination controls (next/prev buttons or "Load more")
   - "View past" button above list
   - Click agenda → load detail in right pane
   - Loading, empty, error states
   - Time: 8–10 hours

4. **Agenda Detail pane** (`desktop/src/renderer/components/AgendaDetailPane.tsx`)
   - Metadata section (title, date, status, description)
   - Edit button
   - Event list (table or cards, future by default)
   - Event status dropdown (click to change)
   - Pagination for events
   - "View past events" button
   - Time: 8–10 hours

5. **Edit Agenda modal/dialog** (`desktop/src/renderer/components/EditAgendaModal.tsx`)
   - Same form as mobile
   - Native date/time inputs
   - Time: 3–4 hours

6. **Shared components**
   - `AgendaCard` / `AgendaRow`: Agenda display
   - `EventCard` / `EventRow`: Event display
   - `StatusButton`: Status change dropdown
   - Time: 3 hours

7. **Constants and types** (`desktop/src/renderer/constants/`, `desktop/src/renderer/types/`)
   - Same as mobile pattern
   - Time: 1–2 hours

8. **Keyboard navigation and shortcuts**
   - Tab through agenda list
   - Enter to open detail / close modal
   - Escape to close modal
   - Time: 2–3 hours

9. **Testing**
   - Component tests (Vitest or Jest)
   - Hook tests
   - Target: 60%+ coverage
   - Time: 6–8 hours

**Desktop subtotal: 38–47 hours**

### Quality Assurance & Integration

1. **E2E tests** (optional, Phase 1 or Phase 2)
   - Playwright or Cypress: test flows across all screens
   - Time: 6–8 hours

2. **Manual testing checklist**
   - Pagination (future and past)
   - Event status changes
   - Create, edit, delete agendas
   - Error handling (network, validation)
   - Cross-platform consistency
   - Time: 4–6 hours (distributed across team)

3. **Accessibility review**
   - WCAG AA compliance check
   - Color contrast validation
   - Keyboard navigation test
   - Screen reader verification
   - Time: 2–3 hours

**QA subtotal: 12–17 hours**

### Phase 1 Total Effort

- **Backend**: 29–39 hours
- **Mobile**: 38–47 hours
- **Desktop**: 38–47 hours
- **QA/Testing**: 12–17 hours
- **Total**: ~130–150 hours (~3.5–4.5 weeks for a 3-person team, assuming 40h/week capacity)

### Phase 1 Deliverables

✅ Fully functional agenda list with pagination (future by default)
✅ Ability to load past agendas (scroll up)
✅ Agenda detail screen with metadata
✅ Embedded event list (future by default, paginated)
✅ Event status management (mark complete/cancel)
✅ Agenda CRUD (create, edit, delete)
✅ API spec fully implemented
✅ Database migrations applied
✅ Mobile and desktop UIs functional and consistent
✅ Unit and integration tests passing (60%+ coverage)
✅ Documentation complete (this roadmap, API spec, DB schema, UI/UX guide)

---

## Phase 2: Polish & Advanced Features (Weeks 5–8)

**Goal**: Performance, search, filtering, real-time sync, advanced status management.

### Candidates for Phase 2

1. **Agenda search and filtering**
   - Search by title/description
   - Filter by status (active, completed, cancelled)
   - Filter by date range
   - Time: 6–8 hours (backend + frontend)

2. **Event search within agenda**
   - Quick search events by title
   - Filter events by status
   - Time: 4–5 hours

3. **Bulk operations**
   - Select multiple events
   - Bulk mark as completed / cancel
   - Bulk remove from agenda
   - Time: 6–8 hours

4. **Real-time updates** (WebSocket)
   - Notify clients of agenda/event changes
   - Live status updates across devices
   - Time: 8–10 hours (backend + frontend setup)

5. **Event creation/editing from agenda detail**
   - Create new event within agenda context
   - Inline event editing
   - Time: 6–8 hours

6. **Agenda tags/categories**
   - Add tag enum to agendas
   - Filter by tag
   - Time: 4–5 hours

7. **Performance optimization**
   - Memoization of components
   - Virtual scrolling for large lists
   - Lazy loading of event details
   - Time: 6–8 hours

8. **Accessibility enhancements**
   - Full ARIA support
   - Keyboard shortcut help overlay
   - Reduced-motion variants
   - Time: 4–5 hours

### Decision Criteria

Prioritize based on:
- User feedback (what's most requested?)
- Business impact (what drives engagement?)
- Complexity vs. value (quick wins first)
- Technical debt (what's risky or slow?)

---

## Phase 3: Advanced & Automation (Weeks 9+)

### Candidates for Phase 3

1. **Recurring agendas** (templates)
   - Support recurring agenda patterns (weekly standup agendas, monthly reviews, etc.)
   - Time: 12–15 hours

2. **Agenda collaboration**
   - Share agendas with other users
   - Assign tasks within agenda
   - Time: 15–20 hours

3. **Integration with reminders**
   - Agenda-level reminders (15 min before start)
   - Notification delivery (FCM, APNs, desktop IPC)
   - Time: 8–10 hours

4. **Agenda export/calendar integration**
   - Export to iCal format
   - Sync with Google Calendar / Outlook
   - Time: 10–12 hours

5. **Analytics & reporting**
   - Track agenda completion rate
   - Time spent in agenda vs. planned
   - Historical trends
   - Time: 8–10 hours

---

## Risk Mitigation & Dependencies

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Pagination performance (large datasets) | Medium | High | Implement cursor-based pagination early; test with 10k+ agendas |
| Nested scroll (mobile event list within detail) | Medium | Medium | Use ScrollView with proper nesting; avoid FlatList-in-FlatList |
| Timezone handling (UTC ↔ local) | High | Medium | Centralize timezone conversion in hooks/services; test thoroughly |
| Event status conflicts (concurrent updates) | Low | Medium | Implement optimistic updates + server-side conflict resolution |
| Database constraint violations | Low | Medium | Add comprehensive validation in DTOs; test edge cases |

### Critical Path Dependencies

1. **Database migrations** must be merged first (blocks all data operations)
2. **Backend API** must be deployed before mobile/desktop can integrate
3. **API client** setup must be done before screens can consume endpoints
4. **TypeORM entities** must be solid before service implementation

### Recommended Dependency Order

```
Migrations (V9–V11)
  ↓
TypeORM entities
  ↓
Backend API (service + controller)
  ↓
Backend tests (unit + integration)
  ↓
Mobile API client setup
  ↓
Desktop API client setup
  ↓
Mobile screens (List + Detail)
  ↓
Desktop pages (List + Detail)
  ↓
Cross-platform testing & QA
```

### Branching Strategy

```
main (production)
├── develop (integration branch)
│   ├── feature/agenda-db (migrations + entities)
│   ├── feature/agenda-backend (API)
│   ├── feature/agenda-mobile (Expo screens)
│   └── feature/agenda-desktop (Electron pages)
```

- Merge feature branches to `develop` via PR
- Integration tests must pass before merge
- Code review required from at least one peer
- Once all features in `develop`, merge to `main` for release

---

## Testing Strategy

### Unit Tests (Per Feature)

- **Backend services**: 70%+ coverage (CRUD, pagination, error cases)
- **Mobile hooks**: 60%+ coverage (state management, API calls)
- **Desktop hooks**: 60%+ coverage (same as mobile)
- **DTOs**: 100% coverage (validation rules)

### Integration Tests

- **Backend API endpoints**: Test full request-response cycle
- **Database queries**: Verify indexes, sorting, filtering
- **API client → server**: End-to-end API flow

### E2E Tests (Optional but Recommended)

- **Mobile**: Detox or Playwright Native (test on simulator)
- **Desktop**: Playwright Electron or Spectron
- **Scenarios**: Create agenda → add events → change status → delete

### Manual QA Checklist

- Cross-browser testing (web, if applicable)
- Cross-device testing (iOS, Android, macOS)
- Accessibility audit (WCAG AA)
- Timezone / DST edge cases
- High-volume data testing (1000+ agendas)

---

## Success Metrics

### Technical KPIs

- All automated tests passing (70%+ coverage target)
- API response time < 200ms for paginated list endpoints
- Zero critical security vulnerabilities
- Database query performance within SLA (no N+1 queries)

### User Metrics

- Agenda list adoption (% of users viewing Agenda screen)
- Average events per agenda (to validate usefulness)
- Event status update frequency (engagement indicator)
- Feature retention (% of users returning after first use)

### Code Quality

- Zero eslint warnings in feature code
- TypeScript strict mode enabled
- No deprecated dependencies
- Documented API (OpenAPI spec)

---

## Notes for Developers

1. **Use the design documents**: Refer to `overview.md`, `database.md`, `api.yml`, and `ui-ux.md` before writing code.
2. **Follow conventions**: Respect the no-hardcode rule, use constants/enums, follow naming patterns from existing code.
3. **Test as you go**: Write tests alongside features; don't defer testing to the end.
4. **Communicate**: Daily standups to sync across teams; flag blockers early.
5. **Document decisions**: If you deviate from the spec, document why (in commit messages or PRs).

---

## Timeline Summary

| Phase | Duration | Team | Key Deliverable |
|-------|----------|------|-----------------|
| **MVP (Phase 1)** | 3.5–4.5 weeks | 3 devs | Fully functional agenda feature with core flows |
| **Polish (Phase 2)** | 2–3 weeks | 2–3 devs | Search, filtering, performance, real-time |
| **Advanced (Phase 3)** | 4+ weeks | 2–3 devs | Recurring agendas, collaboration, integrations |

**First release candidate**: End of Phase 1 (Week 4–5)

