# Qez Setup Guide

## 1. Required Environment Variables

Create a local `.env` file based on `.env.example`.

Minimum required values:

```env
DATABASE_URL="postgresql://USERNAME:PASSWORD@HOST/DB_NAME?sslmode=require"
JWT_SECRET="replace-with-a-long-random-secret-at-least-32-characters"
```

## 2. What Each Variable Does

### `DATABASE_URL`

This is the PostgreSQL connection string from Neon.

Use it for:

- Prisma migrations
- Prisma client runtime queries
- API route database access

### `JWT_SECRET`

This signs and verifies login tokens.

Use a long random string. Good options:

- a password manager generated secret
- `openssl rand -base64 32`
- any secure 32+ character random value

Do not commit the real value to git.

## 3. Neon Database Setup

In Neon:

1. create a new project
2. create or note your database name
3. open the connection details
4. copy the connection string
5. paste it into `DATABASE_URL`

Typical Neon connection strings already include SSL parameters. If Neon gives you a full URI, use that exact value.

## 4. Local Development Steps

After adding your `.env`, run:

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

## 5. Optional Variables

These are optional, but some new features use them.

### `APP_URL`

Useful later for:

- links
- Google OAuth callback
- password reset links

### `GOOGLE_CLIENT_ID`

Required if you want:

- Google sign-in

### `GOOGLE_CLIENT_SECRET`

Required if you want:

- Google sign-in

### `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED`

Set to `true` to show the Google sign-in button in the UI after you configure Google OAuth.

### `RESEND_API_KEY`

Useful for:

- sending password reset emails automatically

### `RESEND_FROM_EMAIL`

Useful for:

- sending password reset emails automatically

### `ADMIN_EMAIL`

Optional. If set together with `ADMIN_PASSWORD`, the first successful login at `/admin/login`
with those exact credentials will create an `ADMIN` account automatically.

### `ADMIN_PASSWORD`

Optional. Used only for the first admin bootstrap flow at `/admin/login`.

### `ADMIN_NAME`

Optional display name for the bootstrapped admin account.

### `REDIS_URL`

Useful later if we add:

- fast leaderboard caching
- websocket/pubsub features

### `SENTRY_DSN`

Useful later for:

- error monitoring
- production debugging

## 6. Keys You Do Not Need Right Now

You do not currently need:

- OpenAI API key
- Stripe key
- Firebase key
- OAuth client keys

Those are only needed if we later add AI features, payments, or more social login providers.

## 7. Recommended Minimum For This Project Phase

Only these two are truly needed right now:

- `DATABASE_URL`
- `JWT_SECRET`

That is enough to build and test:

- register
- login
- current-user lookup
- quiz creation
- quiz listing
- quiz update

## 8. New Auth Feature Notes

### Google sign-in

To enable Google sign-in, add:

```env
APP_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
NEXT_PUBLIC_GOOGLE_AUTH_ENABLED="true"
```

### Forgot password

The forgot-password flow now works in two modes:

- If `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are set, it sends email automatically
- If they are not set, the API returns the reset link directly for local/demo use

## 9. Vercel Deployment Checklist

Before deploying to Vercel, make sure these environment variables are added in the Vercel project settings:

```env
DATABASE_URL="your-neon-postgres-url"
JWT_SECRET="your-long-random-secret"
APP_URL="https://your-vercel-domain.vercel.app"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
NEXT_PUBLIC_GOOGLE_AUTH_ENABLED="true"
RESEND_API_KEY="your-resend-api-key"
RESEND_FROM_EMAIL="your-from-email"
```

Notes:

- `APP_URL` must match your deployed Vercel URL in production.
- In Google Cloud Console, add this production redirect URI:
  - `https://your-vercel-domain.vercel.app/api/auth/google/callback`
- If Google sign-in works locally but not on Vercel, the redirect URI mismatch is usually the cause.
- The build uses `prisma generate && next build`, so `DATABASE_URL` must be present in Vercel during build time.
