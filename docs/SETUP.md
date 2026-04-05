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

These are not required for the current milestone.

### `NEXT_PUBLIC_APP_URL`

Useful later for:

- links
- deployment config
- email callbacks

### `REDIS_URL`

Useful later if we add:

- fast leaderboard caching
- websocket/pubsub features

### `RESEND_API_KEY`

Useful later for:

- email verification
- password reset
- invitations

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

Those are only needed if we later add AI features, payments, or social login.

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
