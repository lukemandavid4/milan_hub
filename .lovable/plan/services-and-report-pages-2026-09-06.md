# Services and Report pages

## Build
- Add a working Services page with a two-column service entry form, excluding the shop field, plus payment method and an empty recent-services table that fills as services are added.
- Add a working Report page with four stock summary cards, a daily stock movement chart, and a recent activity table; all values start empty/zero rather than using dummy records.
- Activate Services and Report in the sidebar while keeping Revenue, Notifications, and History inactive.
- Preserve the Milan Hub matte-black/neon-green styling and the shared Daily Sales button on both pages.

## Technical details
- Create dedicated `/services` and `/report` routes with unique page metadata.
- Use existing semantic design tokens, controls, Recharts, and the shared dashboard shell.
- Verify both pages, navigation, service entry, and desktop layout in the live preview.
