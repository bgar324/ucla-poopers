# the party poopers

## how to run this
`clone`
`npm install`
get env keys from google doc -> `.env` is enough for local dev; `.env.local` is optional and only needed if you want local-only overrides
`npx prisma generate`

## auth config
Supabase should stay pointed at production by default:

- `Site URL`: `https://ucla-poopers.vercel.app`
- `Redirect URLs`: add the exact callback URLs used by the app
- `http://localhost:3000/auth/callback`
- `https://ucla-poopers.vercel.app/auth/callback`

The app now sends OAuth and email-confirmation flows back to the current origin's `/auth/callback`, so local auth works without changing the global `Site URL`.
