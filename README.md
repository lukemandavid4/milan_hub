# Neon Stock Hub

Build a full-featured inventory and stock management dashboard web application inspired by modern SaaS management tools, tailored with a cyberpunk-inspired matte black and neon green aesthetic. The name of the brand logo should be Milan Hub. Make sure only the Dashboard and Products button are working the rest should be there but inactive

Design & Theme System

Backgrounds: Deep matte blacks (#0a0a0c, #121214) for primary canvases and sleek slate-black cards (#18181b / #1f1f23) with subtle borders (border-zinc-800).

Accents & Highlights: Electric neon/lime green (#22c55e / #00ff66 / #4ade80) for active states, CTA buttons, chart bars, glowing badge highlights, and primary metrics.

Typography & Status: Crisp white headers, muted zinc/gray secondary text (#a1a1aa), subtle neon amber for warnings ("Low Stock"), and muted neon crimson for errors ("Out of Stock"). Clean, modern sans-serif typography with high contrast.

Sidebar Navigation

Create a collapsible dark sidebar on the left:

Brand: Logo icon with the app name (e.g., "StockPulse" or "StockFlow").

Navigation Links:

Dashboard (Overview)

Products (Inventory table, add/edit/delete SKU, category filters)

Services (Service catalog & tracking)

Report (Analytics, exportable CSV/PDF summaries)

Revenue (Sales numbers, profit margin tracking)

Notifications (Alerts center)

History (Activity audit log) (Note: Do NOT include a "Transfers" page).

Bottom Profile Section: Current user card (avatar/email, role badge like "Admin", and a Sign Out button).

Dashboard Layout (Main View)

Top Bar / Header:

Page title ("Dashboard") and subtitle ("Welcome back! Here's your stock report").

Quick action button on the top-right: "Daily Sales" (opens a modal or quick-entry drawer with neon green accents).

Top Metric KPI Cards (3 Cards in a Row):

Total Stock: Total quantity count, subtext with total unique SKU count, icon container with neon green glow.

Low Stock Items: Count of items near threshold, warning badge/subtext ("Need attention").

Out of Stock: Critical count, red/amber alert badge ("Needs restocking").

Analytics & Activity Grid (Two-Column Layout):

Left Panel — Stock by Category (Bar Chart):

Use Recharts to show inventory distribution across categories (e.g., Phones, Laptops, Sound, Accessories, Electronics, Networking).

Matte card background with neon green vertical bars, glowing hover tooltips, and muted grid lines.

Right Panel — Recent Activity:

A real-time feed listing the latest stock updates, restocks, or low-stock alerts.

Item row includes: Alert/Status icon, item name + spec, alert status tag (e.g., "Low stock: 1 unit"), and timestamp.

Interactivity & State Management

Include mock data for all metrics, charts, and activity feeds.

Add search and filtering capabilities to the Products table.

Smooth hover transitions, interactive tooltips, and glowing pill badges matching the matte black and neon green colorway.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b99114a8-9695-4b98-862b-dcb624943726).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
