# UI Guidelines

## Design Principles

- Mobile-first by default
- Operational clarity over decoration
- One consistent shell across protected ERP routes
- Visual hierarchy through spacing, contrast, and typography rather than noisy chrome
- Mock screens should still feel production-ready

## Existing Visual Foundation To Reuse

The current frontend already provides:

- theme variables in `frontend/src/theme.css`
- `Manrope`, `Sora`, and `IBM Plex Mono`
- glass/surface styling through `Surface`
- action styles through `Button`
- shared heading treatment through `SectionHeading`

New screens should extend that foundation rather than inventing unrelated color systems.

## Mobile-First Rules

- Start with single-column stacking.
- Promote dense two-column or three-column layouts only from tablet widths upward.
- Keep touch targets at least `44px` high.
- Keep critical summary information visible without requiring horizontal scroll.

## Sidebar Layout Rules

- Desktop and tablet protected routes use a left sidebar as primary navigation.
- Sidebar groups should separate primary modules from secondary operational tools.
- Active state must be obvious through contrast and shape, not color alone.
- Mobile navigation should use a drawer or sheet that mirrors the same information architecture.
- Sidebar should not contain page-specific actions.

## Header Rules

- Top header is for contextual tools only: search, user menu, theme, locale, and page-level actions.
- Do not duplicate primary navigation in the header on protected screens.
- Keep header compact and sticky only if it improves task continuity.

## Page Container Rules

- Use a consistent max width and padding rhythm across protected screens.
- Every page should begin with a context block: title, short description, optional actions.
- Page sections should be visually chunked using cards or surfaces, not arbitrary background changes.

## Spacing And Hierarchy

- Use generous outer spacing and tighter internal grouping.
- Reserve stronger display typography for page titles, KPI numbers, and section anchors.
- Secondary descriptions should stay concise and muted.

## Card Patterns

- Default operational container: rounded surface with moderate padding.
- Use cards for grouped content, not as decoration for every line item.
- Cards may contain title, support text, status, and one focused action area.

## KPI And Stat Widgets

- KPI cards should show one primary metric, one context label, and one short supporting detail.
- Avoid dashboards full of unexplained numbers.
- Use consistent visual treatment across KPI cards on the same page.

## Table And List Behavior On Mobile

- Desktop tables should collapse into stacked cards when more than 4-5 columns would be required.
- Keep status, owner/location, and next action visible in mobile summaries.
- Avoid forcing horizontal scroll for critical workflows.

## Chart Guidance

- Use simple charts that can be understood in a few seconds.
- Pair charts with summary copy or adjacent KPI context.
- Prefer bar, line, and segmented distribution views over decorative complex charts.
- Charts must remain legible on narrow widths.

## Forms And Settings Patterns

- Group fields into short, labeled sections.
- Use progressive disclosure for advanced settings.
- Keep primary actions sticky only when forms are long enough to justify it.
- Settings pages should read as configuration groups, not miscellaneous forms.

## Onboarding Wizard Patterns

- Steps should be short and obvious.
- Ask for company, language, currency, units, timezone, formatting, and theme before advanced details.
- Show progress, back/next controls, and a final summary.
- Wizard should be fully usable on mobile without side-by-side forms.

## Status Badge Patterns

- Status badges must encode tone consistently across modules.
- Use badges for operational state, not for decorative labels.
- Pair color with readable text and sufficient contrast.

## Empty, Loading, And Error States

- Empty states should explain what the module is for and suggest the next action.
- Loading states should not cause full-page layout jumps unless the whole app is booting.
- Error states should be concise, actionable, and visually distinct from empty states.

## Accessibility Basics

- Maintain visible focus states.
- Ensure semantic headings and button labels.
- Keep contrast high enough in both themes.
- Do not rely only on color to communicate urgency or status.

## Theme Considerations

- The repository already supports light and dark themes via CSS variables.
- New components must use theme variables or compatible Tailwind utility combinations.
- Avoid hardcoding light-only backgrounds or dark-only text assumptions.
