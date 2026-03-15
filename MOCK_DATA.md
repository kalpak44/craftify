# Mock Data Conventions

## Current Repository Context

The repository already contains ERP-oriented mock fixtures in:

- `frontend/src/features/erp/data/demoData.js`

This file should remain the seed for dashboard-style overview data until feature-specific mock modules are introduced.

## Where Mock Data Should Live

- Cross-module ERP overview fixtures: `frontend/src/features/erp/data/*`
- Feature-specific fixtures: `frontend/src/features/<feature>/data/*`
- Avoid embedding large mock arrays directly in route files unless the fixture is strictly temporary and tiny.

## Structuring Domain Fixtures

Prefer domain-shaped records over presentation-only objects.

Examples:

- `orders`: order id, channel, table or customer, status, amount, items count, eta, timestamps
- `ingredients`: sku/code, name, unit, supplier, reorder threshold, current stock
- `inventory`: location, available quantity, reserved quantity, unit, last movement
- `deliveries`: route, driver, stops, load type, ETA, status
- `tables`: zone, seat count, occupancy state, reservation time
- `dishes`: menu id, prep time, station, availability, allergens
- `suppliers`: supplier id, contact, lead time, category coverage
- `users`: role, assigned location, language, permissions summary
- `settings`: localization, currency, unit defaults, timezone, formatting

## Naming Rules

- Use plural exports for collections (`orderRows`, `deliveryRows`, `settingsSections`)
- Use singular helper names for builders or normalizers (`buildOrderSummary`)
- Use stable `id` fields whenever possible
- Prefer `statusKey` values that map directly to translation keys

## Mock Service Rules

Mock services should:

- behave like thin adapters over domain fixtures
- return shapes similar to planned API responses
- isolate delays, filtering, and mapping logic from route components
- be easy to replace with real API clients later

Do not couple route components directly to fixture internals when a feature is expected to grow.

## Keeping Mock Data Replaceable

- Use fields that are plausible backend fields
- Avoid UI-only computed text inside the source fixtures when a key or raw value would work
- Keep formatting concerns in the UI layer
- Keep translation lookup in the UI, not in the mock record

## ERP Entity Coverage

When expanding mock coverage, plan fixtures for:

- orders
- ingredients
- deliveries
- tables
- dishes
- inventory
- suppliers
- users
- settings
- procurement requests
- production batches or kitchen tickets

## Practical Guidance For This Repository

- Keep dashboard mock data in `frontend/src/features/erp/data/demoData.js`
- Add feature-local fixture files as core modules are implemented
- Use dashboard and setup wizard screens to prove mock structure before deeper API adoption
- Do not mix backend-fetching code and mock fixtures in the same module
