# Deploy Trash Scouts

Two services, ~15 minutes:
1. **Vercel** — hosts the app, gives you HTTPS (which the camera + geolocation features require).
2. **Resend** — actually sends the issue-report emails to Trash Scouts.

That's it. No database, no auth, no analytics, no CAPTCHA, no error-tracking
service. Resident-facing pages are statically pre-rendered at build time and
served from Vercel's edge — they cost effectively zero to run.

---

## 1. Push to GitHub

In the project folder:

```bash
git init
git add .
git commit -m "Initial Trash Scouts resident app"
```

Create a private repo at [github.com/new](https://github.com/new), then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/trashscouts.git
git branch -M main
git push -u origin main
```

(Optional) The included `.github/workflows/ci.yml` runs lint + tests +
build on every push. You can ignore it if you don't care; it just makes
broken pushes obvious.

---

## 2. Deploy to Vercel

1. Sign up at [vercel.com](https://vercel.com) with your GitHub account.
2. **Add New… → Project** → import the repo.
3. Vercel auto-detects Next.js — leave the build settings alone.
4. Open **Environment Variables** and add (minimum):
   - `NEXT_PUBLIC_SITE_URL` → leave blank for now; come back and set it
     to your `https://yourapp.vercel.app` URL after the first deploy.
   - `NOTIFICATION_EMAIL` → `nayan@revisent.com` for now (change later).
5. Click **Deploy**. Takes ~2 minutes.

You now have an HTTPS URL like `trashscouts-xyz.vercel.app`. Open it on
your phone — geolocation and camera permissions work because Vercel
provides HTTPS automatically.

---

## 3. Wire Resend

Without this, issue submissions just log to the Vercel function console
— no actual emails go out.

1. Sign up at [resend.com](https://resend.com) (free, 3k emails/month).
2. **API Keys → Create API Key** → copy the value.
3. In Vercel: **Project Settings → Environment Variables** → add:
   - `RESEND_API_KEY` → the key you just copied
   - `EMAIL_FROM` → `Trash Scouts <onboarding@resend.dev>` for testing
4. **Deployments → ⋯ → Redeploy** the latest deployment so the env vars
   take effect.

Test by opening `/p/1919-market/report` on the live URL and submitting a
test issue with your email in the contact field.

**Domain verification** (optional but recommended): once testing works,
go to Resend → **Domains → Add domain** → paste your trashscouts.com (or
whatever) → add the DNS records they show you. After ~10 min, change
`EMAIL_FROM` to `Trash Scouts <noreply@trashscouts.com>` and redeploy.
Now emails come from your domain instead of `resend.dev` — much more
trustworthy.

---

## 4. (Optional) Buy a real domain

In Vercel: **Project Settings → Domains → Add**. Either buy through
Vercel or point an existing domain at `cname.vercel-dns.com`. Update
`NEXT_PUBLIC_SITE_URL` afterwards.

---

## 5. Print + post QR codes

Each property has a stable URL: `https://yourapp.vercel.app/p/<id>`.

| Building | URL path |
|---|---|
| 1919 Market Street | `/p/1919-market` |
| 378 Embarcadero West | `/p/378-embarcadero` |
| 1955 Broadway | `/p/1955-broadway` |
| 950 Shorepoint Court | `/p/950-shorepoint` |

The app generates QR PNGs for you:

`https://yourapp.vercel.app/api/qr?path=/p/<id>&size=800&download=1`

Or print one master QR pointing at `https://yourapp.vercel.app/` — the
home page lists all four buildings and the resident taps theirs.

---

## Filling in real data

Everything residents see lives in `src/data/`. Edit, commit, push —
Vercel redeploys in ~90 seconds.

| What | File |
|---|---|
| Add/edit a property | `src/data/properties.ts` |
| Add a schedule | `src/data/properties.ts` (the `schedule` array) |
| Add setup photos | `public/setup/<file>` + reference under `setupPhotos` |
| Add a porter / change tenure | `src/data/porters.ts` |
| Add a porter headshot | `public/porters/<file>` + add `photoUrl` |
| Edit waste/HHW guide text | `src/data/guides.ts` |
| Edit HHW drop-off list | `src/lib/hhwDropoffs.ts` |

Schedule example:

```ts
schedule: [
  { dayOfWeek: 1, binType: "TRASH",     action: "PULL_OUT", timeWindow: "6pm - 9pm" },
  { dayOfWeek: 2, binType: "TRASH",     action: "RETURN",   timeWindow: "8am - 11am" },
  { dayOfWeek: 3, binType: "RECYCLING", action: "PULL_OUT", timeWindow: "6pm - 9pm" },
],
```

`dayOfWeek`: 0 = Sunday … 6 = Saturday.

---

## When you change the code

After every push to `main`:
1. CI runs (lint + typecheck + tests + build).
2. Vercel auto-deploys if CI passes (~90s).

PRs get a preview deployment automatically.

## When something breaks

- **Issue submissions silently failing**: check Vercel **Functions →
  Logs** — look for `[email] Resend rejected send` lines. Usually means a
  bad email address in the reporter's contact field, or the Resend
  account isn't verified.
- **Camera button doesn't work on phone**: confirm the URL is `https://`,
  not `http://`. Camera + geolocation need HTTPS.
- **Build fails**: GitHub Actions and Vercel both email you. Most often
  it's a typo in `src/data/`.

## Local development

```bash
cp .env.example .env.local         # fill in any keys you have
npm install
npm run dev                         # http://localhost:3000
npm test                            # run the unit tests
npm run typecheck                   # strict TypeScript
npm run build                       # production build
```
