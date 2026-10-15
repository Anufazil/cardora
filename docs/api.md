# API reference

Responses use `{ "data": ... }`; errors use `{ "error": { "message": "...", "fields": [...] } }`. Field errors are present only for validation failures. Protected routes authenticate an active account and enforce resource ownership server-side.

Obtain a CSRF cookie/token with GET `/api/v1/auth/csrf`. Send the token in `X-CSRF-Token` and the configured `Origin` on every POST/PATCH/DELETE, including anonymous registration and analytics. Browser requests include credentials. Session JWTs are never exposed to application JavaScript.

| Method | `/api/v1` path | Behavior |
|---|---|---|
| GET | `/health` | 200 when MongoDB is connected, otherwise 503 |
| GET | `/auth/csrf` | Establish CSRF cookie and return matching token |
| POST | `/auth/register` | `{name,email,password}`, creates a session and verification email |
| POST | `/auth/login` | `{email,password}`, creates a revocable session |
| GET | `/auth/me` | Safe account details |
| POST | `/auth/logout` | Revoke the current session |
| POST | `/auth/forgot-password` | `{email}`, generic enumeration-resistant response |
| POST | `/auth/reset-password` | `{token,password}`, single-use token; invalidates all sessions |
| POST | `/auth/verify-email` | `{token}`, consumes verification token |
| POST | `/auth/resend-verification` | Authenticated verification resend |
| PATCH | `/auth/account` | `{name}` only; no user-editable role/plan/status |
| GET / POST | `/cards` | List up to ten owned cards / create `{slug,draft}` subject to free quota |
| GET / PATCH / DELETE | `/cards/:id` | Owned card; updates accept `{draft}` only |
| POST | `/cards/:id/publish` | Copy validated draft into snapshot; verified email required |
| POST | `/cards/:id/unpublish` | Remove public access |
| GET / POST | `/cards/:id/portfolio` | Owned projects / create project |
| PATCH / DELETE | `/portfolio/:id` | Update/remove owned project |
| POST | `/media` | Authenticated multipart `image`; JPEG/PNG/WebP, 5 MB maximum |
| GET | `/public/:slug` | Published safe snapshot, visible portfolio, signed event token |
| POST | `/public/:slug/events` | `{type,source,token}`; rate-limited and deduplicated |
| GET | `/analytics/overview?days=30` | Authenticated metrics, series, top cards and recent activity |
| GET | `/analytics/cards/:id?days=30` | Same reporting for an owned card |
| GET | `/billing/subscription` | Current free entitlement, limits, checkoutAvailable=false |
| GET | `/admin/overview` | Administrator-only user/published-card counts |
| GET | `/admin/users?page=1&email=...` | Administrator-only paginated list; optional exact email lookup |
| PATCH | `/admin/users/:id/status` | Admin changes user status; cannot target self or another admin |

Card and project input structures are defined by the exported strict Zod schemas in `server/src/validators/index.js`. Unknown fields are rejected. URLs allow only HTTP/HTTPS; image URLs must belong to media uploaded by the current account. Mongo identifiers are validated before queries. Errors use 400, 401, 403, 404, 409, 413 and 429 as applicable.

There are intentionally no payment, webhook, services or appointment endpoints in this release.
