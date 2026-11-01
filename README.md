# Iceberg web app

Next.js 16 (App Router) + TypeScript + Tailwind + shadcn/ui. It serves the website **and** the API (`src/app/api`).

- Setup and daily commands: [../docs/11-local-setup.md](../docs/11-local-setup.md)
- Where code goes (layers, folders): [../docs/02-architecture.md](../docs/02-architecture.md), [../docs/05-backend-guide.md](../docs/05-backend-guide.md)
- Screens and design system: [../docs/06-frontend-guide.md](../docs/06-frontend-guide.md)

```bash
npm run dev        # dev server on :3000
npm run check      # lint + typecheck + tests (run before every push)
npm run build      # production build
```

`AGENTS.md` is written by Next.js itself: this version differs from older tutorials, so read the docs bundled in `node_modules/next/dist/docs/` when unsure.
