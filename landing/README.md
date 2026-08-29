# Landing

The marketing / landing page for the product, modeled on the look of
[eddie.eco](https://eddie.eco/). Standalone Next.js app (sibling of `dashboard`).

## Run it

```bash
cd landing
npm install     # or: pnpm install
npm run dev     # http://localhost:3000
```

## Build / checks

```bash
npm run build       # production build
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run format      # prettier
```

## Structure

```
app/                 App Router: layout + pages
components/          ui/ primitives (shadcn-style) + landing sections
lib/                 utils
```

## Placeholders

Animated sections (the phone call demo, waveform, scroll reveals…) are
deliberate **placeholders** — static, well-composed stand-ins with `TODO`
comments — the user builds the real animations later. See
`components/landing/README.md` for the exact list.
