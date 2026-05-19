# Deploy Trash Scouts (resident app + admin dashboard)

Four services, ~30 min:

1. **Vercel** — hosts the app, gives you HTTPS
2. **Neon** — hosted Postgres database (free tier)
3. **Resend** — issue-report emails
4. **Vercel Blob** — photo storage (porter headshots, setup photos, issue photos)

---

## 1. Push to GitHub

```bash
git init && git add . && git commit -m "Initial Trash Scouts platform"
# Create a repo at https://github.com/new, then:
git remote add origin https://github.com/YOUR_USERNAME/trashscouts.git
git branch -M main && git push -u origin main
```

---

## 2. Create the Postgres database (Neon)

1. Sign up at [neon.tech](https://neon.tech) (free, GitHub login works).
2. **Create Project** → name `trashscouts` → region near your users.
3. Copy the **Connection string** (looks like
   `postgresql://USER:PWD@ep-xxx.aws.neon.tech/neondb?sslmode=require`).
4. Keep this tab open.

---

## 3. Set up Google OAuth (admin login)

The admin dashboard signs in via Google. Access is restricted to a hard-coded
allowlist in `src/lib/auth.ts`:

```
nayan@revisent.com
chris@revisent.com
pedrito@trashscouts.com
```

(Edit that file to add/remove emails — change goes live on the next deploy.)

To get the OAuth credentials:

1. Go to [Google Cloud Console](https://console.cloud.google.com/), create a
   new project (or use an existing one).
2. **APIs & Services → OAuth consent screen** → External → fill in app name
   ("Trash Scouts Admin"), support email, your contact email. Skip scopes
   (the defaults are fine).
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
   - Application type: **Web application**
   - Authorized redirect URIs (add both):
     - `http://localhost:3000/api/auth/callback/google` (for local dev)
     - `https://yourapp.vercel.app/api/auth/callback/google` (and your custom
       domain when you have one)
4. Copy the **Client ID** and **Client Secret**.

## 4. Local dev setup

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
DATABASE_URL="<paste the Neon string>"
NEXTAUTH_URL="http://localhost:3000"
AUTH_SECRET="<run: openssl rand -base64 48>"
GOOGLE_CLIENT_ID="<from Google Cloud>"
GOOGLE_CLIENT_SECRET="<from Google Cloud>"
```

Then once:

```bash
npm install
npm run db:push        # creates the schema in Neon
npm run db:seed        # seeds the 4 properties + Sergio
```

Verify locally:

```bash
npm run dev
```

- Resident app: [http://localhost:3000](http://localhost:3000)
- Admin: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
  → click **Sign in with Google** → must use one of the allowlisted emails

---

## 5. Deploy to Vercel

1. Vercel.com → **Add New → Project** → import the repo.
2. Leave Next.js defaults.
3. **Environment Variables** — paste these:

   ```
   DATABASE_URL              (Neon URL)
   AUTH_SECRET               (48-char secret)
   GOOGLE_CLIENT_ID          (from Google Cloud)
   GOOGLE_CLIENT_SECRET      (from Google Cloud)
   NEXTAUTH_URL              (leave blank for now)
   NEXT_PUBLIC_SITE_URL      (leave blank for now)
   RESEND_API_KEY            (from Resend, see next step)
   EMAIL_FROM                Trash Scouts <onboarding@resend.dev>
   NOTIFICATION_EMAIL        nayan@revisent.com
   NEXT_PUBLIC_BRAND_LOGO    /brand/logo.jpg
   ```

4. Click **Deploy** (~2 min). Vercel runs `prisma generate` automatically.
5. After the first deploy, set both `NEXTAUTH_URL` and `NEXT_PUBLIC_SITE_URL`
   to your `https://yourapp.vercel.app` URL and redeploy.
6. Back in Google Cloud Console → your OAuth client → add the production
   `https://yourapp.vercel.app/api/auth/callback/google` URL to the
   authorized redirect URIs.

---

## 6. Wire Resend

1. [resend.com](https://resend.com) → **API Keys** → create → copy.
2. Paste into Vercel env vars as `RESEND_API_KEY`. Redeploy.

---

## 7. Wire Vercel Blob (photo storage)

Photos uploaded through the admin (porter headshots, setup photos) and
issue submissions would otherwise disappear between requests on Vercel.

1. Vercel project → **Storage → Create → Blob** → name `trashscouts-photos`.
2. Vercel auto-adds `BLOB_READ_WRITE_TOKEN` to env vars.
3. Redeploy.

---

## 8. Subdomain integration with trashscouts.com

Vercel project → **Settings → Domains → Add** → enter your subdomain
(e.g. `app.trashscouts.com`). Vercel shows you a CNAME record like:

```
CNAME app  →  cname.vercel-dns.com
```

Add that record at whoever manages DNS for trashscouts.com. Once it
resolves (~5–30 min), Vercel auto-provisions HTTPS.

For the admin dashboard at `admin.trashscouts.com`, add a second CNAME
the same way (`CNAME admin → cname.vercel-dns.com`) and add it as a
second domain to the same Vercel project. Both routes serve from the
same deployment.

---

## 9. First-time admin checklist

Once everything is live:

1. Visit `https://yourdomain/admin/login` → **Sign in with Google** using
   one of the allowlisted emails.
2. **Properties** → review the seeded 4 buildings, edit the schedules to
   include real time windows when Trash Scouts shares them.
3. **Porters** → upload Sergio's real headshot if not already in place.
4. **Setup photos** → upload 2-3 photos per building.
5. **Print QR codes** → click any property → **View QR** → Download PNG.

To add or remove admins later, edit `ALLOWED_EMAILS` in
`src/lib/auth.ts` and push the change.

---

## Adding a new building (steady-state operation)

This is the whole point of the admin dashboard:

1. Log in to `admin.trashscouts.com`.
2. Click **+ Add Property**.
3. Fill in the form (address, porter, photos, schedule).
4. Click **Generate QR Code**.
5. Download the QR PNG and print + post in the trash room.

That's it. No code change, no developer involved.

---


## When you change the code

After every push to `main`:
1. GitHub Actions CI runs (lint + typecheck + tests + build).
2. Vercel auto-deploys if CI passes (~90 sec).
3. PRs get preview deployments at unique URLs.

## Where things live

- Resident app code: `src/app/p/*`, `src/app/page.tsx`
- Admin code: `src/app/admin/*`
- Resident-side data accessors: `src/lib/data.ts` (reads from DB)
- API routes: `src/app/api/*`
- Database schema: `prisma/schema.prisma`
- Brand strings: `src/lib/brand.ts`
- HHW dropoff facilities: `src/lib/hhwDropoffs.ts`
- Guide text: `src/data/guides.ts` (waste + HHW general — same for all)

## Local development

```bash
npm run dev              # http://localhost:3000
npm test                 # unit tests
npm run typecheck        # strict TS check
npm run ci               # full pipeline
npm run db:push          # push schema changes to your DB
npm run db:seed          # re-seed (idempotent for properties)
```
