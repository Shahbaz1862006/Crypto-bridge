# Fastpikeswop Crypto-Bridge (Pug + Express)

Server-rendered Pug templates over Express, with vanilla JS + `localStorage`
for client-side state. This replaces the earlier React / Vite setup.

## Stack

- **Express** — serves Pug templates and static assets.
- **Pug** — server-side templating for every page.
- **Vanilla JS (ES modules)** — page logic, modals, dev panel, etc.
- **Tailwind CSS (v4)** — compiled via `@tailwindcss/cli`.
- **localStorage** — persists the bridge order + merchant history + dev flags.

## Project layout

```
server.js                 Express server + route table
views/                    Pug templates
  layout.pug              Root HTML layout
  bridge/_layout.pug      Bridge-flow layout (stepper + back button)
  merchant/_layout.pug    Merchant layout (sidebar)
  components/             Shared mixins (modals, dev panel)
  bridge/*.pug            Bridge pages (email, otp, explain, payment, …)
  merchant/*.pug          Merchant pages (home, history)
public/
  css/app.css             Compiled Tailwind output (git-ignored)
  js/app.js               Client entry, page-module loader
  js/store.js             Global store (localStorage + pub/sub)
  js/pages/*.js           Page-specific JS, auto-loaded per view
  js/{modal,loading,success-modal,failed-modal,copy,
      cooling-ticker,bridge-guard,dev-panel}.js
  assets/                 Images (logos, icons)
src/styles/
  tailwind.css            Tailwind entry (+ `@source` for pug/js)
  theme.css               CSS variables for the light theme
```

## Scripts

```bash
npm install                # once

npm run css:build          # one-shot Tailwind build
npm run css:watch          # Tailwind in watch mode
npm run server             # run Express on :3000
npm run server:dev         # nodemon watch
npm run dev                # concurrent css:watch + server:dev
npm start                  # css:build then run server
```

Open http://localhost:3000 — you will land on `/merchant`.

## Flow

The user journey is preserved from the original React app:

1. `/merchant` — "Deposit via Fastpikeswop" button.
2. `/bridge/verify-email` — email verification (screen 1–3).
3. `/bridge/verify-otp` — 6-digit OTP (screen 4–6). The code `123456`
   always fails; any other 6-digit code succeeds (demo).
4. `/bridge/explain` — purchase explanation + Continue/Cancel.
5. `/bridge/payment` — UPI vs. IMPS/RTGS/NEFT; UPI shows QR + UTR.
6. `/bridge/beneficiary` — bank beneficiary + cooling period (for BANK).
7. `/bridge/cooling-select`, `/bridge/cooling` — cooling countdown.
8. `/bridge/verify` — BRN/UTR verification + success/failed modals.
9. `/merchant/history` — transaction table, resume cooling/verify deep-links.

A floating **DEV** button (bottom-right) toggles a dev panel to
manipulate exchange rate, force verify failures, seed history, etc.
