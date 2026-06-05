Implement the backend API defined in the following design files:

$ARGUMENTS

Parse the arguments as two file paths:
- First path: the OpenAPI 3.0 YAML file (api design)
- Second path: the database design Markdown file (schema, entities, migrations)

If either file path is missing or the files do not exist, stop and ask the user to provide them.

---

## Your task

Read both input files in full, then read the existing backend source to understand conventions:
- `CLAUDE.md` — architecture, naming, and structural conventions
- `backend/src/` — existing module structure (use events module as reference)
- `.claude/rules/` — coding rules (no hardcoding, constants/enums, etc.)
- `backend/package.json` — to check which packages are already installed

Then implement the full NestJS backend for all endpoints described in the API YAML. Follow the steps below in order.

---

## Step 1 — Install missing dependencies

Check `backend/package.json`. Install any packages required by this feature that are not already listed (e.g. `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcrypt`, `@nestjs/swagger`, `swagger-ui-express`, etc.) using `npm install --save` and dev-types with `npm install --save-dev`.

---

## Step 2 — Database migrations

Check `db/migrations/` for the highest existing `V{n}` number. Write any new Flyway migration files described in the database design doc that do not yet exist. Follow the convention exactly: `db/migrations/V{n}__{description}.sql`. Never modify existing migration files.

---

## Step 3 — Constants and enums

Before writing any logic, define all constants and enums this feature needs:
- Backend constants → `backend/src/constants/` (re-export via `index.ts`)
- Enums → `backend/src/enums/` or co-located `*.enum.ts` files
- No magic strings, numbers, or inline config values anywhere in the implementation

---

## Step 4 — TypeORM entities

Create or update TypeORM entity files based on the database design doc:
- File location: `backend/src/<module>/<name>.entity.ts`
- Use `@PrimaryGeneratedColumn('uuid')` for UUID PKs
- Use camelCase property names with explicit `name: 'snake_case'` in column decorators
- Use `@CreateDateColumn` / `@UpdateDateColumn` for timestamp columns
- Register every new entity in its module's `TypeOrmModule.forFeature([...])` imports

---

## Step 5 — DTOs

Create DTOs for every request body and query parameter:
- File location: `backend/src/<module>/dto/<name>.dto.ts`
- Use `class-validator` decorators (`@IsString`, `@IsEmail`, `@MinLength`, etc.)
- Use `@ApiProperty()` / `@ApiPropertyOptional()` from `@nestjs/swagger` on every field
- Controller must use `ValidationPipe({ whitelist: true })`

---

## Step 6 — Service

Implement the service class with all business logic:
- File location: `backend/src/<module>/<name>.service.ts`
- Inject TypeORM repositories via `@InjectRepository`
- No raw SQL — use TypeORM query builder or repository methods
- Throw typed NestJS exceptions (`NotFoundException`, `ConflictException`, `UnauthorizedException`, etc.)
- No magic values — reference constants/enums from Step 3

---

## Step 7 — Controller

Implement the controller:
- File location: `backend/src/<module>/<name>.controller.ts`
- Decorate with `@ApiTags('...')`, `@ApiOperation(...)`, `@ApiResponse(...)` for every endpoint
- Use `@ApiBearerAuth()` on protected routes
- Bind guards, pipes, and interceptors at the method level where needed
- Return types must match the response schemas in the API YAML

---

## Step 8 — Module wiring

Create or update the NestJS module file (`<name>.module.ts`):
- Import `TypeOrmModule.forFeature([...])` for all entities
- Declare all controllers and providers
- Export services that other modules need
- Import this module into `AppModule` (or `AuthModule` if it is the auth feature)

---

## Step 9 — Swagger setup

If `@nestjs/swagger` is not yet configured in `backend/src/main.ts`, add it:

```typescript
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('My Calendar API')
  .setDescription('Personal calendar REST API')
  .setVersion('1.0')
  .addBearerAuth()
  .build();
const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

If it is already configured, ensure the new module's tags and decorators appear correctly without changing existing setup.

---

## Step 10 — Unit tests

Write Jest unit tests for every **service method**:
- File location: `backend/src/<module>/<name>.service.spec.ts`
- Mock all external dependencies (repositories, other services, JWT, bcrypt) using `jest.fn()` / `createMock`
- Cover: happy path, not-found, conflict/duplicate, unauthorized, and edge cases
- Use `describe` blocks per method, `it` blocks per scenario
- Do **not** test controllers in unit tests (controller logic belongs in e2e tests)

After writing tests, run them:
```bash
cd backend && npm run test -- --testPathPattern=<module>
```

Fix any failures before finishing. Do not leave skipped or commented-out tests.

---

## Definition of done

- [ ] All endpoints in the API YAML are implemented
- [ ] Every endpoint has Swagger decorators (`@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiProperty` on DTOs)
- [ ] Swagger UI is accessible at `GET /api/docs`
- [ ] No magic strings, numbers, or hardcoded config — all in constants/enums
- [ ] Unit tests written and passing for all service methods
- [ ] Module registered in AppModule
- [ ] No TypeScript errors (`cd backend && npm run build` passes)
