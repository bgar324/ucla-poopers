# Party Poopers

Party Poopers is a UCLA restroom finder built with **Next.js, Prisma, PostgreSQL, and Supabase**. The application allows users to discover bathrooms on campus, leave reviews, explore a map view, and interact socially with other users.

Locally, the app supports:

- Email/password sign-up
- Optional Google OAuth
- Bathroom browsing on the dashboard and map
- Review creation and editing
- Social features on the `poopers` page
- Profile management and avatar uploads
- Gemini-generated bathroom review summaries when configured

---

# Architecture Overview

The application follows a typical full-stack web architecture.

### Frontend
- **Next.js (React)** for UI and routing
- Interactive dashboard and map interface
- Client-side authentication state management

### Backend
- **Next.js API routes** handle application logic
- **Prisma ORM** manages database interaction

### Database
- **PostgreSQL** stores bathrooms, reviews, and user data

### Authentication & Storage
- **Supabase Auth** manages user authentication and sessions
- **Supabase Storage** stores user avatars

### AI Integration (Optional)
- **Google Gemini API** generates summary descriptions of bathrooms based on reviews.

---

# Core Features (CS35L Requirements)

### Dynamic Data Display
Bathroom listings, reviews, ratings, and user profiles are dynamically loaded from the PostgreSQL database using Prisma.

### Client → Server Data Upload
Users can submit bathroom reviews and create new bathroom entries. Review and bathroom data are persisted to PostgreSQL via server-side API routes.

### Meaningful Search
Users can browse bathrooms by building and explore locations using the map view. The dashboard allows filtering and searching through available bathroom records stored on the server.

### Authentication / Security
The application requires authentication to perform actions such as writing reviews or managing profiles. Authentication is handled through Supabase sessions and protected routes.

### Additional Features

1. **Social User Discovery**
   - The `/poopers` page allows browsing users and viewing their reviews.
   - Users can follow and unfollow each other.

2. **User Profiles**
   - Profile customization including avatars and user metadata.
   - Optional multi-factor authentication (MFA).

3. **AI Bathroom Summaries**
   - Gemini AI generates review summaries for bathrooms with multiple reviews.

---

# Prerequisites

- Node.js `>=20.9.0`
- `npm`
- A working PostgreSQL connection
- A Supabase project with Auth and Storage configured

This repository **does not include Docker or a local database container**. The easiest way to run the project is to use pre-configured Supabase/Postgres credentials.

---

# Environment Setup

For the submission tarball, the required environment files are already included, so no manual environment setup is required for standard local startup.

If you run the project from a clean clone instead of the bundled tarball, `.env` is the important file in the current repo:

- **Next.js** can read runtime variables from `.env`
- **Prisma CLI** reads environment variables from `.env` through `dotenv/config` in `prisma.config.ts`
- `.env.local` is only useful if you want a local Next.js override file

If you need to recreate the files manually, copy `.env.example` to `.env`. You only need to duplicate it to `.env.local` if you want separate local overrides.

```bash
cp .env.example .env
cp .env .env.local
```

---

# Required Environment Variables

### Runtime Configuration

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=
DATABASE_URL=
```

Requirements:

- `NEXT_PUBLIC_SUPABASE_URL` must be set
- Provide at least one of:
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- `DATABASE_URL` must point to the Postgres database used by Prisma.

---

### Prisma CLI

```env
DATABASE_URL=
DIRECT_URL=
```

`DIRECT_URL` should point to a direct Postgres connection used for migrations.

If `DATABASE_URL` uses a connection pool, `DIRECT_URL` should reference the non-pooled connection.

---

### Only Required for Gemini Summaries

```env
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash-lite
```

These are only required for Gemini-generated bathroom summaries and the summary backfill script.

The app itself still runs without them. When Gemini is not configured, bathroom detail falls back to regular review text or a basic building/floor/type description.

---

# Required Backend Configuration

The following services must already exist:

### Supabase Auth
Required for login, signup, session management, and profile syncing.

### Google OAuth (Optional)
If enabled, configure both local and deployed app URLs in **Supabase Auth > URL Configuration**:

```
Site URL:
https://ucla-poopers.vercel.app

Redirect URLs:
http://localhost:3000/auth/callback
https://ucla-poopers.vercel.app/auth/callback
```

Use the production root domain for `Site URL`. Do not put `/auth/callback` in the `Site URL` field.

`Redirect URLs` are the per-environment allow-list. They must exactly match the browser origin you use during auth. If you develop on `127.0.0.1`, a different port, or a Vercel preview URL, add those callback URLs too or Supabase will fall back to the `Site URL`.

Examples:

```
http://127.0.0.1:3000/auth/callback
http://localhost:3001/auth/callback
https://your-preview-url.vercel.app/auth/callback
```

In **Google Cloud Console**, the OAuth client should keep using the Supabase callback URL:

```
https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback
```

### Supabase Storage
A **public bucket named `avatars`** must exist for profile photo uploads.

### Supabase MFA
Optional but required for `/auth/mfa` and profile two-factor authentication.

### PostgreSQL Schema
The database must contain the schema generated by the Prisma migrations located in:

```
prisma/migrations
```

---

# Running the App Locally

Install dependencies, generate the Prisma client, run migrations, and start the development server:

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Open the app in your browser:

```
http://localhost:3000
```

---

# What To Expect Locally

- The landing page shows login and sign-up UI.
- If a valid session exists, users are redirected to `/dashboard`.
- Email signup may require email confirmation depending on Supabase configuration.
- If Google OAuth is enabled, users can sign in through Google.
- Bathroom data will appear immediately if the database already contains records.
- If the database is empty, bathrooms can be created through the **Add Review** flow.
- Gemini-backed summaries appear only when Gemini is configured and a bathroom has at least two reviews; otherwise the app falls back to non-AI bathroom detail text.

---

# Application Pages

| Route | Description |
|------|-------------|
| `/` | Login and sign-up page |
| `/dashboard` | Main bathroom browsing dashboard |
| `/map` | Dedicated campus bathroom map |
| `/add-review` | Create or add a bathroom review |
| `/poopers` | Social browsing of users and reviews |
| `/profile` | Profile management and avatar uploads |

---

# Optional Commands

### Build production bundle

```bash
npm run build
```

### Start production server

```bash
npm start
```

### Generate AI bathroom summaries

```bash
node scripts/backfillBathroomSummaries.mjs
```

This script generates summaries for bathrooms that already have reviews.

---

# Notes

- Prisma connects to PostgreSQL through credentials supplied in environment variables.
- Authentication checks for protected operations use Supabase bearer tokens.
- Avatar uploads require the `avatars` storage bucket to exist and be publicly readable.

---

# Environment Files for Grading

The environment files are **not committed to the repository**.

They are included in the submission tarball so instructors can run the application locally without configuring credentials manually.

In the current repo, `.env` is the file that matters for both Prisma CLI and general app startup. `.env.local` is only a duplicate override file for Next.js and is redundant if it contains the same values as `.env`.
