# Contributing

## Code Structure

- `frontend/src/app/*`: routing and app-level shells
- `frontend/src/features/*`: feature-owned routes, data, and feature UI
- `frontend/src/shared/*`: reusable UI and cross-feature helpers
- `frontend/src/pages/*`: legacy page implementations still in use by several routes
- `backend/src/*`: Spring Boot backend

## Naming Conventions

- React components: `PascalCase`
- Hooks: `useSomething`
- Route files: `SomethingRoute.jsx`
- Shared UI primitives: keep names short and pattern-oriented (`Surface`, `StatusBadge`, `PageContainer`)
- Translation keys: dot-separated and domain-scoped (`dashboard.title`, `wizard.step.company`)

## File And Folder Organization

- Place the new route-level UI under the owning feature first.
- Add `data/` folders for mock fixtures or route metadata.
- Add `components/` folders inside a feature only when a route grows past a few small helpers.
- Promote components to `shared/ui` only after they clearly serve multiple modules.

## Reusable Component Strategy

- Prefer extending existing primitives before adding another card/button/layout abstraction.
- Reuse the protected ERP shell and page container patterns for all protected modules.
- Keep legacy page internals isolated until they are intentionally refactored.

## Feature Boundaries

- Domain pages should not import unrelated module state directly.
- API helpers stay in `frontend/src/api/*` until a stronger feature-local boundary is justified.
- Mock fixtures should mirror domain concepts, not page-specific presentation only.

## Refactoring Principles

- Replace layout and navigation seams before replacing domain CRUD logic.
- Refactor large legacy pages by extracting stable subcomponents, not by rewriting everything at once.
- If a legacy screen works but looks inconsistent, wrap it in the new shell first and defer internal cleanup to later phases.

## i18n Conventions

- Add all new UI strings to `frontend/src/shared/i18n/messages.js`.
- English is the default source of truth.
- Add Bulgarian translations for user-visible shell, dashboard, and onboarding text when practical.
- Avoid embedding sentence fragments that are hard to localize later.

## Mock Data Conventions

- Store reusable ERP mock data in `frontend/src/features/erp/data/*` or feature-local `data/*`.
- Keep ids, timestamps, status keys, and relationships realistic.
- Separate mock fixtures from mock view helpers when possible.

## Documentation Expectations

- Update repository markdown files when architectural or workflow conventions shift.
- Keep documentation tied to the actual repository shape.
- Avoid generic guidance that ignores the current split between shared shell code and legacy pages.

## Change Quality Expectations

- Keep changes incremental and reviewable.
- Frontend changes should pass `npm run build` from `frontend/`.
- New pages must work in both light and dark themes.
- New user-facing text must be translated through the existing i18n system.

## Avoiding Duplication And UI Drift

- Before adding UI, inspect `frontend/src/shared/ui/*`.
- Before adding mock data, inspect `frontend/src/features/erp/data/*`.
- Before creating a new page pattern, verify whether the protected shell or existing route containers already solve it.
- Do not add competing navigation systems for protected routes.
