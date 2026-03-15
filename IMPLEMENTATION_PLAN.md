# Implementation Plan

## Repository Audit Summary

The repository already contains a useful frontend skeleton:

- Vite + React + React Router frontend in `frontend/`
- Spring Boot backend in `backend/`
- global providers for Auth0, theme, and localization
- a newer shared UI layer under `frontend/src/shared/ui/*`
- a newer route shell under `frontend/src/app/*`
- ERP demo data in `frontend/src/features/erp/data/demoData.js`

The main inconsistency is that most protected ERP routes still re-export large legacy pages from `frontend/src/pages/*`, while the shell, home page, and shared primitives are already moving toward a cleaner feature-based architecture.

## Current Strengths

- Existing i18n provider with broad locale coverage
- Existing dark/light theming via CSS variables
- Shared atoms, molecules, organisms, and templates that can support a stronger system
- Existing authenticated CRUD flows for items, inventory, BOMs, work items, and calendar
- Existing ERP-flavored mock dashboard data

## Current Weaknesses And Gaps

- Protected app chrome is still top-nav oriented instead of sidebar-first ERP navigation
- Route architecture is cleaner than page internals; many route targets are still large monolithic files
- Core ERP sections like Orders, Deliveries, Tables, Menu, Procurement, and Settings lack a stable route foundation
- No setup wizard foundation yet
- Mock data strategy exists but is not yet codified for feature-by-feature growth
- Design consistency is uneven between the newer home/shell code and older protected pages

## Phased Rollout

### Phase 1: Low-Risk Foundation

- document repository conventions
- introduce a dedicated protected ERP shell with sidebar navigation
- add route metadata for current and planned modules
- add a real dashboard route using shared mock data
- add a settings route and onboarding/setup wizard foundation
- keep existing CRUD pages mounted inside the new shell

### Phase 2: Shared Page Patterns

- extract reusable page header, stat card, table-card responsive patterns
- normalize status badge usage
- standardize empty/loading/error handling
- align dashboard, settings, and new module placeholders to one visual language

### Phase 3: Module Expansion

- implement Orders, Deliveries, Procurement, Tables, and Menu using mock-backed routes first
- add feature-local data modules and mock services
- move route-level placeholder screens toward operational CRUD and overview flows

### Phase 4: Legacy Screen Refactoring

- refactor `frontend/src/pages/ItemsPage.jsx`
- refactor `frontend/src/pages/BOMsPage.jsx`
- refactor `frontend/src/pages/InventoryPage.jsx`
- refactor `frontend/src/pages/WorkItemsPage.jsx`
- replace ad hoc repeated controls with extracted shared patterns

## Pages And Components To Tackle First

- protected ERP shell
- dashboard
- settings overview
- setup wizard
- navigation metadata

These provide the most visible architectural improvement with the lowest risk to existing business flows.

## Sidebar, Dashboard, And Wizard Direction

- Sidebar becomes the main protected navigation on tablet and desktop.
- Mobile uses a matching drawer instead of a separate information architecture.
- Dashboard becomes the default authenticated landing page.
- Setup wizard lives under settings first, then can be invoked post-registration later without structural rework.

## Gradual Cleanup Strategy

- Preserve working legacy pages and render them inside the new shell.
- Avoid rewriting existing CRUD logic during the shell migration.
- Mark obsolete layout code as legacy and stop extending it for new work.
- Move new cross-cutting UI patterns into `shared/ui/*` as they become stable.

## Consistency Validation

During implementation, check:

- all new strings use i18n
- protected routes use the same shell
- mobile layouts stack cleanly
- theme variables work in both light and dark modes
- mock data shape stays domain-oriented
- `frontend/` still builds successfully
