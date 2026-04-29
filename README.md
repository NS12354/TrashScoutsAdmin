# Trash Scouts — resident app

A mobile-first webapp giving residents per-building trash info. Scan the
QR code in your trash room (or visit the homepage and let it geolocate
you), and you get:

- The next pickup ("Bins go out today, 6–9pm")
- Your assigned Trash Scout's name + photo
- The full weekly service schedule
- Setup photos showing how the trash room should look
- A guide to what goes in which bin
- A hazardous-waste guide with regional drop-off facilities
- A no-account "report an issue" form (photos go straight to Trash Scouts via email)

This is the **resident-only** stage. Admin and hauler features are
deferred — content lives in TypeScript files (`src/data/*.ts`) and ships
with each git push.

Stack: Next.js 16 (App Router) · TypeScript · Tailwind v4 · Resend (for
issue-report emails). No database.

## Local dev

```bash
npm install
cp .env.example .env.local   # fill in NEXT_PUBLIC_SITE_URL etc.
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Geolocation works
on `localhost`. To test on your phone, use ngrok:

```bash
npx ngrok http 3000
```

…and open the printed `https://*.ngrok-free.app` URL on your phone.

## Routes

- `/` — location-aware home (geolocates and routes to the nearest
  building's page)
- `/p/[id]` — building landing page (welcome + porter card + 5 tiles)
- `/p/[id]/setup` — setup photos
- `/p/[id]/schedule` — weekly schedule + "next pickup" hero
- `/p/[id]/report` — issue submission form
- `/p/[id]/report/success` — confirmation
- `/p/[id]/hhw` — hazardous-waste guide + drop-off facilities
- `/p/[id]/guide` — recycling guide
- `/p/select` — pick a building (used as fallback when geolocation is
  denied or far from any of our buildings)
- `/privacy` · `/terms` — legal pages
- `POST /api/issues` — submission endpoint (emails the report + photos
  to `NOTIFICATION_EMAIL`)
- `GET /api/properties/nearest?lat=&lng=` — finds the closest property
- `GET /api/qr?path=/p/<id>&size=800&download=1` — generates a QR PNG

## Editing content

See [DEPLOY.md](DEPLOY.md) section 5 for the file-by-file map. Most
edits are quick:

- Schedule for a building → `src/data/properties.ts`
- Porter / tenure → `src/data/porters.ts`
- Guide text → `src/data/guides.ts`
- HHW drop-off list → `src/lib/hhwDropoffs.ts`

## Deploy

[DEPLOY.md](DEPLOY.md) — click-by-click for Vercel + Resend. ~15 minutes
total.
