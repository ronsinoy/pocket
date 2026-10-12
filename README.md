# Pocket

Mobile-first React budget tracker, based on DESIGN-meta.md. Light list layout, Meta blue accents, Poppins typography, and a gradient balance header, local emotes, mandatory Want/Need classification, editable expenses, monthly totals with Monday–Sunday weekly subgroups, search, filters, budget settings, and CSV export. Currency defaults to INR.

## Run

```sh
npm install
npm run dev
```

Open the local Vite URL. The opening screen is explicitly labeled sample data. Choose a username (3–24 letters, numbers, underscores) to start an empty personal pocket. Returning to the same username restores its expenses. No passwords or Supabase Auth.

## Supabase

1. Run `supabase/schema.sql` in your project's SQL editor.
2. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to your project URL and public anon/publishable key.
3. Restart Vite.

The `users` table stores usernames; `expenses` and `budgets` reference the user ID. The requested username-only model permits anonymous database access: usernames identify pockets but do not protect records. Never put a service-role key in the frontend.

Without Supabase configuration, the app persists each username's data in browser localStorage. Sample expenses are never inserted into the database. A budget is a reusable monthly spending limit. Weeks are clipped to month boundaries so monthly consolidated totals count every expense exactly once.

```sh
npm test
npm run build
```

Production output is in `dist/`. Serve it with `npm run preview` or a static host. Supabase credentials must be present at build time.

## Design

Compact mobile-first list layout with Poppins bundled through @fontsource, light surfaces, Meta blue accents, concise labels, and local emotes. The balance header retains a subtle blue gradient. The supplied Barbarian emote is used as the profile avatar. Summary sections and expense rows use dividers instead of card boxes.

DESIGN-meta.md remains the palette reference; typography and density follow the requested Poppins redesign.

## Wallet and payment sources

Expenses require Card, GPay, or Cash in addition to Want/Need. Existing records have an unspecified payment source until edited. CSV exports include the source.

The Wallet tab stores opening Cash and GPay balances and the opening outstanding Card bill, each with a starting date. Enter the balance before any recorded expenses on that date. Expenses on or after that date reduce Cash/GPay funds or increase the Card bill; editing and deleting an expense recomputes those amounts. Future-dated expenses do not change today's wallet balance. To reflect deposits, card repayments, or a balance correction, set a new opening balance and date. Card debt is displayed separately from total available funds.

Kite funds are the sum of its allocations. Add named divisions through Manage. The default Credit Card division has a current-month and previous-month reserve; older saved months are retained and shown when the month changes. The two recent reserves are compared against the outstanding Card bill. A shortfall is red. This is a reserve comparison, not an automatic card payment.

The graph shows cumulative spending from the beginning of the selected month through today (or the end of a past month). Hover, tap, or use the day slider to inspect spending.

For existing Supabase projects, re-run `supabase/schema.sql`: its final section adds `expenses.payment_source` and the `wallets` table. Account balances, Kite divisions, and monthly reserves are saved in `wallets.data` by user ID. Local mode saves them with expenses in the same browser record. No database migration has been executed remotely by this workspace.

Emotes gently float continuously. The animation is disabled when the device requests reduced motion.

## Home-screen installation

`npm run build` creates the web app manifest, app icons, and a versioned service worker. Deploy `dist/` over HTTPS, or use `npm run preview` on localhost for development. The Install control offers the browser install prompt when available; on iPhone it shows Safari's Share → Add to Home Screen instructions. Installed apps launch standalone.

The existing Pocket wallet logo is available on white and black backgrounds under `public/icons/`, with 180px Apple and 192/512px Android versions. The manifest and Apple touch icon use the white background. The SVG browser favicon adapts between white and black with the device theme. Icons keep the logo inside the maskable safe zone.

The service worker precaches only the built app shell and static assets, not Supabase responses or user data. Local-mode records remain available in browser storage offline; Supabase operations require connectivity. New app versions activate after the old app's tabs/windows close. Serve `/sw.js` with revalidation (`Cache-Control: no-cache`) on the production host.
