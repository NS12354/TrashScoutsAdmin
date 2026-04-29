# Brand assets

Drop the Trash Scouts logo here as `logo.svg` and the brand header will use
it automatically (instead of the placeholder green-truck icon + wordmark).

Files this folder uses:

- `logo.svg` — primary logo. Used in the resident page header. Pick a width
  that looks good at ~28 px tall on a phone. SVG keeps it crisp at any size.

After dropping the file, set the env var so the header uses it:

```
NEXT_PUBLIC_BRAND_LOGO="/brand/logo.svg"
```

(Add it to `.env.local` for dev and to your Vercel project's env vars for
production. Then redeploy.)

If `NEXT_PUBLIC_BRAND_LOGO` is unset, the app falls back to a generic
green-truck SVG plus the `NEXT_PUBLIC_BRAND_NAME` text wordmark (defaulting
to "Trash Scouts").
