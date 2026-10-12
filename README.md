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

The Wallet tab stores opening Cash and GPay balances and the opening outstanding Card bill, each with a starting date. Enter the balance before any recorded expenses on that date. Expenses on or after that date reduce Cash/GPay funds or increase the Card bill; editing and deleting an expense recomputes those amounts. Future-dated expenses do not change today's wallet balance. Record deposits as incoming and card repayments as internal transfers. Use opening-balance settings only for initial setup or balance corrections. Total funds includes Cash and GPay only. Kite allocations and Card debt are displayed separately.

Kite funds include its Unallocated balance and all division balances. Add named divisions through Manage. The default Credit Card division has a current-month and previous-month reserve; older saved months are retained and shown when the month changes. The two recent reserves are compared against the outstanding Card bill. A shortfall is red. This is a reserve comparison, not an automatic card payment.

The graph shows cumulative spending from the beginning of the selected month through today (or the end of a past month). Hover, tap, or use the day slider to inspect spending.

For existing Supabase projects, re-run `supabase/schema.sql` to add ledger endpoint fields, transfer constraints, and wallet normalization. Account balances, Kite divisions, and monthly reserves are saved in `wallets.data` by user ID. Local mode saves them with expenses in the same browser record. No database migration has been executed remotely by this workspace.

Emotes gently float continuously. The animation is disabled when the device requests reduced motion.

## Home-screen installation

`npm run build` creates the web app manifest, app icons, and a versioned service worker. Deploy `dist/` over HTTPS, or use `npm run preview` on localhost for development. The Install control offers the browser install prompt when available; on iPhone it shows Safari's Share → Add to Home Screen instructions. Installed apps launch standalone.

The existing Pocket wallet logo is available on white and black backgrounds under `public/icons/`, with 180px Apple and 192/512px Android versions. The manifest and Apple touch icon use the white background. The SVG browser favicon adapts between white and black with the device theme. Icons keep the logo inside the maskable safe zone.

The service worker precaches only the built app shell and static assets, not Supabase responses or user data. Local-mode records remain available in browser storage offline; Supabase operations require connectivity. New app versions activate after the old app's tabs/windows close. Serve `/sw.js` with revalidation (`Cache-Control: no-cache`) on the production host.

Install troubleshooting: restart `npm run dev` after changing the Vite configuration. Secure development previews now serve a non-caching worker at `/sw.js`; production builds still use the generated offline worker. The install event is captured before React mounts. Open the app directly in a normal browser tab. HTTP LAN addresses such as `http://192.168.x.x:5173` are not secure origins for a phone; use an HTTPS deployment. Browser installation behavior and secure-origin requirements: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable.

## Incoming and tools

Incoming is available only in Records. It can target Cash, GPay, Kite, their divisions, or Card for a refund. No incoming totals are displayed, even in Records. Incoming records are excluded from the dashboard recent list and reports, but still update balances. Want/Need remains mandatory only for expenses. Exports from Records include all transaction types; exports from other pages contain expenses only.

Cash and GPay support optional named divisions. Existing funds start in Unallocated. New divisions start at zero; fund them with Transfer. Kite retains its default Credit Card division with current- and previous-month reserves. Referenced divisions cannot be deleted; empty ones can be archived and restored. Archived names remain available on historical records.

Internal transfers move funds between Cash, GPay, and Kite accounts/divisions, or pay Card. Card cannot be a transfer source. Transfers are a single ledger record and affect both balances together; they never count as expenses or incoming. Sources must have enough funds on the transfer date, the date must be on or after both opening dates, and Card payments cannot exceed outstanding debt. Editing/deleting a record is rejected if it would invalidate a later transfer. Total funds remains Cash + GPay: moving money to Kite reduces the displayed liquid total without changing combined money-account funds.

Supabase wallet data is normalized once while retaining opening amounts and historical records. Kite gets a persistent opening date at migration; transfer and Kite movements use that cutoff. Apply the updated schema before using the new fields online. The schema has been checked against an in-memory PostgreSQL instance, including reruns with transfers already present; no remote migration has been executed.

The Tools tab has a calculator (arithmetic, brackets, percentages) and a notepad. Notes save per username using Save note, to Supabase when configured or browser storage otherwise. Run the latest `supabase/schema.sql` to add `transaction_type`, update the expense classification constraint, and create `notepads`.
