# Frontend Integration Plan (Backend & DB Connectivity)

This document outlines the exact changes required in the frontend to connect to the new SQL Server Node.js backend. The guiding principle is to **adapt the data at the API layer** so that the existing UI components (`GridEditor`, `DeveloperPage`, `AdminPage`) remain completely untouched and free from breaking changes.

## 1. Network Routing & Proxying
To prevent CORS issues and avoid hardcoding `http://localhost:4000` everywhere in the frontend, we must configure a rewrite proxy.

#### [MODIFY] `frontend/next.config.mjs`
- Add a `rewrites` function to proxy all `/api/:path*` requests to `http://localhost:4000/api/:path*`.
- **Why?** This ensures that existing `fetch('/api/layouts')` calls automatically hit the new Node.js backend instead of failing or hitting the old local routes.

## 2. API Adapter Layer (Data Transformation)
The new backend returns data structured directly from SQL tables (using `snake_case` like `ws_id`, `pos_x`), while the frontend's `lib/types.ts` strictly expects `camelCase` (like `id`, `x`, `width`).

#### [NEW] `frontend/lib/api-adapters.ts`
- Create a utility file containing mapping functions to intercept backend responses and format them for the UI.
- `mapLayoutList(backendRows)`: Maps `version_name` -> `name`, `imported_at` -> `createdAt`, `is_current_version` -> `isActive`.
- `mapFactoryStructure(backendLayout)`: Recursively maps:
  - `areas`: `area_id` -> `id`, `pos_x` -> `x`, `length` -> `height`.
  - `lines`: `line_id` -> `id`.
  - `workstations`: `ws_id` -> `id`, `pos_x` -> `x`, `length` -> `height`.
  - `flows`: `from_ws_id` -> `fromWsId`.
- **Why?** By mapping the payload here, not a single line of React component code in `grid-editor.tsx` needs to be modified. The canvas will continue rendering exactly as it does now.

## 3. Route Endpoint Updates
The URL paths and HTTP methods have changed significantly in the new backend. The API fetch calls within the React pages must be updated.

#### [MODIFY] `frontend/app/developer/page.tsx` & `frontend/app/(admin)/admin/page.tsx`
- **Fetching Lists**: Both pages currently fetch `/api/layouts`. They should wrap this call in the `mapLayoutList` adapter.
- **Upload CSV**: Update the endpoint from `POST /api/layouts` to `POST /api/admin/upload-csv`. After a successful upload, trigger an immediate secondary fetch to `/api/layouts/{layout_version_id}/view` to grab the newly parsed visual data for the preview canvas.
- **Pass to Admin**: Change `PUT /api/layouts/{id}/status` to `POST /api/layouts/{id}/pass-to-admin`.

#### [MODIFY] `frontend/components/admin/grid-editor.tsx` (or API wrapper)
- **Approve/Reject/Comment**: The `handleApprove` and `handleReject` functions must be updated to hit:
  - `POST /api/layouts/{id}/approve`
  - `POST /api/layouts/{id}/reject`
  - `POST /api/layouts/{id}/comment`
- **Canvas Saving**: The existing `onSave` prop currently fires the entire JSON blob. It needs to be updated to trigger the new granular endpoints:
  - `PATCH /api/layouts/{draftId}/sync` (maps `x`/`y` back to `pos_x`/`pos_y` for workstations)
  - `PATCH /api/layouts/{draftId}/sync-areas` (for area bounds)
  - `POST /api/layouts/{draftId}/commit` (to save the final version name)

#### [MODIFY] `frontend/app/editor/page.tsx` & `frontend/app/view/page.tsx`
- **Fetching Layout Details**: Instead of fetching all layouts and filtering locally by ID, update the `useEffect` to fetch `GET /api/layouts/{id}/view` (or `/api/layouts/active` if no ID is present). Pass the response through `mapFactoryStructure` before setting it to state.

## 4. Cleanup Obsolete Mock Data
Once the proxy and adapters are active, the old mock logic will conflict or become dead code.

#### [DELETE] `frontend/app/api/layouts` (entire folder)
- Remove the local Next.js Route Handlers. They will be replaced by the Node.js backend.

#### [DELETE] `frontend/lib/store.ts` & `frontend/lib/csv-handler.ts`
- The in-memory store and frontend CSV parsing logic are obsolete. The backend `upload.js` via `papaparse` directly handles database insertion now.

---

### Risk Assessment & Safety Guarantee
By isolating all structural changes to the data-fetching layer (Adapters) and configuring a Next.js Proxy, we guarantee that the complex drag-and-drop mechanics, canvas rendering, and UI styling remain **100% intact**. No database corruption can occur because the backend endpoints enforce strict SQL parameterization, and we are simply formatting the JSON payloads to match what those endpoints expect.
