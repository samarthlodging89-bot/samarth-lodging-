# Samarth Lodging - Agent Context

## Commands
- `npm run dev` — local dev server (runs `netlify dev`)
- No build, lint, test, or typecheck commands exist

## Architecture
- **Static frontend** — plain HTML/CSS/JS, no frameworks, no build step
- **Backend** — 3 serverless functions in `netlify/functions/` (kept for reference; now deploying to Vercel):
  - `send-email.js` — sends email via Brevo API
  - `delete-user-account.js`
  - `log-user-login.js`
- **Firebase** — client-side auth via CDN-compat libraries (see `index.html:23-33`); Firebase config is hardcoded in `index.html`
- **Email** — requires `BREVO_API_KEY` and `EMAIL_FROM` env vars
- **Hosting** — migrated from Netlify to Vercel (see `vercel.json`)

## Auth & Pages
- Public pages (no auth required): `login.html`, `index.html`, `rooms.html`, `main.html`
- All other pages redirect to `login.html` if not logged in (see `index.html:45-49`)
- Session managed via `session-utils.js` using `sessionStorage` and `localStorage`

## Important Constraints
- **CSP is strict** — `vercel.json` allows only specific external domains (Firebase, Google, OpenStreetMap, Brevo). Adding external resources requires CSP update
- **Single CSS file** — `styles.css` shared across all pages (~5850 lines)
- **Input sanitization** — `sanitizer.js` strips all HTML tags; used before rendering user input
- **Vercel output directory** — set to `"."` in `vercel.json` (root is the output directory)
