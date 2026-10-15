# Deployment

## Recommended: one Node service, one origin

1. Provision a Node.js-compatible host, MongoDB database, Cloudinary account and SMTP provider. The Sites/Cloudflare Workers runtime does not directly host this Express/MongoDB application.
2. Set environment variables securely on the host. Use `.env.example` as the list of keys, never as production values. Set `NODE_ENV=production`, `APP_URL=https://your-domain.example`, `PORT` as required by the host, `MONGODB_URI`, and independent random `JWT_SECRET`/`ANALYTICS_SECRET` values (48 random bytes each recommended).
3. Set `MEDIA_DRIVER=cloudinary` and the three Cloudinary credentials. Set `MAIL_DRIVER=smtp`, SMTP host/port/user/password and a verified sender in `MAIL_FROM`.
4. Run `npm ci`, `npm run build`, then `npm start`. Express serves `client/dist`, including direct route refreshes and dynamic public-profile metadata.
5. Configure your reverse proxy for HTTPS, preserve the request Origin, and set `TRUST_PROXY` to exactly the number of trusted proxy hops. Do not blindly enable arbitrary forwarded addresses. Limit request bodies at the edge, allowing 5 MB image uploads plus multipart overhead.
6. Confirm `/api/v1/health` returns 200. Verify the full registration/email/image/publication flow using your actual providers. Test a mobile device and QR download against the production hostname.
7. Configure database backups, error monitoring without sensitive request bodies, provider quotas and a retention/deletion procedure. Replace draft legal/support pages before commercial launch.

The first launch initializes schema indexes. For a large existing database, plan index migrations before rollout. This MVP expects one Node application process: quotas and rate limits use process-local coordination. See `security.md` before scaling to multiple instances.

## Static frontend on Vercel or similar

Build command from repository root: `npm run build`. Publish directory: `client/dist`.

Keep browser requests on the frontend's origin by reverse-proxying `/api/:path*` to the Node backend, before the SPA fallback. Set the backend `APP_URL` to the frontend's canonical HTTPS origin. The supplied `client/vercel.json.example` is a template; substitute your backend host. Never put server credentials in VITE-prefixed variables.

For best search/social sharing metadata, use the Node service for public-profile requests; a purely static fallback cannot inject dynamic Open Graph content. The single Node origin is the supported default.

## Administrator provisioning

Create and verify a regular account, then run the controlled operator command with the production environment:

```sh
node server/scripts/admin.js existing-verified-user@example.com
```

There are no default admin credentials, seeded admin accounts or client-editable admin roles. The command requires access to the deployment/database environment and an existing verified account.

## Upgrade roadmap

Before offering paid plans, add server-owned subscription/payment state, configurable entitlements, Razorpay subscription creation, server-side checkout verification, raw-body webhook signature verification, unique webhook IDs with atomic idempotency, reconciliation, cancellation/failure handling, downgrade rules and verified acceptance tests. One-time payments must not be labeled recurring subscriptions.

Before offering appointment requests, add Service and Appointment models, ownership enforcement, validation, rate limiting, spam controls, request-status transitions and tests. Label requests accurately; availability checking is a separate feature.
