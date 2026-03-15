# Repository Guidance For Coding Agents

## Project Purpose

Craftify is a multilingual ERP frontend and backend for restaurant and production operations. The current repository already contains a working React/Vite frontend skeleton in `frontend/` and a Spring Boot backend in `backend/`.

The frontend is being evolved toward a mobile-first ERP UI that supports:

- restaurant ordering and table service
- ingredient receiving, storage, transfer, and inventory tracking
- production and kitchen workflows
- procurement and supplier coordination
- delivery tracking for internal logistics and customer orders
- reporting and configuration

## Product Context

This is not a marketing site rewrite. The product should feel like an operational workspace with:

- fast access to daily actions
- clear status visibility
- resilient layouts on phones and tablets
- realistic mock data where APIs are incomplete
- scalable module navigation for future ERP sections

## Current Architecture Expectations

Preserve and build on the existing structure:

- `frontend/src/app/*` for app shell and routing
- `frontend/src/features/*` for feature ownership
- `frontend/src/shared/ui/*` for reusable UI primitives and layout building blocks
- `frontend/src/providers/*` and `frontend/src/hooks/*` for app-wide concerns
- `frontend/src/shared/i18n/messages.js` as the current translation source
- `frontend/src/features/erp/data/demoData.js` for ERP-oriented mock data

Do not collapse feature modules back into a single `pages/` dumping ground. Existing large files in `frontend/src/pages/*` should be treated as legacy surfaces to wrap and gradually refactor, not as the preferred pattern for new work.

## What Must Be Preserved

- Existing routing and Auth0 integration
- Existing localization provider and locale switcher behavior
- Existing theme provider and CSS variable theme system
- Existing reusable UI atoms, molecules, organisms, and templates where they are still fit for purpose
- Existing CRUD routes for items, inventory, BOMs, work items, calendar, legal pages, and callback handling

## Preferred Implementation Style

- Make incremental, low-risk changes
- Prefer new shared components over repeated page-local UI
- Keep domain behavior near the relevant feature folder
- Keep layout concerns separate from feature data concerns
- Add translation keys for all new user-facing text
- Prefer mock service adapters and domain fixtures over ad hoc inline arrays inside route files

## Safe Refactoring Rules

Before editing:

1. Inspect the route, shared UI, and provider layers involved.
2. Check whether the target file is part of the newer shared shell system or an older monolithic page.
3. Reuse existing atoms/molecules/templates before creating new ones.
4. Preserve working user flows unless the refactor explicitly replaces them.

When refactoring:

- Wrap old pages in new layout structure before rewriting their internals.
- Extract shared UI pieces only after at least one repetition is confirmed.
- Remove weak or duplicate code gradually, not in broad rewrites.
- Avoid changing API contracts unless the backend and affected screens are updated together.

## Multilingual Rules

- Every new label, heading, empty state, CTA, or helper text must use translation keys.
- Add English keys first in `frontend/src/shared/i18n/messages.js`.
- Add Bulgarian translations for navigation and high-visibility workflow text when practical.
- It is acceptable for unsupported locales to fall back to English through the existing provider.
- Do not hardcode visible strings inside reusable UI components.

## Mock Data Rules

- Use mock data when backend support is missing or unstable.
- Keep mock data domain-oriented and reusable.
- Prefer `frontend/src/features/erp/data/*` or feature-local `data/*` modules over inline route constants.
- Mock data must stay replaceable by future API adapters.
- Mock entities should resemble real ERP records: ids, statuses, timestamps, relationships, quantities, units, owners, and locations.

## Responsive And Mobile-First Rules

- Design for small screens first.
- Assume protected ERP screens must work at `320px` width.
- Sidebar navigation may collapse into drawer or bottom-sheet behavior on small screens.
- Tables must degrade into cards or stacked rows when horizontal scanning breaks down.
- Page headers should not depend on wide desktop-only layouts.

## Component Reuse Expectations

- Reuse `shared/ui/atoms`, `molecules`, `organisms`, and `templates` whenever possible.
- Create new shared components only when they serve multiple modules or establish a clear system pattern.
- Keep feature-specific widgets inside the owning feature unless they become broadly reusable.

## What To Avoid

- Full rewrites of the frontend skeleton
- New one-off design systems inside individual pages
- Hardcoded text in protected ERP screens
- Introducing dependencies for simple layout, chart, or state problems
- Reusing `frontend/src/components/page-layout/FullWidthLayout.jsx` as a new foundation
- Mixing mock-only assumptions directly into API clients

## Feature Work Structure

For new ERP modules or route-level work:

1. Add or update route metadata/navigation config.
2. Build or extend shared shell/layout primitives if needed.
3. Add or refine mock data fixtures.
4. Implement route UI with i18n keys.
5. Keep API integration behind feature-local adapters.
6. Leave old pages functioning until their replacement is verified.

## Expected Workflow Before Editing Code

1. Inspect affected routes, providers, shared components, and data sources.
2. Identify what should be preserved versus replaced.
3. Update repository guidance if conventions materially change.
4. Implement the smallest coherent slice.
5. Run at least `npm run build` in `frontend/` when frontend files change.
6. Note risks, follow-up refactors, and any remaining legacy seams.
