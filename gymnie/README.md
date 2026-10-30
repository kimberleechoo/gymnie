# Gymnie ✨

A mobile-first workout planner and tracker (React + htm, plain ES modules).
The folder is the website, so you can run it locally and deploy it as-is.

## Run it locally

```bash
npm install
npm start          # http://localhost:5173
npm test           # unit tests for the training logic (Node 18+)
```

No Node? Any static server works, for example `python3 -m http.server 5173`.
Open the folder through a server, not by double-clicking `index.html` (ES modules need http).

## Deploy to Netlify

**Drag and drop (fastest):** go to <https://app.netlify.com/drop> and drop this whole folder.

**From Git (updates on every push):** push the folder to GitHub, then in Netlify choose
*Add new site → Import an existing project*. Build command: *(leave empty)*. Publish directory: `.`
(`netlify.toml` already says this).

After each deploy, bump `CACHE_VERSION` in `sw.js` (for example `gymnie-v2`) so phones pick up the new files.

**On your iPhone:** open the site in Safari → Share → *Add to Home Screen*. The icon and name come from
`assets/apple-touch-icon.png` and `manifest.webmanifest`.

## Project structure

```
index.html              Page shell, loads fonts, CSS, vendor scripts, then src/main.js
manifest.webmanifest    Home-screen name, colours, icons
sw.js                   Offline cache (network first)
netlify.toml            Netlify settings
css/
  base.css              Tiny reset and iPhone safe areas
  theme.css             Design tokens: light, dark, and manual theme overrides
  styles.css            All component styles (use tokens only, no hard-coded colours)
vendor/                 React 18.3.1, ReactDOM, htm 3.1.1, and Supabase JS (self-hosted)
assets/                 App icons
src/
  main.js               Mounts <App/>, registers the service worker
  react.js              Re-exports React hooks and the `html` template tag
  App.js                App shell: auth, state, storage, navigation, workout flow
  data/exercises.js     Exercise library, equipment, cardio types, stick-figure drawings
  lib/
    helpers.js          Dates, number formatting, small utilities, file download
    supabase.js         Supabase client configuration
    state.js            Default state, validation, localStorage read/write
    training.js         Workout generator, progression suggestions, personal bests
    milestones.js       Milestone catalogue and "newly unlocked" logic
    exportData.js       JSON backup and CSV export
    sampleData.js       Optional example sessions
  ui/
    common.js           Shared context, Seg control, headers, empty states
    icons.js            Inline SVG icons and exercise illustrations
  components/
    ExerciseCards.js    Library card and the "add your own exercise" form
    SessionCard.js      History card, saved-workout editor, exercise picker
  screens/
    Auth.js  Home.js  Build.js  ActiveWorkout.js  Saved.js  History.js  Profile.js
tests/logic.test.js     Unit tests (generator, progression, milestones, custom exercises)
```

Keep logic (no React) in `lib/` so it stays testable. UI files import from `lib/` and `data/`, never the
other way round.

## How data is stored

- Gymnie uses Supabase email/password authentication and stores each account's complete app state in
  `public.gymnie_data`. Row-level security restricts every row to its owner.
- The browser keeps a local copy under `gym-buddy-v1` for faster loading and offline use. The first
  account used in a browser imports its existing Gymnie data. Data already linked to a different
  account is never imported into the new account.
- **Back up regularly:** Profile → *Download backup (JSON)*. Restore from the same screen.
- Account data syncs across devices when online. Changes made offline are kept on that device and sync
  when the app can reach Supabase again.
- Supabase's publishable key is used by the browser and is not a secret. Never put a Supabase service-role
  key in this app. The SQL below and Supabase row-level security protect user data.

## Common changes

| I want to… | Edit |
|---|---|
| Change colours | `css/theme.css` (light values on `:root`, dark in the two dark blocks) |
| Change fonts | `--display`, `--serif`, `--body` in `theme.css` and the Google Fonts link in `index.html` |
| Add or edit built-in exercises or muscle groups | `src/data/exercises.js` (`EX`, `GROUPS`, `GROUP_ORDER`; drawings in `POSES`) |
| Add cardio machines | `CARDIO_TYPES` in `src/data/exercises.js` |
| Change how workouts are generated | `generatePlan` in `src/lib/training.js` |
| Change progression rules | `suggestion` in `src/lib/training.js`; the +2.5 kg step is `STEP_KG` in `src/data/exercises.js` |
| Add or edit milestones | `CATALOG` in `src/lib/milestones.js` |
| Change defaults (goal weight, rest time) | `defaultState` in `src/lib/state.js` |

**Fat Frank font:** it is not on Google Fonts, so the app falls back to Bagel Fat One. To use Fat Frank,
add the licensed font file to `assets/fonts/` and put this at the top of `css/theme.css`:

```css
@font-face { font-family: 'Fat Frank'; src: url('../assets/fonts/FatFrank.woff2') format('woff2'); font-display: swap; }
```

## Supabase setup (Netlify hosting)

1. Create a Supabase project and open **SQL Editor**. Run:

   ```sql
   create table public.gymnie_data (
     user_id uuid primary key references auth.users (id) on delete cascade,
     state jsonb not null,
     updated_at timestamptz not null default now()
   );

   alter table public.gymnie_data enable row level security;

   grant select, insert, update on public.gymnie_data to authenticated;

   create policy "Users manage their own Gymnie data"
     on public.gymnie_data
     for all
     to authenticated
     using ((select auth.uid()) = user_id)
     with check ((select auth.uid()) = user_id);
   ```

2. In Supabase, open **Project Settings → API Keys** and copy the **Project URL** and
   **Publishable key**. Put them in `src/lib/supabase.js`, replacing the two `YOUR_...` values.
   The publishable key is intended for client-side use; do not use a secret or service-role key.
3. In **Authentication → URL Configuration**, set the Site URL to your local or deployed Gymnie URL.
   Add both `http://localhost:5173/**` and your Netlify site URL (for example
   `https://your-site.netlify.app/**`) to the redirect URL allow list. If email confirmation is on,
   confirm the signup email before signing in.
4. Deploy the site to Netlify as usual: no build command, publish directory `.`. The Supabase project
   holds accounts and data; Netlify continues to serve the static app.

The app also supports password reset from the login page. For production, configure Supabase's email
templates and sender settings to suit your needs.
