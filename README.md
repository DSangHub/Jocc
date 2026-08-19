# JOCC — Join Online Country Clubs

A directory of small local clubs — mending nights, fly-tying benches, seed swaps,
garage sessions — with a members-only room attached to each one.

Vite + React (SPA) on Vercel, Supabase for auth, data, and realtime chat.

## Why the old deploy 404'd

The previous contents of this repo were planning notes: SQL snippets, two draft
`vercel.json` files saved without extensions, and a text diagram. There was no
`index.html` and no build, so Vercel produced an empty output directory. The
`vercel.json` rewrite then sent every path to `/index.html`, which didn't exist —
turning the missing build into a 404 on every URL rather than a visible error.

## Run it

```bash
npm install
npm run dev
```

The Supabase URL and publishable key are committed in `src/lib/supabase.js`.
That's intentional: publishable keys are meant to ship in the browser, and every
table is behind row level security. To point at a different project, set
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` — the env vars take precedence.

## Deploy

Vercel auto-detects Vite. No build settings needed.

- Build command: `vite build` (detected)
- Output directory: `dist` (detected)
- `vercel.json` rewrites everything except `/assets/*` to `/index.html`, which is
  what a client-routed SPA needs. The exclusion matters — the earlier config
  rewrote asset requests too.

One manual step: in Supabase → Authentication → URL Configuration, add your
Vercel domain to **Redirect URLs**, or the magic-link sign-in will bounce users
back to localhost.

## Database

`supabase/migrations/0001_jocc_schema.sql` is the whole schema and is already
applied to the live project. Tables are prefixed `jocc_` because that Supabase
project is shared with several other apps.

| Table | Holds |
| --- | --- |
| `jocc_clubs` | The directory. Slug, category, town/county, lat/lng, verified flag |
| `jocc_club_members` | Who belongs to what. Roster is public, you control only your own row |
| `jocc_messages` | Club room chat. Readable only by members, streamed over Realtime |
| `jocc_profiles` | Display names |
| `jocc_badges` | Awarded server-side through `jocc_award_badge()` |

Two functions worth knowing:

- `jocc_clubs_near(lat, lng, radius_km)` — haversine search behind the
  "Find clubs near me" button.
- `jocc_is_member(club_id, user_id)` — `SECURITY DEFINER`, so the policy on
  `jocc_messages` can check membership without recursing into
  `jocc_club_members`. Execute is granted to `authenticated` only.

`jocc_club_directory` is a `security_invoker` view that adds member counts, so
the grid can render counts in one request without leaking anything RLS wouldn't.

## The quilt blocks

Every club's patch is generated in `src/lib/quilt.jsx` from a hash of its slug.
A quarter of an 8×8 block is generated with a seeded PRNG, then mirrored on both
axes — the symmetry is what makes it read as pieced fabric rather than noise.
Colours come from the category's three-colour palette in `src/lib/categories.js`.
Same slug always produces the same block, so a club is recognisable by its patch
before you read the name.

## Structure

```
src/
  lib/
    supabase.js     client
    auth.jsx        session context
    quilt.jsx       block generator
    categories.js   categories + colourways
  components/
    ClubCard.jsx
  pages/
    Home.jsx        hero quilt wall, search, filters, grid
    ClubPage.jsx    club detail, join/leave, realtime room
    NewClub.jsx     create a club, live patch preview
    SignIn.jsx      magic link
    NotFound.jsx
```
