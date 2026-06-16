# PERFORMANCE INVESTIGATION REPORT - PHASE 1

## 1. Work Completed

### Task 1: API Logging
Added detailed timing logs in `src/app/api/groups/[id]/route.ts`:
- Overall request time (`[GROUP API] Total`)
- Authentication time (`[GROUP API] auth`)
- Group retrieval time (`[GROUP API] group`)
- Bills & Settlements retrieval time (`[GROUP API] bills_and_settlements`)
- Metadata logging: `userId`, `billsCount`, `settlementsCount`.

### Task 2: Database Connection Logging
Modified `src/lib/db.ts` to log:
- When a cached connection is used.
- When a new connection is created.
- The time taken to establish a new connection.

### Task 3: Query Logging
Wrapped key queries in `src/lib/queries.ts` with timing logs:
- `getGroupByIdForUser`
- `getBillsByGroupId`
- `getSettlementsByGroupId`

### Task 4: Dashboard Preload Logging
Modified `src/app/dashboard/DashboardClient.tsx` to log:
- Preload start/end times.
- Number of groups being preloaded.
- Individual loading time for each preloaded group.
- Manual prefetch timing.

---

## 2. Database Index Status

| Collection | Field | Status | Index Definition |
| :--- | :--- | :--- | :--- |
| **Group** | members | ✅ OK | `index({ members: 1, createdAt: -1 })` |
| | inviteCode | ✅ OK | `unique: true` |
| **Bill** | groupId | ✅ OK | `index({ groupId: 1, createdAt: -1 })` |
| | paidBy | ✅ OK | `index({ paidBy: 1 })` |
| | createdAt | ✅ OK | `index({ groupId: 1, createdAt: -1 })` |
| **Settlement** | groupId | ✅ OK | `index({ groupId: 1, status: 1 })` |
| | status | ✅ OK | `index({ groupId: 1, status: 1 })` |

**Conclusion on Indexes:** All requested fields are properly indexed, mostly via compound indexes that align with the current query patterns (filtering by `groupId` and sorting by `createdAt` or filtering by `status`).

---

## 3. Preliminary Observations (Based on Code Review)

1.  **Request Storm:** The Dashboard preloads up to 5 groups immediately on mount if they are not in the cache. This triggers 5 concurrent requests to `/api/groups/[id]`.
2.  **Waterfall/Parallelism:** In the API route, `bills` and `settlements` are already fetched in parallel using `Promise.all`. However, the `group` check happens before them, creating a small waterfall.
3.  **Authentication:** `auth()` is called at the beginning of the API route. If NextAuth session retrieval is slow (e.g., due to database lookups for the session), it will affect every request.

---

## 4. Next Steps
- Run the application and monitor the console logs.
- Identify the slowest components based on the `[GROUP API]`, `[DB]`, `[Query]`, and `[Preload]` logs.
- Compare timings between "New connection" and "Cached connection" to see if MongoDB cold starts are the issue.
- Observe if the "Request Storm" from the Dashboard (5 concurrent preloads) correlates with the 1s-7s response times reported.
