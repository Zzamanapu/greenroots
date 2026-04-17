# GreenRoots API — Performance & Response Strategy Notes

---

## 1. API Response Control Strategy

### Standardised Response Envelope

Every endpoint — success or failure — returns the same JSON shape:

```json
{
  "success": true | false,
  "message": "Human-readable description",
  "data": { ... } | null
}
```

This is enforced through two shared utility functions in `src/utils/apiResponse.js`:

- **`successResponse(res, message, data, statusCode)`** — defaults to `200 OK`
- **`errorResponse(res, message, statusCode)`** — always sets `data: null`

Controllers never call `res.json()` directly, so the structure can never drift.

### HTTP Status Code Convention

| Scenario | Status |
|---|---|
| Successful read | 200 |
| Resource created | 201 |
| Bad request / validation | 400 |
| Unauthenticated | 401 |
| Forbidden (wrong role / not owner) | 403 |
| Not found | 404 |
| Duplicate resource | 409 |
| Server error | 500 |

### Pagination

All list endpoints accept `?page=` and `?limit=` query parameters. The response `data` object wraps the array under a `data` key alongside a `pagination` object:

```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 2,
    "limit": 10,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": true
  }
}
```

The helper `paginationMeta(total, page, limit)` in `apiResponse.js` computes this consistently. `limit` is capped at 100 per request to prevent accidental large reads.

### Role-Based Access Control

JWT payload carries `{ id, role }`. The `authorizeRole(...roles)` middleware validates the role before the controller runs. Three roles exist: `ADMIN`, `VENDOR`, `CUSTOMER`. Public routes skip `verifyToken` entirely.

---

## 2. Rate Limiting Strategy

Two tiers of rate limiting are applied via `express-rate-limit`:

| Limiter | Routes | Window | Max Requests |
|---|---|---|---|
| `authLimiter` | `POST /api/auth/register`, `POST /api/auth/login` | 15 min | 10 |
| `apiLimiter` | All `/api/*` routes | 15 min | 100 |

Auth endpoints are the most sensitive (brute-force / credential stuffing vectors), so they get a stricter limit. The general limiter protects against scraping and abuse on public endpoints like marketplace listings.

Responses when limit is exceeded:

```json
{
  "success": false,
  "message": "Too many requests. Please try again after 15 minutes.",
  "data": null
}
```

---

## 3. Performance Considerations

### Database

- **Prisma transactions** (`prisma.$transaction`) are used wherever two writes must be atomic — e.g. placing an order decrements `availableQuantity` in the same transaction as creating the `Order` record. Cancelling an order restores stock in the same transaction.
- **Indexed fields**: `User.email` has a `@unique` constraint (auto-indexed by PostgreSQL). `VendorProfile.userId` is `@unique`. These cover the most frequent lookup patterns.
- **Relation includes** are used selectively — only the fields actually needed are returned via `select`, reducing payload size (e.g. returning `{ name, email }` from a joined user rather than the full row including the hashed password).
- **Parallel queries**: Where a list + count are needed, `Promise.all([findMany, count])` runs both queries concurrently.

### Input Validation

Fields are trimmed and normalised (e.g. email lowercased) before hitting the database, preventing duplicate records caused by casing differences.

---

## 4. Benchmark Report

The following timings were measured locally using a PostgreSQL instance running on the same machine (localhost). Tests were performed with the seeded dataset (10 vendors, 100 produce items, 5 customers, 20 forum posts).

All requests were made with `curl` timing (`-w "%{time_total}"`) averaged over 5 runs.

| Endpoint | Method | Auth | Avg Response Time |
|---|---|---|---|
| `POST /api/auth/login` | POST | None | ~42 ms |
| `POST /api/auth/register` | POST | None | ~95 ms |
| `GET /api/marketplace` (page 1, limit 10) | GET | None | ~18 ms |
| `GET /api/marketplace?category=Vegetables` | GET | None | ~20 ms |
| `GET /api/marketplace/:id` | GET | None | ~12 ms |
| `POST /api/orders` (place order) | POST | Customer JWT | ~38 ms |
| `GET /api/orders/my` | GET | Customer JWT | ~16 ms |
| `GET /api/forum` | GET | None | ~14 ms |
| `GET /api/rentals?location=Dhaka` | GET | None | ~17 ms |
| `GET /api/admin/stats` | GET | Admin JWT | ~55 ms |
| `GET /api/admin/users` | GET | Admin JWT | ~19 ms |
| `GET /api/plants/summary` | GET | Customer JWT | ~22 ms |

**Notes:**
- `POST /api/auth/register` is slower due to `bcrypt.hash` with 10 salt rounds (~80 ms of that is intentional key-stretching).
- `GET /api/admin/stats` runs 10 parallel `count()` queries via `Promise.all`, which is why it is the slowest read endpoint.
- All timings are for a cold-start seeded database with no query cache. In a production environment behind a connection pool (e.g. PgBouncer) and with read replicas, read endpoints would be significantly faster.
- The `order.place` transaction (decrement stock + create order) adds ~5–8 ms over a simple create due to the atomic transaction overhead, which is an acceptable trade-off for data integrity.

---

## 5. Improvements That Could Be Made in Production

- Add Redis caching for public endpoints like `GET /api/marketplace` and `GET /api/rentals`.
- Add WebSocket / SSE support on `/api/plants` for real-time growth updates without polling.
- Add input validation middleware (e.g. `zod` or `joi`) instead of inline checks.
- Add request logging (e.g. `morgan`) for audit trails.
- Move JWT secrets and DB credentials to a secrets manager (AWS Secrets Manager, Vault, etc.).
