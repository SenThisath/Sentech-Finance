# Sentech Finance

A Next.js 16 + React 19 application with a real-time Convex backend and a single owner password. The public frontend can be statically hosted; all live reads and financial mutations run in Convex.

## What is included

- The approved monochrome Sentech invoice, with the inverted supplied logo, client name only, ST261-style numbering, no due date/currency field/paid-balance fields on the invoice, and the supplied HNB bank details.
- Invoice drafts, editing drafts, issuing, duplication, voiding, discounts, pages/designs/projects/slides/hours/items, and print / Save as PDF.
- Atomic issue-and-record-payment operation, partial receipts, outstanding amounts, transaction history, and no duplicate writes on retries.
- Cash in and out: client receipts, other income, business expenses, owner deposits and owner withdrawals.
- Period summaries, cash balance, cash earnings, expense categories, top clients, invoice and ledger CSV exports, JSON backup, and audit history.
- Responsive dashboard, invoice preview, accessible dialogs, and disconnection handling.

## Current configuration

Without a Convex URL configured, the application opens a **sample workspace**. It uses fictional records held only for the current session. Refreshing resets the sample data. It never writes sample records to Convex. This mode is for trying the interface, not for storing financial records.

Real persistence is implemented but requires your own Convex setup below. No deployment credentials are included. Backend integration tests use `convex-test`; they do not connect to a real project.

## Run locally

Use Node.js 22.13 or newer.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

On Windows PowerShell, use `Copy-Item .env.example .env.local` instead of `cp` if needed. The development app runs on port 4173.

## Activate live saving — single owner

There is no external account provider, sign-up flow, or user management in this app.

1. Run `npm run convex:dev`. Sign in to **Convex** to create/deploy your database project. This is a developer setup step, not an app login. The CLI will generate its standard helper files and add the deployment URL to `.env.local`.
2. Generate a strong random owner password locally:

```bash
node -e "console.log(require('node:crypto').randomBytes(24).toString('base64url'))"
```

3. In the **Convex dashboard → Settings → Environment Variables**, set `SENTECH_OWNER_PASSWORD` to the generated value. Keep it in your password manager. The backend requires at least 24 characters. Do not put it in source control or a `NEXT_PUBLIC_` variable.
4. In `.env.local`, set:

```dotenv
NEXT_PUBLIC_CONVEX_URL=https://YOUR-DEPLOYMENT.convex.cloud
```

5. Keep `npm run convex:dev` running and restart `npm run dev`. Open the app and enter your owner password. Your live workspace starts empty. Use **Record money → Owner deposit** for opening funds, then begin issuing invoices and recording cash movements.

Every query and mutation checks this credential on the server. There are no user accounts. The owner password is kept in browser memory while the workspace is open, sent over HTTPS to your Convex backend for protected operations, and never stored in invoice/transaction records, exports, localStorage or sessionStorage. Refreshing or clicking the sidebar lock button locks the app. Use a generated high-entropy password, not a short PIN. If you forget it, replace `SENTECH_OWNER_PASSWORD` in the Convex dashboard; existing records remain intact. Password rotation takes effect on subsequent protected database operations; an already rendered page must be locked to clear its displayed records.

## Production deployment

Configure `SENTECH_OWNER_PASSWORD` in your **production Convex environment**, deploy the functions, set the production URL in `.env.local` or your build environment, and build:

```bash
npm run convex:deploy
npm run typecheck
npm test
npm run build
```

`NEXT_PUBLIC_CONVEX_URL` is compiled into the frontend and requires a rebuild if changed. The build produces `out/`, suitable for Sites or another static host. The app uses Next.js App Router directly. `next start` is not used with the static export; use a static server for `out/` or `npm run dev` locally.

The private Sites preview remains linked to its source repository. Rebuild with your production Convex URL and publish the new export to activate durable saving. Never include deployment keys or your owner password in public environment variables or source control.

## Financial rules

- Amounts are stored as integer cents. Each line is rounded once to the nearest cent, then discounts are subtracted. Pages, slides, items and designs require whole quantities; hours and projects allow up to two decimal places.
- An issued invoice creates a receivable. It does **not** add cash or count as income received until a payment is recorded.
- Invoice payments and other income count toward cash earnings. Owner deposits increase cash but are not income. Withdrawals reduce cash but are not business expenses.
- Cash earnings means income received minus business expenses. It is not an accrual profit-and-loss or tax calculation.
- Cash movements may be backdated but not future dated. A payment cannot predate its invoice or exceed the unpaid amount.
- Numbers are allocated atomically on issue, separately per invoice year: ST261, ST262, etc. Drafts do not consume numbers; voided numbers are never reused.
- An issued invoice cannot be edited. Duplicate it and void the incorrect invoice when appropriate. Reverse linked erroneous payments before voiding an invoice. Corrections preserve records and a reason in the audit log.
- Reversing an entry corrects the ledger; it does not refund money. The application does not initiate bank transfers or connect to HNB.
- Company and bank details are snapshotted on issue so later settings changes do not alter old invoices. The fixed supplied Sentech logo remains the app identity.
- Times are displayed in Asia/Colombo. Period views use transaction dates. The ledger has no accounting period locks; corrections can change historical reports.

## Printing

Open an invoice and choose **Print / Save PDF**. Use A4 portrait. For a clean PDF, disable the browser's built-in headers and footers. The app includes A4 print styles, repeating item headers and page-break controls for long invoices. Final pagination can depend on the print engine and printer settings; check the print preview before sending.

## Validation

`npm test` runs backend password protection and mutation tests with `convex-test`, including numbering, retry idempotency, draft issuing, partial payments, rejected overpayments, reversals, immutable issuer details, amount/date validation and separate treatment of owner funds. Shared money calculations and CSV formula escaping are tested too.

The production Next.js export and strict TypeScript checks are validated locally. Live password/Convex end-to-end verification and final browser/print visual QA require a connected deployment and browser environment; they were not claimed as completed by the preview build. The optional read-only WebMCP summary registers when supported; host-runtime validation remains pending.

## Operational limits

This first release is an owner-only cash management workspace, not a general ledger, bank reconciliation service, tax engine, payment gateway, inventory system or multi-company platform. Snapshot queries load all owner records; very large datasets should add server-side pagination and reporting aggregates before scaling. JSON export is a manual backup; a restore/import interface is not included. Only the newest 100 audit entries are included in the workspace snapshot/export; the backend retains the full audit table.
