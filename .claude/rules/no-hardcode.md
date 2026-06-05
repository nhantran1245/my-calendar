# No Hard-coding — Constants and Enums Only

Never hard-code magic strings, numbers, URLs, or configuration values inline in logic code.

## Where constants live

| Package | Path |
|---|---|
| Backend | `backend/src/constants/` (re-export via `index.ts`) |
| Mobile | `mobile/src/constants/` |
| Desktop (main) | `desktop/src/constants/` |
| Desktop (renderer) | `desktop/src/renderer/constants/` |

## When to use `const` vs `enum`

- **`const`** — standalone value (port numbers, timeout durations, URL prefixes, string keys)
- **`enum`** — fixed named set of related values (sort direction, event status, notification type)

## Naming

- Constants: `UPPER_SNAKE_CASE`
- Enum types: `PascalCase`
- Enum members: `UPPER_SNAKE_CASE`

## Examples

```typescript
// WRONG
repo.find({ order: { startAt: 'ASC' } });
new Date(Date.now() + 60_000);
app.setGlobalPrefix('api');

// CORRECT
import { SortOrder } from './enums/sort-order.enum';
import { REMINDER_POLL_WINDOW_MS, API_PREFIX } from '../constants';

repo.find({ order: { startAt: SortOrder.ASC } });
new Date(Date.now() + REMINDER_POLL_WINDOW_MS);
app.setGlobalPrefix(API_PREFIX);
```

## Reusability

- Logic used in more than one place must be extracted into a service, utility function, or hook — never duplicated.
- API client setup (base URL, headers) lives in a single `api/client.ts` per package; individual resource functions live alongside it (e.g. `api/events.ts`).
- Types/interfaces shared across feature files within a package go in a `types/` folder.
