# Fizz Theory

React and Vite storefront with a same-origin Node API and SQLite. Use Node 22.14 or newer. Run `npm ci` followed by `npm run dev`. Run `npm exec -- tsc --noEmit`, `npm run build`, and `npm run preview` to inspect the release build locally. Both Vite commands include the API. Serving only the contents of dist will omit it.

## Local data

The API creates a database at `.data/fizz.sqlite`, or the path supplied in `FIZZ_DB`. Use a private persistent directory and keep the database, WAL, and backups outside public assets. Inventory starts with 48 demo cans per flavor. The catalog supplies sample USD prices. The cart limit is 12 per flavor. Accounts, sessions, favorites, posts, votes, support submissions and orders persist in SQLite. Support submissions are stored in the contact table for review. Email delivery is not configured.

## Test payments

Set server process environment variables using the names in .env.example. Use the exact browser origin, including port, for PUBLIC_ORIGIN. Only Stripe test secret keys are accepted. For local webhook delivery, run `stripe listen --events checkout.session.completed,checkout.session.expired --forward-to localhost:5173/api/stripe/webhook` and set STRIPE_WEBHOOK_SECRET to its signing secret. Restart the server after configuration. Use HTTPS for a hosted installation.

Checkout validates stock and prices, reserves cans in a transaction and sends the customer to Stripe. Signed events settle paid orders or release expired reservations. Returning customers can also reconcile an order by opening its detail page. A network timeout leaves a pending reservation so the same checkout can safely retry. Enable webhook delivery for unattended reservations. This is a test storefront with USD prices, US shipping address collection and no fulfillment service.

After building, run `npm start` to serve the compiled assets and API together without Vite. It binds to 127.0.0.1:4173 by default. Set HOST and PORT for your host, configure HTTPS at the proxy, and supply the server environment separately. Run `npm test` for API regression checks.
